import React, { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MenuItem } from "@/services/menuServices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  LayoutTemplate,
  RefreshCw,
  Search,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

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
    fasting: raw?.fasting === true,
    vegetarian: raw?.vegetarian === true,
    healthyChoice:
      raw?.healthyChoice === true || raw?.healthy_choice === true,
    signatureDish:
      raw?.signatureDish === true || raw?.signature_dish === true,
    spicy: raw?.spicy === true,
    tagIcons: (raw?.tagIcons as MenuItem["tagIcons"]) ?? undefined,
    branchCode: (raw?.branch_code ?? raw?.branchCode ?? null) as string | null | undefined,
  };
};

interface MenuItemsTableProps {
  items: MenuItem[];
  onEditItem: (item: MenuItem) => void;
  onDeleteItem: (id: string) => void;
  onAddItem: () => void;
  onRefresh?: () => Promise<void> | void;
  isRefreshing?: boolean;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const ITEMS_PER_PAGE = 10;
const priceToNumber = (price?: string | null) =>
  Number.parseFloat((price ?? "").replace(/^\$/, "")) || 0;

const MenuItemsTable: React.FC<MenuItemsTableProps> = ({
  items,
  onEditItem,
  onDeleteItem,
  onAddItem,
  onRefresh,
  isRefreshing: externalRefreshing = false,
  searchTerm,
  onSearchChange,
}) => {
  const [itemOrderInputs, setItemOrderInputs] = useState<
    Record<string, string>
  >({});
  const [currentPage, setCurrentPage] = useState(1);
  const [allItems, setAllItems] = useState<MenuItemWithBranch[]>([]);
  const [isFetchingAllItems, setIsFetchingAllItems] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [savingItemOrders, setSavingItemOrders] = useState<
    Record<string, boolean>
  >({});
  const [isLocalRefreshing, setIsLocalRefreshing] = useState(false);
  const refreshing = isLocalRefreshing || externalRefreshing;

  const handleItemOrderChange = useCallback(
    (itemKey: string, value: string) => {
      setItemOrderInputs((previous) => ({ ...previous, [itemKey]: value }));
    },
    []
  );

  const normalizedItemsFromProps = useMemo<MenuItemWithBranch[]>(
    () =>
      items.map((item) => {
        const itemWithBranch = item as MenuItemWithBranch & {
          branch_code?: string | null;
        };
        return {
          ...itemWithBranch,
          branchCode:
            itemWithBranch.branchCode ?? itemWithBranch.branch_code ?? null,
          fasting: itemWithBranch.fasting === true,
          vegetarian: itemWithBranch.vegetarian === true,
          healthyChoice: itemWithBranch.healthyChoice === true,
          signatureDish: itemWithBranch.signatureDish === true,
          spicy: itemWithBranch.spicy === true,
        };
      }),
    [items]
  );

  const fetchAllItems = useCallback(async () => {
    setIsFetchingAllItems(true);
    try {
      const { data, error } = await supabase
        .from("item_master")
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
          branch_code,
          fasting,
          vegetarian,
          healthy_choice,
          signature_dish,
          spicy
        `)
        .order("item_order", { ascending: true });

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
    } catch (error) {
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

  const handleRefreshClick = useCallback(async () => {
    setIsLocalRefreshing(true);
    try {
      await fetchAllItems();
      if (onRefresh) {
        await Promise.resolve(onRefresh());
      }
    } finally {
      setIsLocalRefreshing(false);
    }
  }, [fetchAllItems, onRefresh]);

  const baseItems = useMemo<MenuItemWithBranch[]>(() => {
    if (allItems.length > 0) {
      return allItems;
    }
    return normalizedItemsFromProps;
  }, [allItems, normalizedItemsFromProps]);

  const filteredItems = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return baseItems;
    return baseItems.filter((item) => {
      const nameMatch = item.name?.toLowerCase().includes(term);
      const descMatch = item.description?.toLowerCase().includes(term);
      const idMatch = item.id?.toLowerCase().includes(term);
      const categoryMatch = item.category?.toLowerCase().includes(term);
      return nameMatch || descMatch || idMatch || categoryMatch;
    });
  }, [baseItems, searchTerm]);

  const totalCount = baseItems.length;
  const filteredCount = filteredItems.length;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleItemOrderSave = async (item: MenuItemWithBranch, itemKey: string) => {
    const rawInput = itemOrderInputs[itemKey]?.trim();
    const itemOrder = Number(rawInput);

    if (!rawInput || isNaN(itemOrder)) {
      toast.error("Please enter a valid number for item order");
      return;
    }

    try {
      setSavingItemOrders((prev) => ({ ...prev, [itemKey]: true }));

      let updateQuery = supabase
        .from("item_master")
        .update({ item_order: itemOrder })
        .eq("itm_code", item.id);

      if (item.branchCode) {
        updateQuery = updateQuery.eq("branch_code", item.branchCode);
      }

      const { error } = await updateQuery;

      if (error) throw error;
      toast.success("Item order updated successfully");
      setItemOrderInputs((prev) => {
        const next = { ...prev };
        delete next[itemKey];
        return next;
      });
      setAllItems((prev) => {
        if (prev.length === 0) {
          return prev;
        }
        return prev.map((existing) => {
          if (existing.id !== item.id) {
            return existing;
          }

          if (
            item.branchCode &&
            existing.branchCode &&
            existing.branchCode !== item.branchCode
          ) {
            return existing;
          }

          return {
            ...existing,
            itemOrder,
            order: itemOrder,
          };
        });
      });
    } catch (error) {
      toast.error("Failed to update item order: " + error.message);
    } finally {
      setSavingItemOrders((prev) => {
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
    return [...filteredItems].sort((a, b) => {
      let aValue: number | string, bValue: number | string;

      if (sortConfig.key === "price") {
        aValue = priceToNumber(a.price);
        bValue = priceToNumber(b.price);
      } else if (sortConfig.key === "itemOrder") {
        aValue = a.itemOrder ?? 0;
        bValue = b.itemOrder ?? 0;
      } else {
        aValue = (a.name || "").toLowerCase();
        bValue = (b.name || "").toLowerCase();
      }

      if (aValue < bValue)
        return sortConfig.direction === "ascending" ? -1 : 1;
      if (aValue > bValue)
        return sortConfig.direction === "ascending" ? 1 : -1;
      return 0;
    });
  }, [filteredItems, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentPage, sortedItems]);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, index) => index + 1),
    [totalPages]
  );

  const tableSkeleton = useMemo(
    () =>
      Array.from({ length: ITEMS_PER_PAGE }, (_, index) => (
        <TableRow key={`items-skeleton-${index}`}>
          <TableCell>
            <Skeleton className="h-4 w-24 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-40 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-28 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-20 rounded-md" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20 rounded-full" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="ml-auto h-8 w-20 rounded-md" />
          </TableCell>
        </TableRow>
      )),
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-orange-100 bg-white/95 p-6 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 shadow-lg">
                <LayoutTemplate className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Menu Items
              </h2>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Review branch items, adjust ordering, and manage menu entries.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(event) => onSearchChange(event.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={refreshing || isFetchingAllItems}
                onClick={handleRefreshClick}
                className="border-orange-200 text-orange-600 hover:border-orange-300 hover:bg-orange-50"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                type="button"
                onClick={onAddItem}
                className="bg-gradient-to-r from-orange-500 to-orange-600 shadow-md hover:from-orange-600 hover:to-orange-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Item
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-orange-200 bg-orange-50 text-orange-700"
            >
              Total: {totalCount}
            </Badge>
            {searchTerm && (
              <Badge
                variant="secondary"
                className="border-orange-200 bg-orange-100 text-orange-700"
              >
                Showing {filteredCount} results
              </Badge>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-orange-100">
          {fetchError && (
            <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
              {fetchError}
            </div>
          )}
          <Table>
            <TableHeader className="bg-orange-50/40">
              <TableRow className="uppercase text-xs tracking-wide text-gray-500">
                <TableHead className="w-[160px]">Item Code</TableHead>
                <TableHead
                  className="cursor-pointer"
                  onClick={() => requestSort("name")}
                >
                  <div className="flex items-center gap-1">
                    Name {getSortIcon("name")}
                  </div>
                </TableHead>
                <TableHead className="w-[160px]">Category</TableHead>
                <TableHead
                  className="w-[140px] cursor-pointer"
                  onClick={() => requestSort("price")}
                >
                  <div className="flex items-center gap-1">
                    Price {getSortIcon("price")}
                  </div>
                </TableHead>
                <TableHead
                  className="w-[140px] cursor-pointer"
                  onClick={() => requestSort("itemOrder")}
                >
                  <div className="flex items-center gap-1">
                    Order {getSortIcon("itemOrder")}
                  </div>
                </TableHead>
                <TableHead className="w-[150px]">Branch</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isFetchingAllItems || refreshing ? (
                tableSkeleton
              ) : paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="py-10 text-center text-sm text-muted-foreground"
                  >
                    No menu items found.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item) => {
                  const itemKey = buildItemKey(item.id, item.branchCode);
                  return (
                    <TableRow key={itemKey} className="hover:bg-orange-50/30">
                      <TableCell className="font-mono text-sm text-gray-600">
                        {item.id}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">
                          {item.name || "Untitled item"}
                        </div>
                        {item.nameAr && (
                          <div className="text-xs text-muted-foreground">
                            {item.nameAr}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {item.category || "—"}
                      </TableCell>
                      <TableCell className="font-medium text-gray-900">
                        {item.price || "—"}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={itemOrderInputs[itemKey] ?? item.itemOrder ?? ""}
                          onChange={(event) =>
                            handleItemOrderChange(itemKey, event.target.value)
                          }
                          onBlur={() => handleItemOrderSave(item, itemKey)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleItemOrderSave(item, itemKey);
                            }
                          }}
                          className="w-24 text-center"
                          disabled={savingItemOrders[itemKey]}
                        />
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {item.branchCode || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditItem(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDeleteItem(item.id)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
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
        </div>

        {totalPages > 1 && (
          <div className="flex flex-col gap-1 rounded-lg border border-orange-100 bg-white/80 p-2 text-[11px] text-muted-foreground">
            <span className="px-2">
              Page {currentPage} / {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-orange-100 bg-orange-50/60 px-2 py-0.5">
                {pageNumbers.map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "ghost"}
                    size="sm"
                    className={`h-7 px-2 text-xs ${
                      currentPage === page
                        ? "bg-orange-500 text-white hover:bg-orange-600"
                        : "text-gray-600 hover:bg-orange-100"
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
            <span className="px-2 text-right">
              {Math.min(currentPage * ITEMS_PER_PAGE, sortedItems.length)} /{" "}
              {sortedItems.length}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuItemsTable;