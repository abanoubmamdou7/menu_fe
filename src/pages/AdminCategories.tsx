import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MenuCategory } from '@/services/menuServices';
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
  branch_code: string;
}

interface MenuCategoryWithBranch extends MenuCategory {
  branchCode?: string | null;
}

const buildCategoryKey = (id: string, branchCode?: string | null) =>
  `${id ?? ''}__${branchCode ?? 'default'}`;

const AdminCategories = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentCategory, setCurrentCategory] = useState<MenuCategoryWithBranch | null>(null);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [orderInputs, setOrderInputs] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [categories, setCategories] = useState<MenuCategoryWithBranch[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const form = useForm<CategoryFormData>({
    defaultValues: {
      itm_group_code: '',
      itm_group_name: '',
      website_name_en: '',
      show_in_website: true,
      branch_code: ''
    }
  });

  useEffect(() => {
    if (currentCategory && isEditing) {
      form.reset({
        itm_group_code: currentCategory.id,
        itm_group_name: currentCategory.name,
        website_name_en: currentCategory.name,
        show_in_website: true,
        branch_code: currentCategory.branchCode ?? ''
      });
    } else {
      form.reset({
        itm_group_code: '',
        itm_group_name: '',
        website_name_en: '',
        show_in_website: true,
        branch_code: ''
      });
    }
  }, [currentCategory, isEditing, form]);

  // Reset currentPage to 1 when searchTerm changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const normalizeCategory = (raw: Record<string, unknown>): MenuCategoryWithBranch => {
    const orderGroupRaw = raw?.order_group ?? raw?.orderGroup ?? 0;
    const orderGroup =
      typeof orderGroupRaw === 'number'
        ? orderGroupRaw
        : typeof orderGroupRaw === 'string'
        ? Number(orderGroupRaw)
        : 0;

    const nestedLevelRaw = raw?.nested_level ?? raw?.nestedLevel ?? 1;
    const nested_level =
      typeof nestedLevelRaw === 'number'
        ? nestedLevelRaw
        : typeof nestedLevelRaw === 'string'
        ? Number(nestedLevelRaw)
        : 1;

    return {
      id: (raw?.itm_group_code ?? raw?.id ?? '') as string,
      name: (raw?.website_name_en ?? raw?.itm_group_name ?? raw?.name ?? '') as string,
      nameAr: (raw?.website_name_ar ?? raw?.itm_group_name_ar ?? '') as string,
      orderGroup: Number.isFinite(orderGroup) ? orderGroup : 0,
      nested_level: Number.isFinite(nested_level) ? nested_level : 1,
      parent_group_code: (raw?.parent_group_code ?? raw?.parentGroupCode ?? null) as string | null,
      path: (raw?.path ?? '') as string,
      children: [],
      branchCode: (raw?.branch_code ?? raw?.branchCode ?? null) as string | null,
    };
  };

  const fetchAllCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const { data, error } = await supabase
        .from('item_main_group')
        .select(`
          itm_group_code,
          itm_group_name,
          website_name_en,
          website_name_ar,
          order_group,
          nested_level,
          parent_group_code,
          path,
          branch_code
        `)
        .order('order_group', { ascending: true });

      if (error) {
        throw error;
      }

      const normalized =
        Array.isArray(data) && data.length > 0
          ? data.map((category) => normalizeCategory(category as Record<string, unknown>))
          : [];

      setCategories(normalized);
      setFetchError(null);
      setOrderInputs({});
      setCurrentPage(1);
    } catch (error: any) {
      console.error('Failed to fetch categories for all branches', error);
      setFetchError(error?.message || 'Failed to load categories for all branches');
      toast.error('Failed to load categories for all branches');
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    fetchAllCategories();
  }, [fetchAllCategories]);

  const handleAddCategory = () => {
    setIsEditing(false);
    setCurrentCategory(null);
    setIsOpen(true);
  };

  const handleEditCategory = (category: MenuCategoryWithBranch) => {
    setIsEditing(true);
    setCurrentCategory(category);
    setIsOpen(true);
  };

  const handleDeleteCategory = async (category: MenuCategoryWithBranch) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;

    try {
      let deleteQuery = supabase
        .from('item_main_group')
        .delete()
        .eq('itm_group_code', category.id);

      if (category.branchCode) {
        deleteQuery = deleteQuery.eq('branch_code', category.branchCode);
      }

      const { error } = await deleteQuery;

      if (error) {
        toast.error("Failed to delete category");
      } else {
        toast.success("Category deleted successfully");
        await fetchAllCategories();
      }
    } catch (error: any) {
      toast.error("Failed to delete category: " + error.message);
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      if (!data.branch_code?.trim()) {
        throw new Error('Branch code is required');
      }

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
          .eq('itm_group_code', data.itm_group_code)
          .eq('branch_code', data.branch_code);

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
            branch_code: data.branch_code,
          });

        if (error) throw error;
        toast.success("Category created successfully");
      }

      setIsOpen(false);
      await fetchAllCategories();
    } catch (error: any) {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} category: ${error.message}`);
    }
  };

  const handleOrderChange = (categoryKey: string, value: string) => {
    setOrderInputs((prev) => ({ ...prev, [categoryKey]: value }));
  };

  const handleOrderSave = async (category: MenuCategoryWithBranch, categoryKey: string) => {
    const order = parseInt(orderInputs[categoryKey], 10);
    if (isNaN(order)) {
      toast.error("Please enter a valid number for order");
      return;
    }
    try {
      let updateQuery = supabase
        .from('item_main_group')
        .update({ order_group: order })
        .eq('itm_group_code', category.id);

      if (category.branchCode) {
        updateQuery = updateQuery.eq('branch_code', category.branchCode);
      }

      const { error } = await updateQuery;

      if (error) throw error;
      toast.success('Order updated successfully');
      setOrderInputs(prev => {
        const next = { ...prev };
        delete next[categoryKey];
        return next;
      });
      await fetchAllCategories();
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
            {/* <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            /> */}
          </div>
          <Button onClick={handleAddCategory} className="whitespace-nowrap">
            <Plus className="h-4 w-4 mr-1" /> Add Category
          </Button>
        </div>
      </div>

      {/* Category Table */}
      <div className="border rounded-md overflow-hidden">
        {fetchError && (
          <div className="bg-red-50 text-sm text-red-600 px-4 py-2 border-b border-red-100">
            {fetchError}
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingCategories ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Loading categories...
                </TableCell>
              </TableRow>
            ) : paginatedCategories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No categories found.
                </TableCell>
              </TableRow>
            ) : (
              paginatedCategories.map((category) => {
                const categoryKey = buildCategoryKey(category.id, category.branchCode);
                return (
                  <TableRow key={categoryKey}>
                    <TableCell className="font-mono text-sm">{category.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{category.name}</div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={orderInputs[categoryKey] ?? category.orderGroup ?? ''}
                        onChange={(e) => handleOrderChange(categoryKey, e.target.value)}
                        onBlur={() => handleOrderSave(category, categoryKey)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleOrderSave(category, categoryKey);
                        }}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>{category.branchCode ?? '—'}</TableCell>
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
                          onClick={() => handleDeleteCategory(category)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
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

              <FormField
                control={form.control}
                name="branch_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Branch Code</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter branch code"
                        {...field}
                        required
                        disabled={isEditing}
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