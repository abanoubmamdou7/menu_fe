import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { MenuCategory } from "@/services/menuServices";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  RefreshCw,
  FolderKanban,
} from "lucide-react";

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
  `${id ?? ""}__${branchCode ?? "default"}`;

const ITEMS_PER_PAGE = 10;

const normalizeCategory = (
  raw: Record<string, unknown>
): MenuCategoryWithBranch => {
  const orderGroupRaw = raw?.order_group ?? raw?.orderGroup ?? 0;
  const orderGroup =
    typeof orderGroupRaw === "number"
      ? orderGroupRaw
      : typeof orderGroupRaw === "string"
      ? Number(orderGroupRaw)
      : 0;

  const nestedLevelRaw = raw?.nested_level ?? raw?.nestedLevel ?? 1;
  const nested_level =
    typeof nestedLevelRaw === "number"
      ? nestedLevelRaw
      : typeof nestedLevelRaw === "string"
      ? Number(nestedLevelRaw)
      : 1;

  return {
    id: (raw?.itm_group_code ?? raw?.id ?? "") as string,
    name: (raw?.website_name_en ?? raw?.itm_group_name ?? raw?.name ?? "") as string,
    nameAr: (raw?.website_name_ar ?? raw?.itm_group_name_ar ?? "") as string,
    orderGroup: Number.isFinite(orderGroup) ? orderGroup : 0,
    nested_level: Number.isFinite(nested_level) ? nested_level : 1,
    parent_group_code: (raw?.parent_group_code ?? raw?.parentGroupCode ?? null) as
      | string
      | null,
    path: (raw?.path ?? "") as string,
    children: [],
    branchCode: (raw?.branch_code ?? raw?.branchCode ?? null) as string | null,
  };
};

