import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MenuItem } from "@/services/menuServices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from 'sonner';

interface MenuItemWithBranch extends MenuItem {
  branchCode?: string | null;
}

const buildItemKey = (id: string, branchCode?: string | null) =>
  `${id ?? ""}__${branchCode ?? "default"}`;

const parseOrderValue = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const formatPriceValue = (value: unknown): string => {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  const numeric = Number(value);
  if (Number.isFinite(numeric)) {
    return `$${numeric.toFixed(2)}`;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return "";
    }
    return trimmed.startsWith("$") ? trimmed : `$${trimmed}`;
  }
  return "";
};

const normalizeSupabaseItem = (raw: Record<string, unknown>): MenuItemWithBranch => {
  const itemOrder = parseOrderValue(
    raw?.item_order ?? raw?.itemOrder ?? raw?.order ?? 0
  );
  const price = formatPriceValue(
    raw?.sales_price ?? raw?.salesPrice ?? raw?.price
  );

  return {
    id: (raw?.itm_code ?? raw?.id ?? "") as string,
    name: (raw?.website_name_en ?? raw?.itm_name ?? raw?.name ?? "") as string,
    nameAr: (raw?.website_name_ar ?? raw?.itm_name_ar ?? raw?.nameAr ?? "") as string,
    description: (raw?.website_description_en ?? raw?.description ?? "") as string,
    descriptionAr: (raw?.website_description_ar ?? raw?.descriptionAr ?? "") as string,
    price,
    sales_price: price,
    category: (raw?.itm_group_code ?? raw?.category ?? "") as string,
    image: raw?.image as string | { data: string } | undefined,
    photo_url: raw?.photo_url as string | Uint8Array | undefined,
    order: itemOrder,
    itemOrder,
    show_in_website: raw?.show_in_website as MenuItem["show_in_website"],
    saleable: raw?.saleable as MenuItem["saleable"],
    fasting: raw?.fasting as boolean | undefined,
    vegetarian: raw?.vegetarian as boolean | undefined,
    healthyChoice: (raw?.healthyChoice ?? raw?.healthy_choice) as boolean | undefined,
    signatureDish: (raw?.signatureDish ?? raw?.signature_dish) as boolean | undefined,
    spicy: raw?.spicy as boolean | undefined,
    tagIcons: (raw?.tagIcons as MenuItem["tagIcons"]) ?? undefined,
    branchCode: (raw?.branch_code ?? raw?.branchCode ?? null) as string | null | undefined,
  };
};

interface MenuItemsTableProps {
  items: MenuItem[];
  onEditItem: (item: MenuItem) => void;
  onDeleteItem: (id: string) => void;
}

