import React, { useState, useMemo } from 'react';
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

  const handleItemOrderChange = (id: string, value: string) => {
    setItemOrderInputs(prev => ({ ...prev, [id]: value }));
  };

  const handleItemOrderSave = async (id: string) => {
    const rawInput = itemOrderInputs[id]?.trim();
    const itemOrder = Number(rawInput);

    if (!rawInput || isNaN(itemOrder)) {
      toast.error("Please enter a valid number for item order");
      return;
    }

    try {
      const { error } = await supabase
        .from('item_master')
        .update({ item_order: itemOrder })
        .eq('itm_code', id);

      if (error) throw error;
      toast.success("Item order updated successfully");
    } catch (error: any) {
      toast.error("Failed to update item order: " + error.message);
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
    return [...items].sort((a, b) => {
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
  }, [items, sortConfig]);

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
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No menu items found.
              </TableCell>
            </TableRow>
          ) : (
            paginatedItems.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-sm">{item.id}</TableCell>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.price?.replace("$", "")}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={itemOrderInputs[item.id] ?? item.itemOrder ?? ''}
                    onChange={(e) => handleItemOrderChange(item.id, e.target.value)}
                    onBlur={() => handleItemOrderSave(item.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleItemOrderSave(item.id);
                    }}
                    className="w-20"
                  />
                </TableCell>
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
            ))
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