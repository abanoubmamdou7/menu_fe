
import React from 'react';
import { format } from 'date-fns';
import { CustomerDetails } from '@/services/customerService';
import { Button } from '@/components/ui/button';
import { Edit, Trash2 } from 'lucide-react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface CustomersTableProps {
  customers: CustomerDetails[];
  isLoading: boolean;
  searchTerm: string;
  onEditCustomer: (customer: CustomerDetails) => void;
  onDeleteCustomer: (id: string) => void;
}

const CustomersTable: React.FC<CustomersTableProps> = ({
  customers,
  isLoading,
  searchTerm,
  onEditCustomer,
  onDeleteCustomer
}) => {
  const filteredCustomers = React.useMemo(() => {
    if (!customers) return [];
    return customers.filter(customer => 
      customer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      customer.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (customer.phone && customer.phone.includes(searchTerm))
    );
  }, [customers, searchTerm]);

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8">
                Loading...
              </TableCell>
            </TableRow>
          ) : filteredCustomers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                No customers found.
              </TableCell>
            </TableRow>
          ) : (
            filteredCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{customer.first_name} {customer.last_name}</div>
                    {customer.notes && (
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {customer.notes}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    {customer.email && (
                      <div className="text-sm">{customer.email}</div>
                    )}
                    {customer.phone && (
                      <div className="text-sm">{customer.phone}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {format(new Date(customer.created_at), 'PPp')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditCustomer(customer)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteCustomer(customer.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default CustomersTable;
