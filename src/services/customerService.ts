import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface CustomerDetails {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CustomerFormValues {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  notes?: string;
}

// Fetch all customers
export const fetchCustomers = async (): Promise<CustomerDetails[]> => {
  try {
    const { data, error } = await supabase
      .from('customer_details')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching customers:', error);
    throw new Error('Failed to fetch customers');
  }
};


// Add a new customer
export const addCustomer = async (customer: CustomerFormValues): Promise<CustomerDetails> => {
  const { data, error } = await supabase
    .from('customer_details')
    .insert([customer])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const updateCustomer = async (id: string, customer: CustomerFormValues): Promise<CustomerDetails | null> => {
  try {
    const { data, error } = await supabase
      .from('customer_details')
      .update(customer)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    console.error('Error updating customer:', error);
    throw new Error('Failed to update customer');
  }
};

// Delete a customer
export const deleteCustomer = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('customer_details')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting customer:', error);
    throw new Error('Failed to delete customer');
  }
};

// React Query hooks
export const useCustomers = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });
};

export const useAddCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: addCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, formData }: { id: string; formData: CustomerFormValues }) => 
      updateCustomer(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};
