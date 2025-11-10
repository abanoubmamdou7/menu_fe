import { supabase } from "@/integrations/supabase/client";

interface TagUploadState {
  preview?: string;
  url?: string;
}

export interface MenuItem {
  order: number;
  id: string;
  name: string;
  itemOrder?: number;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  price: string;
  sales_price?: string;
  category: string;
  image?: string | { data: string };
  photo_url?: string | Uint8Array;
  fasting?: boolean;
  vegetarian?: boolean;
  healthyChoice?: boolean;
  signatureDish?: boolean;
  spicy?: boolean;
  tagIcons?: {
    fasting?: string | null;
    vegetarian?: string | null;
    healthyChoice?: string | null;
    signatureDish?: string | null;
    spicy?: string | null;
  };
  show_in_website?: boolean | number | string | null;
  showInWebsite?: boolean | number | string | null;
  displayOnWebsite?: boolean | number | string | null;
  showOnWebsite?: boolean | number | string | null;
  saleable?: boolean | number | string | null;
  isSaleable?: boolean | number | string | null;
  is_saleable?: boolean | number | string | null;
}

interface RawMenuItem {
  id?: string;
  itm_code?: string;
  itmCode?: string;
  code?: string;
  name?: string;
  website_name_en?: string;
  itm_name?: string;
  itm_name_ar?: string;
  nameAr?: string;
  website_name_ar?: string;
  description?: string;
  website_description_en?: string;
  descriptionAr?: string;
  website_description_ar?: string;
  category?: string;
  itm_group_code?: string;
  groupCode?: string;
  image?: string | { data: string };
  photo_url?: string | Uint8Array;
  photoUrl?: string | Uint8Array;
  item_image?: string;
  sales_price?: string | number | null;
  salesPrice?: string | number | null;
  price?: string | number | null;
  order?: number | string | null;
  item_order?: number | string | null;
  itemOrder?: number | string | null;
  fasting?: boolean;
  vegetarian?: boolean;
  healthyChoice?: boolean;
  healthy_choice?: boolean;
  signatureDish?: boolean;
  signature_dish?: boolean;
  spicy?: boolean;
  tagIcons?: {
    fasting?: string | null;
    vegetarian?: string | null;
    healthyChoice?: string | null;
    signatureDish?: string | null;
    spicy?: string | null;
  };
  show_in_website?: boolean | number | string | null;
  showInWebsite?: boolean | number | string | null;
  displayOnWebsite?: boolean | number | string | null;
  showOnWebsite?: boolean | number | string | null;
  saleable?: boolean | number | string | null;
  isSaleable?: boolean | number | string | null;
  is_saleable?: boolean | number | string | null;
  photo?: string;
  [key: string]: unknown;
}

interface RawMenuCategory {
  id?: string;
  itm_group_code?: string;
  itmGroupCode?: string;
  name?: string;
  website_name_en?: string;
  itm_group_name?: string;
  nameAr?: string;
  website_name_ar?: string;
  itm_group_name_ar?: string;
  orderGroup?: number | string | null;
  order_group?: number | string | null;
  nested_level?: number | string | null;
  nestedLevel?: number | string | null;
  parent_group_code?: string;
  parentGroupCode?: string;
  path?: string;
  children?: RawMenuCategory[];
  [key: string]: unknown;
}

const getImageUrl = (tagData: TagUploadState): string | null => {
  if (tagData.preview) {
    return tagData.preview;
  }
  if (tagData.url) {
    return `${import.meta.env.VITE_API_BASE_URL}/api/image/getImage?fileName=${tagData.url}`;
  }
  return null;
};

export interface MenuCategory {
  id: string;
  name: string;
  nameAr?: string;
  orderGroup?: number;
  nested_level: number;
  parent_group_code?: string;
  path?: string;
  children?: MenuCategory[];
}

const buildApiUrl = (
  path: string,
  params: Record<string, string | number | boolean | undefined> = {}
) => {
  const base = (import.meta.env.VITE_API_BASE_URL || "").trim();
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const url =
    normalizedBase !== ""
      ? new URL(`${normalizedBase}${normalizedPath}`)
      : new URL(
          normalizedPath,
          typeof window !== "undefined" ? window.location.origin : "http://localhost"
        );

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  if (normalizedBase === "") {
    return `${normalizedPath}${url.search}`;
  }

  return url.toString();
};

const fetchFromApi = async (
  path: string,
  params: Record<string, string | number | boolean | undefined> = {}
) => {
  const url = buildApiUrl(path, params);

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json();
};

const fetchPaginatedResource = async (
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
  defaultLimit = 200
) => {
  const limit = Number(params.limit) || defaultLimit;
  const initialPage = Number(params.page) || 1;

  const firstResponse = await fetchFromApi(path, {
    ...params,
    page: initialPage,
    limit,
  });

  if (Array.isArray(firstResponse)) {
    return firstResponse;
  }

  const firstPageData = Array.isArray(firstResponse?.data)
    ? firstResponse.data
    : [];
  const pagination = firstResponse?.pagination;

  if (!pagination || !pagination.totalPages || pagination.totalPages <= 1) {
    return firstPageData;
  }

  let results = [...firstPageData];

  for (let page = initialPage + 1; page <= pagination.totalPages; page += 1) {
    const pageResponse = await fetchFromApi(path, { ...params, page, limit });
    const pageData = Array.isArray(pageResponse?.data)
      ? pageResponse.data
      : Array.isArray(pageResponse)
      ? pageResponse
      : [];
    results = results.concat(pageData);
  }

  return results;
};

const normalizeMenuItemPrice = (price?: string | number | null) => {
  if (price === undefined || price === null || price === "") {
    return "";
  }

  if (typeof price === "number" && Number.isFinite(price)) {
    return price.toFixed(2);
  }

  const priceString = String(price).trim();
  const numeric = Number.parseFloat(priceString.replace(/[^0-9.-]/g, ""));

  if (Number.isFinite(numeric)) {
    return numeric.toFixed(2);
  }

  return priceString;
};

const parseNumericValue = (
  value: number | string | null | undefined
): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const normalizeMenuItem = (
  item: RawMenuItem,
  tagIconsMap: Record<string, string | null>
): MenuItem => {
  const id =
    item?.id ?? item?.itm_code ?? item?.itmCode ?? item?.code ?? "";
  const name =
    item?.name ?? item?.website_name_en ?? item?.itm_name ?? "";
  const nameAr =
    item?.nameAr ?? item?.website_name_ar ?? item?.itm_name_ar ?? "";
  const description =
    item?.description ?? item?.website_description_en ?? "";
  const descriptionAr =
    item?.descriptionAr ?? item?.website_description_ar ?? "";
  const category =
    item?.category ?? item?.itm_group_code ?? item?.groupCode ?? "";
  const image =
    item?.image ?? item?.photo_url ?? item?.photoUrl ?? item?.item_image ?? "";
  const price = normalizeMenuItemPrice(
    item?.sales_price ?? item?.salesPrice ?? item?.price
  );

  const fasting = item?.fasting === true;
  const vegetarian = item?.vegetarian === true;
  const healthyChoice = item?.healthyChoice === true || item?.healthy_choice === true;
  const signatureDish =
    item?.signatureDish === true || item?.signature_dish === true;
  const spicy = item?.spicy === true;

  const normalizedImage =
    typeof image === "string"
      ? image.trim()
      : image && typeof image === "object" && "data" in image
      ? { data: String(image.data) }
      : undefined;

  const photoSource = item?.photo_url;
  const normalizedPhotoUrl =
    typeof photoSource === "string" || photoSource instanceof Uint8Array
      ? photoSource
      : undefined;

  const resolveBooleanFlag = (
    ...candidates: Array<boolean | number | string | null | undefined>
  ): boolean | undefined => {
    for (const candidate of candidates) {
      if (candidate === null || candidate === undefined || candidate === "") {
        continue;
      }
      if (typeof candidate === "boolean") {
        return candidate;
      }
      if (typeof candidate === "number") {
        return candidate === 1;
      }
      if (typeof candidate === "string") {
        const normalized = candidate.trim().toLowerCase();
        if (["true", "1", "yes", "y", "t"].includes(normalized)) {
          return true;
        }
        if (["false", "0", "no", "n", "f"].includes(normalized)) {
          return false;
        }
      }
    }
    return undefined;
  };

  const normalizedShowInWebsite = resolveBooleanFlag(
    item?.show_in_website,
    item?.showInWebsite,
    item?.displayOnWebsite,
    item?.showOnWebsite
  );

  const normalizedSaleable = resolveBooleanFlag(
    item?.saleable,
    item?.isSaleable,
    item?.is_saleable
  );

  const tagIcons = {
    fasting: fasting ? tagIconsMap.fasting : null,
    vegetarian: vegetarian ? tagIconsMap.vegetarian : null,
    healthyChoice: healthyChoice ? tagIconsMap.healthyChoice : null,
    signatureDish: signatureDish ? tagIconsMap.signatureDish : null,
    spicy: spicy ? tagIconsMap.spicy : null,
  };

  return {
    id,
    name,
    nameAr,
    order: parseNumericValue(item?.order ?? item?.item_order ?? item?.itemOrder),
    itemOrder: parseNumericValue(item?.itemOrder ?? item?.item_order),
    description,
    descriptionAr,
    price,
    sales_price: price,
    category,
    image: normalizedImage,
    photo_url: normalizedPhotoUrl,
    show_in_website: normalizedShowInWebsite,
    showInWebsite: normalizedShowInWebsite,
    displayOnWebsite: normalizedShowInWebsite,
    showOnWebsite: normalizedShowInWebsite,
    saleable: normalizedSaleable,
    isSaleable: normalizedSaleable,
    is_saleable: normalizedSaleable,
    fasting,
    vegetarian,
    healthyChoice,
    signatureDish,
    spicy,
    tagIcons,
  };
};

