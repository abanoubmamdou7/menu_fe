
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from '@/components/ui/form';

const RegisterForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create a schema for form validation
  const formSchema = z.object({
    name: z.string().min(1, { message: t('nameRequired') }),
    email: z.string().email().optional(),
    phone: z.string().optional(),
  }).refine((data) => data.email || data.phone, {
    message: t('emailOrPhoneRequired'),
    path: ['email'],
  });

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    
    try {
      // Split name into first and last name
      const nameParts = values.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

      // Prepare customer data
      const customerData = {
        first_name: firstName,
        last_name: lastName,
        email: values.email || null,
        phone: values.phone || null,
        notes: null
      };

      console.log("Form submitted:", values);
      console.log("Customer data to insert:", customerData);
      
      // Insert customer data into the database
      const { error } = await supabase
        .from('customer_details')
        .insert([customerData]);

      if (error) {
        console.error('Error registering customer:', error);
        throw new Error(error.message);
      }

      // Show success message
      toast(t('registerSuccess'), {
        description: `${values.name}`
      });

      // Reset form and navigate to home page
      form.reset();
      
      // Navigate to home page after a brief delay
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      console.error('Registration error:', error);
      toast(t('registerError'), {
        description: error instanceof Error ? error.message : 'Unknown error',
        style: { backgroundColor: 'red', color: 'white' }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('name')}</FormLabel>
              <FormControl>
                <Input placeholder={t('name')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('email')}</FormLabel>
              <FormControl>
                <Input type="email" placeholder={t('email')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('phone')}</FormLabel>
              <FormControl>
                <Input type="tel" placeholder={t('phone')} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button 
          type="submit" 
          className="w-full bg-restaurant-primary text-white" 
          disabled={isSubmitting}
        >
          {isSubmitting ? t('submitting') : t('submit')}
        </Button>
      </form>
    </Form>
  );
};

export default RegisterForm;