const MenuItemsTable: React.FC<MenuItemsTableProps> = ({
  items,
  onEditItem,
  onDeleteItem
}) => {
  const [itemOrderInputs, setItemOrderInputs] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [allItems, setAllItems] = useState<MenuItemWithBranch[]>([]);
  const [isFetchingAllItems, setIsFetchingAllItems] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [savingItemOrders, setSavingItemOrders] = useState<Record<string, boolean>>({});

  const handleItemOrderChange = (itemKey: string, value: string) => {
    setItemOrderInputs(prev => ({ ...prev, [itemKey]: value }));
  };

  const normalizedItemsFromProps = useMemo<MenuItemWithBranch[]>(() =>
    items.map((item) => {
      const itemWithBranch = item as MenuItemWithBranch & { branch_code?: string | null };
      return {
        ...itemWithBranch,
        branchCode: itemWithBranch.branchCode ?? itemWithBranch.branch_code ?? null,
      };
    }), [items]
  );

  const fetchAllItems = useCallback(async () => {
    setIsFetchingAllItems(true);
    try {
      const { data, error } = await supabase
        .from('item_master')
        .select(`
          itm_code,
          itm_name,
          website_name_en,
          website_name_ar,
          website_description_en,
          website_description_ar,
          sales_price,
          itm_group_code,
          image,
          photo_url,
          item_order,
          show_in_website,
          saleable,
          branch_code
        `)
        .order('item_order', { ascending: true });

      if (error) {
        throw error;
      }

      const normalized =
        Array.isArray(data) && data.length > 0
          ? data.map((item) => normalizeSupabaseItem(item as Record<string, unknown>))
          : [];

      setAllItems(normalized);
      setFetchError(null);
      setCurrentPage(1);
    } catch (error: any) {
      console.error("Failed to fetch menu items for all branches", error);
      setFetchError(error?.message || "Failed to load menu items for all branches");
      toast.error("Failed to load menu items for all branches");
    } finally {
      setIsFetchingAllItems(false);
    }
  }, []);

  useEffect(() => {
    fetchAllItems();
  }, [fetchAllItems]);

  const activeItems = useMemo<MenuItemWithBranch[]>(() => {
    if (allItems.length > 0) {
      return allItems;
    }
    return normalizedItemsFromProps;
  }, [allItems, normalizedItemsFromProps]);

  const handleItemOrderSave = async (item: MenuItemWithBranch, itemKey: string) => {
    const rawInput = itemOrderInputs[itemKey]?.trim();
    const itemOrder = Number(rawInput);

    if (!rawInput || isNaN(itemOrder)) {
      toast.error("Please enter a valid number for item order");
      return;
    }

    try {
      setSavingItemOrders(prev => ({ ...prev, [itemKey]: true }));

      let updateQuery = supabase
        .from('item_master')
        .update({ item_order: itemOrder })
        .eq('itm_code', item.id);

      if (item.branchCode) {
        updateQuery = updateQuery.eq('branch_code', item.branchCode);
      }

      const { error } = await updateQuery;

      if (error) throw error;
      toast.success("Item order updated successfully");
      setItemOrderInputs(prev => {
        const next = { ...prev };
        delete next[itemKey];
        return next;
      });
      setAllItems(prev => {
        if (prev.length === 0) {
          return prev;
        }
        return prev.map(existing => {
          if (existing.id !== item.id) {
            return existing;
          }

          if (item.branchCode && existing.branchCode && existing.branchCode !== item.branchCode) {
            return existing;
          }

          return {
            ...existing,
            itemOrder,
            order: itemOrder,
          };
        });
      });
      await fetchAllItems();
    } catch (error: any) {
      toast.error("Failed to update item order: " + error.message);
    } finally {
      setSavingItemOrders(prev => {
        const next = { ...prev };
        delete next[itemKey];
        return next;
      });
    }
  };

  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | 'price' | 'itemOrder';
    direction: 'ascending' | 'descending';
  }>({
    key: 'itemOrder',
    direction: 'ascending'
  });

  const requestSort = (key: 'name' | 'price' | 'itemOrder') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending'
    }));
    setCurrentPage(1); // Reset to first page on sort change
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending'
      ? <ArrowUp className="ml-1 h-3 w-3" />
      : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  const sortedItems = useMemo(() => {
    return [...activeItems].sort((a, b) => {
      let aValue: number | string, bValue: number | string;

      if (sortConfig.key === 'price') {
        aValue = parseFloat(a.price?.replace("$", "") || "0");
        bValue = parseFloat(b.price?.replace("$", "") || "0");
      } else if (sortConfig.key === 'itemOrder') {
        aValue = a.itemOrder ?? 0;
        bValue = b.itemOrder ?? 0;
      } else { // name
        aValue = (a.name || "").toLowerCase();
        bValue = (b.name || "").toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [activeItems, sortConfig]);

  // Calculate pagination data
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedItems.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedItems, currentPage]);

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
            <TableHead className="cursor-pointer" onClick={() => requestSort('name')}>
              <div className="flex items-center">Name {getSortIcon('name')}</div>
            </TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="cursor-pointer" onClick={() => requestSort('price')}>
              <div className="flex items-center">Price {getSortIcon('price')}</div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => requestSort('itemOrder')}>
              <div className="flex items-center">Item Order {getSortIcon('itemOrder')}</div>
            </TableHead>
            <TableHead>Branch</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isFetchingAllItems ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Loading menu items...
              </TableCell>
            </TableRow>
          ) : paginatedItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No menu items found.
              </TableCell>
            </TableRow>
          ) : (
            paginatedItems.map(item => {
              const itemKey = buildItemKey(item.id, item.branchCode);
              return (
                <TableRow key={itemKey}>
                  <TableCell className="font-mono text-sm">{item.id}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.price?.replace("$", "")}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={itemOrderInputs[itemKey] ?? item.itemOrder ?? ''}
                      onChange={(e) => handleItemOrderChange(itemKey, e.target.value)}
                      onBlur={() => handleItemOrderSave(item, itemKey)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleItemOrderSave(item, itemKey);
                      }}
                      className="w-20"
                      disabled={savingItemOrders[itemKey]}
                    />
                  </TableCell>
                  <TableCell>{item.branchCode ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onEditItem(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteItem(item.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
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
    </div>
  );
};

export default MenuItemsTable;