const normalizeCategory = (category: RawMenuCategory): MenuCategory => {
  const orderGroup = parseNumericValue(
    category?.orderGroup ?? category?.order_group ?? 0
  );
  const nestedLevel = parseNumericValue(
    category?.nested_level ?? category?.nestedLevel ?? 1
  );

  return {
    id:
      category?.id ??
      category?.itm_group_code ??
      category?.itmGroupCode ??
      "",
    name:
      category?.name ??
      category?.website_name_en ??
      category?.itm_group_name ??
      "",
    nameAr:
      category?.nameAr ??
      category?.website_name_ar ??
      category?.itm_group_name_ar ??
      "",
    orderGroup,
    nested_level: nestedLevel,
    parent_group_code:
      category?.parent_group_code ?? category?.parentGroupCode ?? null,
    path: category?.path ?? "",
    children: Array.isArray(category?.children)
      ? category.children.map((child) => normalizeCategory(child))
      : [],
  };
};

let cachedBranchCode: string | null | undefined;

const resolveBranchCode = async (
  branchOverride?: string | null
): Promise<string | null> => {
  if (branchOverride !== undefined) {
    return branchOverride ?? null;
  }

  if (cachedBranchCode !== undefined) {
    return cachedBranchCode;
  }

  const envBranch =
    (import.meta.env.VITE_DEFAULT_BRANCH_CODE ||
      import.meta.env.VITE_BRANCH_CODE ||
      "").trim();

  if (envBranch) {
    cachedBranchCode = envBranch;
    return cachedBranchCode;
  }

  try {
    const { data: restaurantData, error: restaurantError } = await supabase
      .from("restaurant_info")
      .select("branch_code")
      .limit(1)
      .maybeSingle();

    if (restaurantError && restaurantError.code !== "PGRST116") {
      throw restaurantError;
    }

    cachedBranchCode = restaurantData?.branch_code?.trim() || null;
  } catch (error) {
    console.warn("⚠️ Unable to resolve branch_code from Supabase:", error);
    cachedBranchCode = null;
  }

  return cachedBranchCode;
};

