import React, { useState, useEffect, useCallback } from 'react';
import { useMenuItems, uploadMenuItemPhoto, MenuCategory, MenuItem } from '@/services/menuServices';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import MenuItemsTable from '@/components/admin/menuItems/MenuItemsTable';
import MenuItemDialog from '@/components/admin/menuItems/MenuItemDialog';
import { Search } from 'lucide-react';

interface MenuItemFormData {
  itm_code: string;
  itm_name: string;
  website_name_en: string;
  website_name_ar: string;
  website_description_en: string;
  website_description_ar: string;
  sales_price: string;
  itm_group_code: string;
  photo_url: string;
  image: string;
  show_in_website: boolean;
  fasting: boolean;
  vegetarian: boolean;
  healthyChoice: boolean;
  signatureDish: boolean;
  spicy: boolean;
}

const AdminMenuItems = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<MenuItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { 
    data: menuItems, 
    isLoading: isLoadingItems,
    refetch: refetchItems
  } = useMenuItems();

  interface MenuCategoryWithBranch extends MenuCategory {
    branchCode?: string | null;
  }

  const [categories, setCategories] = useState<MenuCategoryWithBranch[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState<boolean>(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const normalizeCategory = useCallback((raw: Record<string, unknown>): MenuCategoryWithBranch | null => {
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

    const id = (raw?.itm_group_code ?? raw?.id ?? '') as string;
    if (!id) {
      return null;
    }

    const branchCode = (raw?.branch_code ?? raw?.branchCode ?? null) as string | null;

    return {
      id,
      name: (raw?.website_name_en ?? raw?.itm_group_name ?? raw?.name ?? '') as string,
      nameAr: (raw?.website_name_ar ?? raw?.itm_group_name_ar ?? '') as string,
      orderGroup: Number.isFinite(orderGroup) ? orderGroup : 0,
      nested_level: Number.isFinite(nested_level) ? nested_level : 1,
      parent_group_code: (raw?.parent_group_code ?? raw?.parentGroupCode ?? null) as string | null,
      path: (raw?.path ?? '') as string,
      children: [],
      branchCode,
    };
  }, []);

  const fetchCategories = useCallback(async () => {
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
          ? data
              .map((category) => normalizeCategory(category as Record<string, unknown>))
              .filter((category): category is MenuCategoryWithBranch => Boolean(category))
          : [];

      setCategories(normalized);
      setCategoryError(null);
    } catch (error) {
      console.error('Failed to fetch categories', error);
      const message = error instanceof Error ? error.message : 'Failed to load categories';
      setCategoryError(message);
      toast.error(message);
    } finally {
      setIsLoadingCategories(false);
    }
  }, [normalizeCategory]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetchItems();
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchItems]);

  const handleAddItem = () => {
    setIsEditing(false);
    setCurrentItem(null);
    setIsOpen(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setIsEditing(true);
    setCurrentItem(item);
    setIsOpen(true);
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    
    try {
      const { error } = await supabase
        .from('item_master')
        .delete()
        .eq('itm_code', id);
      
      if (error) throw error;
      
      toast.success("Item deleted successfully");
      refetchItems();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete item';
      toast.error(`Failed to delete item: ${message}`);
    }
  };

  const handleSubmitItem = async (data: MenuItemFormData, photoFile: File | null) => {
    try {
      let photoUrl = data.photo_url;
      
      if (photoFile) {
        const uploadedUrl = await uploadMenuItemPhoto(photoFile, data.itm_code);
        if (uploadedUrl) {
          photoUrl = uploadedUrl;
        }
      }
      
      if (isEditing && currentItem) {
        const { error } = await supabase
          .from('item_master')
          .update({
            itm_name: data.itm_name,
            website_name_en: data.website_name_en,
            website_name_ar: data.website_name_ar,
            website_description_en: data.website_description_en,
            website_description_ar: data.website_description_ar,
            sales_price: data.sales_price ? parseFloat(data.sales_price) : null,
            itm_group_code: data.itm_group_code,
            image: data.image,
            show_in_website: true,
            fasting: data.fasting === true,
            vegetarian: data.vegetarian === true,
            healthy_choice: data.healthyChoice === true,
            signature_dish: data.signatureDish === true,
            spicy: data.spicy === true,
          })
          .eq('itm_code', data.itm_code);
        
        if (error) throw error;
        toast.success("Item updated successfully");
      } else {
        const { error } = await supabase
          .from('item_master')
          .insert({
            itm_code: data.itm_code,
            itm_name: data.itm_name,
            website_name_en: data.website_name_en,
            website_name_ar: data.website_name_ar,
            website_description_en: data.website_description_en,
            website_description_ar: data.website_description_ar,
            sales_price: data.sales_price ? parseFloat(data.sales_price) : null,
            itm_group_code: data.itm_group_code,
            image: data.image,
            show_in_website: true,
            fasting: data.fasting === true,
            vegetarian: data.vegetarian === true,
            healthy_choice: data.healthyChoice === true,
            signature_dish: data.signatureDish === true,
            spicy: data.spicy === true,
          });

        if (error) throw error;
        toast.success("Item created successfully");
      }
      
      setIsOpen(false);
      setCurrentItem(null);
      refetchItems();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} item: ${message}`);
    }
  };

  if (isLoadingItems || isLoadingCategories) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {categoryError && (
        <div className="border border-red-200 bg-red-50 text-red-600 text-sm rounded-md px-4 py-2">
          {categoryError}
        </div>
      )}

      <MenuItemsTable 
        items={menuItems ?? []}
        onEditItem={handleEditItem}
        onDeleteItem={handleDeleteItem}
        onAddItem={handleAddItem}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <MenuItemDialog
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        isEditing={isEditing}
        currentItem={currentItem}
        categories={categories}
        onSubmit={handleSubmitItem}
      />
    </div>
  );
};

export default AdminMenuItems;