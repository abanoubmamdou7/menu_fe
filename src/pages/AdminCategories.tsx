import React, { useState, useEffect, useMemo } from 'react';
import { useMenuCategories, MenuCategory } from '@/services/menuServices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CategoryFormData {
  itm_group_code: string;
  itm_group_name: string;
  website_name_en: string;
  show_in_website: boolean;
}

const AdminCategories = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentCategory, setCurrentCategory] = useState<MenuCategory | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [orderInputs, setOrderInputs] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    data: categories,
    isLoading: isLoadingCategories,
    refetch: refetchCategories
  } = useMenuCategories();

  const form = useForm<CategoryFormData>({
    defaultValues: {
      itm_group_code: '',
      itm_group_name: '',
      website_name_en: '',
      show_in_website: true
    }
  });

  useEffect(() => {
    if (currentCategory && isEditing) {
      form.reset({
        itm_group_code: currentCategory.id,
        itm_group_name: currentCategory.name,
        website_name_en: currentCategory.name,
        show_in_website: true
      });
    } else {
      form.reset({
        itm_group_code: '',
        itm_group_name: '',
        website_name_en: '',
        show_in_website: true
      });
    }
  }, [currentCategory, isEditing, form]);

  // Reset currentPage to 1 when searchTerm changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleAddCategory = () => {
    setIsEditing(false);
    setCurrentCategory(null);
    setIsOpen(true);
  };

  const handleEditCategory = (category: MenuCategory) => {
    setIsEditing(true);
    setCurrentCategory(category);
    setIsOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    try {
      const { error } = await supabase
        .from('item_main_group')
        .delete()
        .eq('itm_group_code', id);

      if (error) {
        toast.error("Failed to delete category");
      } else {
        toast.success("Category deleted successfully");
        refetchCategories();
      }
    } catch (error: any) {
      toast.error("Failed to delete category: " + error.message);
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (isEditing) {
        if (!data.itm_group_code) {
          throw new Error("Cannot update category: missing itm_group_code");
        }

        const { error } = await supabase
          .from('item_main_group')
          .update({
            itm_group_name: data.itm_group_name,
            website_name_en: data.website_name_en,
            show_in_website: data.show_in_website,
          })
          .eq('itm_group_code', data.itm_group_code);

        if (error) throw error;
        toast.success("Category updated successfully");
      } else {
        const { error } = await supabase
          .from('item_main_group')
          .insert({
            itm_group_code: data.itm_group_code,
            itm_group_name: data.itm_group_name,
            website_name_en: data.website_name_en,
            show_in_website: data.show_in_website,
          });

        if (error) throw error;
        toast.success("Category created successfully");
      }

      setIsOpen(false);
      refetchCategories();
    } catch (error: any) {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} category: ${error.message}`);
    }
  };

  const handleOrderChange = (id: string, value: string) => {
    setOrderInputs((prev) => ({ ...prev, [id]: value }));
  };

  const handleOrderSave = async (id: string) => {
    const order = parseInt(orderInputs[id], 10);
    if (isNaN(order)) {
      toast.error("Please enter a valid number for order");
      return;
    }
    try {
      const { error } = await supabase
        .from('item_main_group')
        .update({ order_group: order })
        .eq('itm_group_code', id);

      if (error) throw error;
      toast.success('Order updated successfully');
      refetchCategories();
    } catch (error: any) {
      toast.error('Failed to update order: ' + error.message);
    }
  };

  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    return categories
      .filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        // Handle null/undefined orderGroup, treat as 0 for sorting
        const orderA = a.orderGroup ?? 0;
        const orderB = b.orderGroup ?? 0;
        return orderA - orderB; // Ascending order
      });
  }, [categories, searchTerm]);

  // Calculate pagination data
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredCategories.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredCategories, currentPage]);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate page numbers for display
  const pageNumbers = useMemo(() => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }, [totalPages]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Categories</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={handleAddCategory} className="whitespace-nowrap">
            <Plus className="h-4 w-4 mr-1" /> Add Category
          </Button>
        </div>
      </div>

      {/* Category Table */}
      <div className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Order</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No categories found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedCategories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-mono text-sm">{category.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{category.name}</div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={orderInputs[category.id] ?? category.orderGroup ?? ''}
                      onChange={(e) => handleOrderChange(category.id, e.target.value)}
                      onBlur={() => handleOrderSave(category.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleOrderSave(category.id);
                      }}
                      className="w-20"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteCategory(category.id)}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <div className="flex overflow-x-auto max-w-[50%] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            <div className="flex gap-2">
              {pageNumbers.map(page => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className="min-w-[2.5rem]"
                >
                  {page}
                </Button>
              ))}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Add/Edit Category Form */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{isEditing ? 'Edit Category' : 'Add New Category'}</SheetTitle>
          </SheetHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="itm_group_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter unique category code"
                        {...field}
                        disabled={isEditing}
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="itm_group_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter category name"
                        {...field}
                        required
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website_name_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Name to display on website"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <SheetFooter className="pt-4">
                <SheetClose asChild>
                  <Button variant="outline" type="button">Cancel</Button>
                </SheetClose>
                <Button type="submit">{isEditing ? 'Update' : 'Create'}</Button>
              </SheetFooter>
            </form>
          </Form>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdminCategories;