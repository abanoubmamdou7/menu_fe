import React, { useState, useMemo } from 'react';
import { useMenuItems, useMenuCategories, uploadMenuItemPhoto } from '@/services/menuServices';
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
}

const AdminMenuItems = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  const { 
    data: menuItems, 
    isLoading: isLoadingItems,
    refetch: refetchItems
  } = useMenuItems();

  const { 
    data: categories,
    isLoading: isLoadingCategories
  } = useMenuCategories();

  const filteredItems = useMemo(() => {
    if (!menuItems) return [];
    
    return menuItems
      .filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        const priceA = parseFloat(String(a.sales_price)) || 0;
        const priceB = parseFloat(String(b.sales_price)) || 0;
        return priceB - priceA; // Ascending order by price
      });
  }, [menuItems, searchTerm]);

  const handleAddItem = () => {
    setIsEditing(false);
    setCurrentItem(null);
    setIsOpen(true);
  };

  const handleEditItem = (item) => {
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
    } catch (error: any) {
      toast.error("Failed to delete item: " + error.message);
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
            show_in_website: true
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
            show_in_website: true
          });

        if (error) throw error;
        toast.success("Item created successfully");
      }
      
      setIsOpen(false);
      setCurrentItem(null);
      refetchItems();
    } catch (error: any) {
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} item: ${error.message}`);
    }
  };

  if (isLoadingItems || isLoadingCategories) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold">Menu Items</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button onClick={handleAddItem}>
            Add New Item
          </Button>
        </div>
      </div>

      <MenuItemsTable 
        items={filteredItems}
        onEditItem={handleEditItem}
        onDeleteItem={handleDeleteItem}
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