export const fetchMenuItems = async (
  branchOverride?: string | null
): Promise<MenuItem[]> => {
  try {
    const normalizedOverride =
      typeof branchOverride === "string" ? branchOverride.trim() : branchOverride;
    const branchCode = await resolveBranchCode(normalizedOverride);

    const items = await fetchPaginatedResource("/api/items/items", {
      page: 1,
      limit: 200,
      branchCode: branchCode || undefined,
    });

    const { data: tagData, error: tagError } = await supabase
      .from("tags")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (tagError && tagError.code !== "PGRST116") throw tagError;

    const tagIconsMap: Record<string, string | null> = tagData
      ? {
          fasting: getImageUrl({ url: tagData.fasting }),
          vegetarian: getImageUrl({ url: tagData.vegetarian }),
          healthyChoice: getImageUrl({ url: tagData.healthy_choice }),
          signatureDish: getImageUrl({ url: tagData.signature_dish }),
          spicy: getImageUrl({ url: tagData.spicy }),
        }
      : {
          fasting: null,
          vegetarian: null,
          healthyChoice: null,
          signatureDish: null,
          spicy: null,
        };

    return Array.isArray(items)
      ? items.map((item) => normalizeMenuItem(item, tagIconsMap))
      : [];
  } catch (error) {
    console.error("❌ Error fetching menu items:", error);
    throw new Error("Failed to fetch menu items");
  }
};

export const fetchAllMenuCategories = async (
  branchOverride?: string | null
): Promise<MenuCategory[]> => {
  try {
    const normalizedOverride =
      typeof branchOverride === "string" ? branchOverride.trim() : branchOverride;
    const branchCode = await resolveBranchCode(normalizedOverride);

    const categories = await fetchPaginatedResource("/api/items/categories/all", {
      page: 1,
      limit: 200,
      branchCode: branchCode || undefined,
    });

    return Array.isArray(categories)
      ? categories.map((category) => normalizeCategory(category))
      : [];
  } catch (error) {
    console.error("❌ Error fetching menu categories:", error);
    throw new Error("Failed to fetch menu categories");
  }
};

export const fetchMenuCategories = async (
  branchOverride?: string | null
): Promise<MenuCategory[]> => {
  try {
    const normalizedOverride =
      typeof branchOverride === "string" ? branchOverride.trim() : branchOverride;
    const branchCode = await resolveBranchCode(normalizedOverride);

    const categories = await fetchPaginatedResource("/api/items/categories", {
      page: 1,
      limit: 200,
      branchCode: branchCode || undefined,
    });

    return Array.isArray(categories)
      ? categories.map((category) => normalizeCategory(category))
      : [];
  } catch (error) {
    console.error("❌ Error fetching menu categories:", error);
    throw new Error("Failed to fetch menu categories");
  }
};

export const fetchSubCategories = async (
  parentGroupCode: string,
  branchOverride?: string | null
): Promise<MenuCategory[]> => {
  try {
    if (!parentGroupCode) {
      return [];
    }

    const normalizedOverride =
      typeof branchOverride === "string" ? branchOverride.trim() : branchOverride;
    const branchCode = await resolveBranchCode(normalizedOverride);

    const response = await fetchFromApi(`/api/items/categories/${encodeURIComponent(parentGroupCode)}`, {
      page: 1,
      limit: 200,
      branchCode: branchCode || undefined,
    });

    const categories = Array.isArray(response?.data)
      ? response.data
      : Array.isArray(response)
      ? response
      : [];

    return categories.map((category) => normalizeCategory(category));
  } catch (error) {
    console.error("❌ Error fetching subcategories:", error);
    throw new Error("Failed to fetch subcategories");
  }
};

export const buildCategoryHierarchy = (categories: MenuCategory[]): MenuCategory[] => {
  if (!Array.isArray(categories)) return [];

  const parentCategories = categories.filter(cat => cat.nested_level === 1);
  const childCategories = categories.filter(cat => cat.nested_level > 1);

  const hierarchicalCategories = parentCategories.map(parent => ({
    ...parent,
    children: childCategories
      .filter(child => child.parent_group_code === parent.id)
      .sort((a, b) => {
        const orderA = a.orderGroup || 0;
        const orderB = b.orderGroup || 0;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return (a.name || "").localeCompare(b.name || "");
      })
  }));

  return hierarchicalCategories.sort((a, b) => {
    const orderA = a.orderGroup || 0;
    const orderB = b.orderGroup || 0;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return (a.name || "").localeCompare(b.name || "");
  });
};

export const uploadMenuItemPhoto = async (
  file: File,
  itemCode: string
): Promise<string | null> => {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${itemCode}-${Date.now()}.${fileExt}`;
    const filePath = `menu-items/${fileName}`;
    
    // Upload file to Supabase Storage (if storage is set up)
    // For now, return null as placeholder
    return null;
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
};

import { useQuery } from "@tanstack/react-query";

export const useMenuItems = (branchCode?: string | null) => {
  return useQuery({
    queryKey: ["menuItems", branchCode ?? "default"],
    queryFn: () => fetchMenuItems(branchCode),
    enabled: branchCode !== undefined ? branchCode !== null && branchCode !== "" : true,
  });
};

export const useMenuCategories = (branchCode?: string | null) => {
  return useQuery({
    queryKey: ["menuCategories", branchCode ?? "default"],
    queryFn: () => fetchMenuCategories(branchCode),
    enabled: branchCode !== undefined ? branchCode !== null && branchCode !== "" : true,
  });
};

export const useAllMenuCategories = (branchCode?: string | null) => {
  return useQuery({
    queryKey: ["allMenuCategories", branchCode ?? "default"],
    queryFn: () => fetchAllMenuCategories(branchCode),
    enabled: branchCode !== undefined ? branchCode !== null && branchCode !== "" : true,
  });
};

export const useSubCategories = (
  parentGroupCode: string,
  branchCode?: string | null
) => {
  return useQuery({
    queryKey: ["subCategories", branchCode ?? "default", parentGroupCode],
    queryFn: () => fetchSubCategories(parentGroupCode, branchCode),
    enabled:
      !!parentGroupCode &&
      (branchCode !== undefined ? branchCode !== null && branchCode !== "" : true),
  });
};

export const useCategoryHierarchy = (branchCode?: string | null) => {
  return useQuery({
    queryKey: ["categoryHierarchy", branchCode ?? "default"],
    queryFn: async () => {
      const allCategories = await fetchAllMenuCategories(branchCode);
      return buildCategoryHierarchy(allCategories);
    },
    enabled: branchCode !== undefined ? branchCode !== null && branchCode !== "" : true,
  });
};

export interface MenuItemFormData {
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

export const handleMenuItemSubmit = async (data: MenuItemFormData, photoFile: File | null) => {
  const item: MenuItem = {
    id: data.itm_code,
    name: data.itm_name,
    nameAr: data.website_name_ar,
    description: data.website_description_en,
    descriptionAr: data.website_description_ar,
    price: data.sales_price,
    sales_price: data.sales_price,
    category: data.itm_group_code,
    image: typeof data.image === 'string' ? data.image : '',
    fasting: data.fasting,
    vegetarian: data.vegetarian,
    healthyChoice: data.healthyChoice,
    signatureDish: data.signatureDish,
    spicy: data.spicy,
    order: 0,
    itemOrder: 0,
  };

  await updateMenuItem(item);
};

export const updateMenuItem = async (item: MenuItem) => {
  try {
    const imageValue = typeof item.image === 'string' ? item.image : '';
    const priceValue = item.price ? parseFloat(item.price) : null;
    
    const { error } = await supabase
      .from("item_master")
      .update({
        itm_name: item.name,
        website_name_en: item.name,
        website_name_ar: item.nameAr ?? "",
        website_description_en: item.description,
        website_description_ar: item.descriptionAr ?? "",
        sales_price: priceValue,
        itm_group_code: item.category,
        image: imageValue,
        fasting: item.fasting === true,
        vegetarian: item.vegetarian === true,
        healthy_choice: item.healthyChoice === true,
        signature_dish: item.signatureDish === true,
        spicy: item.spicy === true,
      })
      .eq("itm_code", item.id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error("❌ Error updating menu item:", error);
    throw new Error("Failed to update menu item");
  }
};