const AdminCategories = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategory, setCurrentCategory] =
    useState<MenuCategoryWithBranch | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [orderInputs, setOrderInputs] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<MenuCategoryWithBranch[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const form = useForm<CategoryFormData>({
    defaultValues: {
      itm_group_code: "",
      itm_group_name: "",
      website_name_en: "",
      show_in_website: true,
      branch_code: "",
    },
  });

  const resetForm = useCallback(
    (category?: MenuCategoryWithBranch | null) => {
      if (category) {
        form.reset({
          itm_group_code: category.id,
          itm_group_name: category.name,
          website_name_en: category.name,
          show_in_website: true,
          branch_code: category.branchCode ?? "",
        });
      } else {
        form.reset({
          itm_group_code: "",
          itm_group_name: "",
          website_name_en: "",
          show_in_website: true,
          branch_code: "",
        });
      }
    },
    [form]
  );

  useEffect(() => {
    resetForm(isEditing ? currentCategory : null);
  }, [currentCategory, isEditing, resetForm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const fetchAllCategories = useCallback(async () => {
    setIsLoadingCategories(true);
    try {
      const { data, error } = await supabase
        .from("item_main_group")
        .select(
          `
            itm_group_code,
            itm_group_name,
            website_name_en,
            website_name_ar,
            order_group,
            nested_level,
            parent_group_code,
            path,
            branch_code
          `
        )
        .order("order_group", { ascending: true });

      if (error) throw error;

      const normalized =
        Array.isArray(data) && data.length > 0
          ? data.map((category) =>
              normalizeCategory(category as Record<string, unknown>)
            )
          : [];

      setCategories(normalized);
      setFetchError(null);
      setOrderInputs({});
      setCurrentPage(1);
    } catch (error) {
      console.error("Failed to fetch categories for all branches", error);
      if (error instanceof Error) {
        setFetchError(error.message);
        toast.error(error.message);
      } else {
        setFetchError("Failed to load categories for all branches");
        toast.error("Failed to load categories for all branches");
      }
    } finally {
      setIsLoadingCategories(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllCategories();
  }, [fetchAllCategories]);

  const handleAddCategory = useCallback(() => {
    setIsEditing(false);
    setCurrentCategory(null);
    resetForm(null);
    setIsSheetOpen(true);
  }, [resetForm]);

  const handleEditCategory = useCallback(
    (category: MenuCategoryWithBranch) => {
      setIsEditing(true);
      setCurrentCategory(category);
      resetForm(category);
      setIsSheetOpen(true);
    },
    [resetForm]
  );

  const handleDeleteCategory = useCallback(
    async (category: MenuCategoryWithBranch) => {
      if (
        !window.confirm("Are you sure you want to delete this category?")
      ) {
        return;
      }

      try {
        let deleteQuery = supabase
          .from("item_main_group")
          .delete()
          .eq("itm_group_code", category.id);

        if (category.branchCode) {
          deleteQuery = deleteQuery.eq("branch_code", category.branchCode);
        }

        const { error } = await deleteQuery;

        if (error) throw error;

        toast.success("Category deleted successfully");
        fetchAllCategories();
      } catch (error) {
        console.error("Failed to delete category:", error);
        toast.error(
          error instanceof Error
            ? `Failed to delete category: ${error.message}`
            : "Failed to delete category"
        );
      }
    },
    [fetchAllCategories]
  );

  const handleSubmitForm = useCallback(
    async (data: CategoryFormData) => {
      try {
        if (!data.branch_code?.trim()) {
          throw new Error("Branch code is required");
        }

        if (isEditing) {
          if (!data.itm_group_code) {
            throw new Error("Cannot update category: missing code");
          }

          const { error } = await supabase
            .from("item_main_group")
            .update({
              itm_group_name: data.itm_group_name,
              website_name_en: data.website_name_en,
              show_in_website: data.show_in_website,
            })
            .eq("itm_group_code", data.itm_group_code)
            .eq("branch_code", data.branch_code);

          if (error) throw error;
          toast.success("Category updated successfully");
        } else {
          const { error } = await supabase.from("item_main_group").insert({
            itm_group_code: data.itm_group_code,
            itm_group_name: data.itm_group_name,
            website_name_en: data.website_name_en,
            show_in_website: data.show_in_website,
            branch_code: data.branch_code,
          });

          if (error) throw error;
          toast.success("Category created successfully");
        }

        setIsSheetOpen(false);
        fetchAllCategories();
      } catch (error) {
        console.error("Category save failed:", error);
        toast.error(
          error instanceof Error
            ? `Failed to ${isEditing ? "update" : "create"} category: ${
                error.message
              }`
            : "Unable to save category."
        );
      }
    },
    [fetchAllCategories, isEditing]
  );

  const handleOrderChange = useCallback(
    (categoryKey: string, value: string) => {
      setOrderInputs((prev) => ({ ...prev, [categoryKey]: value }));
    },
    []
  );

  const handleOrderSave = useCallback(
    async (category: MenuCategoryWithBranch, categoryKey: string) => {
      const nextValue = orderInputs[categoryKey];
      const order = parseInt(nextValue ?? "", 10);

      if (Number.isNaN(order)) {
        toast.error("Please enter a valid number for order");
        return;
      }

      try {
        let updateQuery = supabase
          .from("item_main_group")
          .update({ order_group: order })
          .eq("itm_group_code", category.id);

        if (category.branchCode) {
          updateQuery = updateQuery.eq("branch_code", category.branchCode);
        }

        const { error } = await updateQuery;
        if (error) throw error;

        toast.success("Order updated successfully");
        setOrderInputs((previous) => {
          const next = { ...previous };
          delete next[categoryKey];
          return next;
        });
        fetchAllCategories();
      } catch (error) {
        console.error("Failed to update order:", error);
        toast.error(
          error instanceof Error
            ? `Failed to update order: ${error.message}`
            : "Failed to update order."
        );
      }
    },
    [fetchAllCategories, orderInputs]
  );

  const filteredCategories = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return categories
      .filter((category) =>
        term ? category.name.toLowerCase().includes(term) : true
      )
      .sort((a, b) => {
        const orderA = a.orderGroup ?? 0;
        const orderB = b.orderGroup ?? 0;
        return orderA - orderB;
      });
  }, [categories, searchTerm]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredCategories.length / ITEMS_PER_PAGE)),
    [filteredCategories.length]
  );

  const paginatedCategories = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCategories.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );
  }, [currentPage, filteredCategories]);

  const pageNumbers = useMemo(() => {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }, [totalPages]);

  const tableSkeleton = useMemo(
    () =>
      Array.from({ length: ITEMS_PER_PAGE }, (_, index) => (
        <TableRow key={`skeleton-${index}`}>
          <TableCell>
            <Skeleton className="h-4 w-24 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-40 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-8 w-16 rounded-md" />
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 px-4 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 shadow-lg">
                <FolderKanban className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:gap-3">
                <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
                <p className="text-sm text-gray-600">
                  Manage item groupings, display order, and branch assignments.
                </p>
              </div>
            </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isRefreshing || isLoadingCategories}
                onClick={() => {
                  setIsRefreshing(true);
                  fetchAllCategories();
                }}
                className="border-orange-200 text-orange-600 hover:border-orange-300 hover:bg-orange-50"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${
                    isRefreshing || isLoadingCategories ? "animate-spin" : ""
                  }`}
                />
                Refresh
              </Button>
              <Button
                onClick={handleAddCategory}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md"
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Category
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="border-orange-200 bg-orange-50 text-orange-700"
            >
              Total: {categories.length}
            </Badge>
            {searchTerm && (
              <Badge
                variant="secondary"
                className="border-orange-200 bg-orange-100 text-orange-700"
              >
                Showing {filteredCategories.length} results
              </Badge>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-orange-100 bg-white/95 shadow-lg backdrop-blur-sm">
          {fetchError && (
            <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
              {fetchError}
            </div>
          )}
          <Table>
            <TableHeader className="bg-orange-50/40">
              <TableRow className="uppercase text-xs tracking-wide text-gray-500">
                <TableHead className="w-[180px]">Category Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-[140px]">Order</TableHead>
                <TableHead className="w-[160px]">Branch</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingCategories ? (
                tableSkeleton
              ) : paginatedCategories.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-12 text-center text-sm text-muted-foreground"
                  >
                    No categories found. Try adjusting your search.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCategories.map((category) => {
                  const categoryKey = buildCategoryKey(
                    category.id,
                    category.branchCode
                  );
                  return (
                    <TableRow key={categoryKey} className="hover:bg-orange-50/30">
                      <TableCell className="font-mono text-sm text-gray-600">
                        {category.id}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">
                          {category.name || "Untitled category"}
                        </div>
                        {category.nameAr && (
                          <div className="text-xs text-muted-foreground">
                            {category.nameAr}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={
                            orderInputs[categoryKey] ??
                            category.orderGroup ??
                            ""
                          }
                          onChange={(event) =>
                            handleOrderChange(categoryKey, event.target.value)
                          }
                          onBlur={() =>
                            handleOrderSave(category, categoryKey)
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              handleOrderSave(category, categoryKey);
                            }
                          }}
                          className="w-24 text-center"
                        />
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {category.branchCode || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditCategory(category)}
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteCategory(category)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
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

        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-orange-100 bg-white/80 px-2 py-1">
              {pageNumbers.map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={
                    currentPage === page
                      ? "bg-orange-500 text-white hover:bg-orange-600"
                      : "text-gray-600 hover:bg-orange-50"
                  }
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}

        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="sm:max-w-md">
            <SheetHeader>
              <SheetTitle>
                {isEditing ? "Edit Category" : "Add New Category"}
              </SheetTitle>
            </SheetHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmitForm)}
                className="space-y-5 py-6"
              >
                <FormField
                  control={form.control}
                  name="itm_group_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Unique identifier"
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
                      <FormLabel>Internal Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Category name"
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
                          placeholder="Name shown on customer menu"
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
                          placeholder="Branch identifier"
                          {...field}
                          required
                          disabled={isEditing}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="show_in_website"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border border-orange-100 bg-orange-50/40 px-3 py-2">
                      <div>
                        <FormLabel className="mb-0 font-medium text-gray-900">
                          Show on website
                        </FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Toggle visibility of this category in the menu.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <SheetFooter className="pt-2">
                  <SheetClose asChild>
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </SheetClose>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                  >
                    {isEditing ? "Update Category" : "Create Category"}
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default AdminCategories;