import React, { useState, useRef, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Grid3X3,
  List,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useMenuItems,
  useMenuCategories,
  useSubCategories,
  MenuItem,
  MenuCategory,
  usePrefetchMenuData,
} from "@/services/menuServices";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/hooks/useLanguage";
import { Skeleton } from "@/components/ui/skeleton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { cn } from "@/lib/utils";
import { useRestaurantInfo } from "../services/restaurantInfoService.ts";
import { useSortedMenuItems } from "@/hooks/useSortedMenuItems.ts";
import { useMenuItemImage } from "../getImageSrc.ts";
import { LazyImage } from "@/components/LazyImage";

// Enhanced view styles with professional improvements
const VIEW_STYLES = {
  grid: {
    name: "Grid View",
    icon: Grid3X3,
    containerClass:
      "grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
    itemClass: "h-full",
  },
  list: {
    name: "List View",
    icon: List,
    containerClass: "space-y-4 lg:space-y-5",
    itemClass: "",
  },
  card: {
    name: "Card View",
    icon: LayoutGrid,
    containerClass: "grid gap-6 lg:gap-8",
    itemClass: "",
  },
};

const normalizeBooleanFlag = (value: unknown) => {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return (
      normalized === "true" ||
      normalized === "1" ||
      normalized === "yes" ||
      normalized === "y"
    );
  }

  if (typeof value === "number") {
    return value === 1;
  }

  return value === true;
};

type MenuItemComponentProps = {
  item: MenuItem;
  language: string;
  getImageSrc: (item: MenuItem) => string;
};

type TagIconsProps = {
  tagIcons?: MenuItem["tagIcons"];
};

const TagIcons = React.memo(({ tagIcons }: TagIconsProps) => {
  if (!tagIcons) return null;

  const iconEntries = Object.entries(tagIcons).filter(
    ([, value]) => typeof value === "string" && value.trim().length > 0
  );

  if (!iconEntries.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-2">
      {iconEntries.map(([name, src]) => (
        <img
          key={name}
          src={src}
          alt={name}
          className="w-5 h-5 rounded-md bg-white/80 p-0.5 shadow-sm border border-orange-100/60"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
      ))}
    </div>
  );
});

TagIcons.displayName = "TagIcons";

const GridMenuItem = React.memo(
  ({ item, language, getImageSrc }: MenuItemComponentProps) => {
  return (
    <div className="group cursor-pointer h-full flex flex-col">
      <div className="relative aspect-square mb-4 overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-orange-100">
        <LazyImage
          src={getImageSrc(item)}
          alt={item.name}
          className="transition-transform duration-500 ease-out group-hover:scale-105"
          placeholder="/placeholder-food.jpg"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-orange-900/30 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-1 text-xl font-semibold text-gray-900">
          <span className="truncate">{item.name}</span>
          {language === "ar" && item.nameAr && (
            <span className="mt-1 block text-sm font-normal text-gray-500 ltr:text-left">
              {item.name}
            </span>
          )}
        </h3>
        <p className="mb-2 text-sm text-gray-700 line-clamp-2">
          {language === "ar"
            ? item.descriptionAr || item.description
            : item.description}
          {language === "en" && item.nameAr && (
            <span className="mt-1 block text-sm font-normal text-gray-500 rtl:text-right">
              {item.nameAr}
            </span>
          )}
          {language === "en" && item.descriptionAr && (
            <span className="mt-1 block text-xs text-gray-500 rtl:text-right line-clamp-1">
              {item.descriptionAr}
            </span>
          )}
          {language === "ar" && item.description && item.descriptionAr && (
            <span className="mt-1 block text-xs text-gray-500 ltr:text-left line-clamp-1">
              {item.description}
            </span>
          )}
        </p>
        <TagIcons tagIcons={item.tagIcons} />
        <div className="mt-auto flex items-center justify-between">
          <span className="text-lg font-semibold tracking-tight text-orange-500">
            {item.price}
          </span>
        </div>
      </div>
    </div>
  );
  }
);

GridMenuItem.displayName = "GridMenuItem";

const ListMenuItem = React.memo(
  ({ item, language, getImageSrc }: MenuItemComponentProps) => {
  return (
    <div className="group flex cursor-pointer items-center gap-5 rounded-xl border border-orange-100/50 bg-white/90 p-5 shadow-sm transition-all duration-300 hover:border-orange-200 hover:shadow-lg">
      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-orange-100">
        <LazyImage
          src={getImageSrc(item)}
          alt={item.name}
          className="transition-transform duration-500 group-hover:scale-105"
          placeholder="/placeholder-food.jpg"
        />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="mb-1 truncate text-base font-semibold text-gray-900 transition-colors duration-300 group-hover:text-orange-600">
          {item.name}
        </h3>
        <p className="mb-2 text-sm text-gray-700 line-clamp-2">
          {language === "ar"
            ? item.descriptionAr || item.description
            : item.description}
          {language === "en" && item.nameAr && (
            <span className="mt-1 block text-sm font-normal text-gray-500 rtl:text-right">
              {item.nameAr}
            </span>
          )}
          {language === "en" && item.descriptionAr && (
            <span className="mt-1 block text-xs text-gray-500 rtl:text-right line-clamp-1">
              {item.descriptionAr}
            </span>
          )}
          {language === "ar" && item.description && item.descriptionAr && (
            <span className="mt-1 block text-xs text-gray-500 ltr:text-left line-clamp-1">
              {item.description}
            </span>
          )}
        </p>
        <TagIcons tagIcons={item.tagIcons} />
      </div>
      <div className="flex flex-shrink-0 flex-col items-end gap-3">
        <span className="text-lg font-semibold tracking-tight text-orange-500">
          {item.price}
        </span>
      </div>
    </div>
  );
  }
);

ListMenuItem.displayName = "ListMenuItem";

const CardMenuItem = React.memo(
  ({ item, language, getImageSrc }: MenuItemComponentProps) => {
  return (
    <div className="group cursor-pointer overflow-hidden rounded-2xl border border-orange-100/60 bg-white/95 shadow-sm transition-all duration-300 hover:border-orange-200 hover:shadow-xl">
      <div className="flex flex-col sm:flex-row">
        <div className="relative h-56 w-full flex-shrink-0 bg-gradient-to-br from-orange-50 to-orange-100 sm:h-40 sm:w-48 md:h-48 md:w-56">
          <LazyImage
            src={getImageSrc(item)}
            alt={item.name}
            className="transition-transform duration-500 ease-out group-hover:scale-105"
            placeholder="/placeholder-food.jpg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-orange-900/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        </div>
        <div className="flex flex-1 flex-col p-6 lg:p-8">
          <h3 className="mb-3 text-xl font-semibold leading-tight text-gray-900 transition-colors duration-300 group-hover:text-orange-600 lg:text-2xl">
            {item.name}
          </h3>
          <p className="mb-4 text-sm text-gray-700 line-clamp-2">
            {language === "ar"
              ? item.descriptionAr || item.description
              : item.description}
            {language === "en" && item.nameAr && (
              <span className="mt-1 block text-sm font-normal text-gray-500 rtl:text-right">
                {item.nameAr}
              </span>
            )}
            {language === "en" && item.descriptionAr && (
              <span className="mt-1 block text-xs text-gray-500 rtl:text-right line-clamp-1">
                {item.descriptionAr}
              </span>
            )}
            {language === "ar" && item.description && item.descriptionAr && (
              <span className="mt-1 block text-xs text-gray-500 ltr:text-left line-clamp-1">
                {item.description}
              </span>
            )}
          </p>
          <TagIcons tagIcons={item.tagIcons} />
          <div className="mt-auto flex items-center justify-between">
            <span className="text-2xl font-semibold tracking-tight text-orange-500">
              {item.price}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
  }
);

CardMenuItem.displayName = "CardMenuItem";

const Menu = () => {
  const { t } = useTranslation() || { t: (key) => key };
  const { language } = useLanguage() || { language: "en" };
  const [searchParams] = useSearchParams();
  const { getImageSrc } = useMenuItemImage();

  const branchCode = React.useMemo(() => {
    const fromQuery = searchParams.get("branch");
    if (fromQuery && fromQuery.trim().length > 0) {
      return fromQuery.trim();
    }

    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem("selectedBranchCode");
        if (stored && stored.trim().length > 0) {
          return stored.trim();
        }
      } catch (error) {
        console.warn("Unable to read branch code from storage", error);
      }
    }

    return null;
  }, [searchParams]);

  const branchName = React.useMemo(() => {
    const fromQuery = searchParams.get("branchName");
    if (fromQuery && fromQuery.trim().length > 0) {
      return fromQuery.trim();
    }

    if (typeof window !== "undefined") {
      try {
        const stored = window.localStorage.getItem("selectedBranchName");
        if (stored && stored.trim().length > 0) {
          return stored.trim();
        }
      } catch (error) {
        console.warn("Unable to read branch name from storage", error);
      }
    }

    return null;
  }, [searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      if (branchCode) {
        window.localStorage.setItem("selectedBranchCode", branchCode);
      }
      if (branchName) {
        window.localStorage.setItem("selectedBranchName", branchName);
      }
    } catch (error) {
      console.warn("Unable to persist branch selection", error);
    }
  }, [branchCode, branchName]);

  const [activeParentCategory, setActiveParentCategory] = useState<string | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);
  const [showSubLeftArrow, setShowSubLeftArrow] = useState(false);
  const [showSubRightArrow, setShowSubRightArrow] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  // Mobile-specific arrow visibility (separate from desktop to avoid ref clashes)
  const [showLeftArrowMobile, setShowLeftArrowMobile] = useState(false);
  const [showRightArrowMobile, setShowRightArrowMobile] = useState(false);
  const [showSubLeftArrowMobile, setShowSubLeftArrowMobile] = useState(false);
  const [showSubRightArrowMobile, setShowSubRightArrowMobile] = useState(false);
  const [currentView, setCurrentView] =
    useState<keyof typeof VIEW_STYLES>("card");

  const tabsContainerRef = useRef<HTMLDivElement | null>(null);
  const subTabsContainerRef = useRef<HTMLDivElement | null>(null);
  // Mobile-specific refs (desktop sections also render and can steal shared refs)
  const mobileTabsContainerRef = useRef<HTMLDivElement | null>(null);
  const mobileSubTabsContainerRef = useRef<HTMLDivElement | null>(null);

  // Prefetch menu data for faster loading
  usePrefetchMenuData(branchCode);

  useEffect(() => {
    setActiveParentCategory(null);
    setActiveSubCategory(null);
  }, [branchCode]);

  const { data: restaurantInfo } = useRestaurantInfo();
  const showAllCategory = !!restaurantInfo?.show_all_category;

  // Update favicon dynamically from restaurant info (logo/icon) when available
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (!restaurantInfo) return;
    const info = restaurantInfo as unknown as {
      favicon?: string;
      logoUrl?: string;
      logo_url?: string;
      logo?: string;
      icon?: string;
    };
    const logoUrl =
      info?.favicon ||
      info?.logoUrl ||
      info?.logo_url ||
      info?.logo ||
      info?.icon;
    if (!logoUrl || typeof logoUrl !== "string" || logoUrl.trim().length === 0)
      return;
    try {
      let link =
        (document.querySelector("link#app-favicon") as HTMLLinkElement | null) ||
        (document.querySelector("link[rel='icon']") as HTMLLinkElement | null);
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        link.id = "app-favicon";
        document.head.appendChild(link);
      } else {
        link.id = link.id || "app-favicon";
      }
      // Prefer PNG/ICO; type hint is optional and safe
      link.type = "image/png";
      link.href = logoUrl;
    } catch (err) {
      console.warn("Unable to set dynamic favicon", err);
    }
  }, [restaurantInfo]);

  const allowedViews = React.useMemo(
    () => Object.keys(VIEW_STYLES) as Array<keyof typeof VIEW_STYLES>,
    []
  );
  const defaultView = restaurantInfo?.style;

  const handleChangeView = useCallback(
    (view: keyof typeof VIEW_STYLES) => {
      if (!allowedViews.includes(view)) {
        return;
      }

      setCurrentView(view);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("menuView", view);
      }
    },
    [allowedViews]
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      const fallbackView =
        defaultView &&
        allowedViews.includes(defaultView as keyof typeof VIEW_STYLES)
          ? (defaultView as keyof typeof VIEW_STYLES)
          : "grid";
      handleChangeView(fallbackView);
      return;
    }

    const savedView = window.localStorage.getItem(
      "menuView"
    ) as keyof typeof VIEW_STYLES | null;

    if (savedView && allowedViews.includes(savedView)) {
      handleChangeView(savedView);
      return;
    }

    if (
      defaultView &&
      allowedViews.includes(defaultView as keyof typeof VIEW_STYLES)
    ) {
      handleChangeView(defaultView as keyof typeof VIEW_STYLES);
      return;
    }

    handleChangeView("grid");
  }, [allowedViews, defaultView, handleChangeView]);

  const {
    data: menuItems = [],
    isLoading: isLoadingItems = false,
    isFetching: isFetchingItems = false,
    error: itemsError,
    dataUpdatedAt,
  } = (useMenuItems(branchCode) || {}) as {
    data?: MenuItem[];
    isLoading?: boolean;
    isFetching?: boolean;
    error?: Error;
    dataUpdatedAt?: number;
  };

  // Use cached data immediately if available while fetching fresh data
  const shouldShowCachedData = !isLoadingItems && menuItems.length > 0;
  const isInitialLoad = isLoadingItems && menuItems.length === 0;

  const visibleMenuItems = React.useMemo<MenuItem[]>(() => {
    if (!Array.isArray(menuItems)) return [];

    return menuItems.filter((item) => {
      const showValue =
        item.show_in_website ??
        item.showInWebsite ??
        item.displayOnWebsite ??
        item.showOnWebsite;
      const saleableValue =
        item.saleable ?? item.isSaleable ?? item.is_saleable;

      return (
        normalizeBooleanFlag(showValue) && normalizeBooleanFlag(saleableValue)
      );
    });
  }, [menuItems]);

  const {
    data: parentCategories = [],
    isLoading: isLoadingCategories = false,
    error: categoriesError,
  } = (useMenuCategories(branchCode) || {}) as {
    data?: MenuCategory[];
    isLoading?: boolean;
    error?: Error;
  };

  const {
    data: subCategories = [],
    isLoading: isLoadingSubCategories = false,
  } = (useSubCategories(activeParentCategory, branchCode) || {}) as {
    data?: MenuCategory[];
    isLoading?: boolean;
  };

  const sortedParentCategories = React.useMemo<MenuCategory[]>(() => {
    if (!Array.isArray(parentCategories)) return [];
    return [...parentCategories].sort((a, b) => {
      const orderA = (a?.orderGroup as number) || 0;
      const orderB = (b?.orderGroup as number) || 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return (a?.name || "").localeCompare(b?.name || "");
    });
  }, [parentCategories]);

  useEffect(() => {
    if (
      !activeParentCategory &&
      sortedParentCategories.length > 0 &&
      !showAllCategory
    ) {
      setActiveParentCategory(String(sortedParentCategories[0].id));
      setActiveSubCategory(null);
    }
  }, [activeParentCategory, sortedParentCategories, showAllCategory]);

  const sortedSubCategories = React.useMemo<MenuCategory[]>(() => {
    if (!Array.isArray(subCategories)) return [];
    return [...subCategories].sort((a, b) => {
      const orderA = (a?.orderGroup as number) || 0;
      const orderB = (b?.orderGroup as number) || 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return (a?.name || "").localeCompare(b?.name || "");
    });
  }, [subCategories]);

  useEffect(() => {
    if (activeParentCategory && sortedSubCategories.length > 0) {
      const firstSubCategory = sortedSubCategories[0];
      if (firstSubCategory?.id) {
        setActiveSubCategory(String(firstSubCategory.id));
      }
    } else if (!activeParentCategory) {
      setActiveSubCategory(null);
    }
  }, [activeParentCategory, sortedSubCategories]);

  const filteredItems = React.useMemo<MenuItem[]>(() => {
    if (!Array.isArray(visibleMenuItems)) return [];

    if (!showAllCategory && !activeParentCategory && !activeSubCategory)
      return [];

    // Early return if no items to filter
    if (visibleMenuItems.length === 0) return [];

    // Use more efficient filtering with early exits
    if (activeSubCategory) {
      return visibleMenuItems.filter(
        (item) => item?.category === activeSubCategory
      );
    }

    if (activeParentCategory) {
      return visibleMenuItems.filter(
        (item) => item?.category === activeParentCategory
      );
    }

    return visibleMenuItems;
  }, [
    visibleMenuItems,
    activeParentCategory,
    activeSubCategory,
    showAllCategory,
  ]);

  const sortedFilteredItems = useSortedMenuItems(filteredItems) || [];

  const activeCategoryName = React.useMemo(() => {
    if (activeSubCategory) {
      const subCategory = sortedSubCategories.find(
        (cat) => cat?.id === activeSubCategory
      );
      return subCategory?.name || t("all") || "All";
    }

    if (activeParentCategory) {
      const parentCategory = sortedParentCategories.find(
        (cat) => cat?.id === activeParentCategory
      );
      return parentCategory?.name || t("all") || "All";
    }

    if (sortedParentCategories.length > 0) {
      return sortedParentCategories[0]?.name;
    }

    return t("all") || "All";
  }, [
    activeParentCategory,
    activeSubCategory,
    sortedParentCategories,
    sortedSubCategories,
    t,
  ]);

  const handleParentCategorySelect = useCallback((categoryId: string | null) => {
    setActiveParentCategory(categoryId);
    setActiveSubCategory(null);
    setDropdownOpen(false);
  }, []);

  const handleSubCategorySelect = useCallback((categoryId: string | null) => {
    setActiveSubCategory(categoryId);
    setDropdownOpen(false);
  }, []);

  const menuItemComponents = React.useMemo(
    () => ({
      grid: GridMenuItem,
      list: ListMenuItem,
      card: CardMenuItem,
    }),
    []
  );

  const validViewKey = allowedViews.includes(currentView)
    ? currentView
    : "card";
  const currentViewStyle = VIEW_STYLES[validViewKey];
  const MenuItemComponent =
    menuItemComponents[validViewKey] ?? menuItemComponents.card;

  const scrollAmount = 200;

  const checkScrollPosition = useCallback(() => {
    if (!tabsContainerRef.current) return;
    try {
      const { scrollLeft, scrollWidth, clientWidth } = tabsContainerRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    } catch (error) {
      console.error("Error checking scroll position:", error);
    }
  }, []);

  const checkMobileScrollPosition = useCallback(() => {
    if (!mobileTabsContainerRef.current) return;
    try {
      const { scrollLeft, scrollWidth, clientWidth } =
        mobileTabsContainerRef.current;
      setShowLeftArrowMobile(scrollLeft > 0);
      setShowRightArrowMobile(scrollLeft < scrollWidth - clientWidth - 1);
    } catch (error) {
      console.error("Error checking mobile scroll position:", error);
    }
  }, []);
  const scrollCategories = useCallback(
    (direction: "left" | "right") => {
      if (!tabsContainerRef.current) return;
      try {
        const newScrollLeft =
          direction === "left"
            ? tabsContainerRef.current.scrollLeft - scrollAmount
            : tabsContainerRef.current.scrollLeft + scrollAmount;
        tabsContainerRef.current.scrollTo({
          left: newScrollLeft,
          behavior: "smooth",
        });
      } catch (error) {
        console.error("Error scrolling categories:", error);
      }
    },
    [scrollAmount]
  );

  const scrollCategoriesMobile = useCallback(
    (direction: "left" | "right") => {
      if (!mobileTabsContainerRef.current) return;
      try {
        const newScrollLeft =
          direction === "left"
            ? mobileTabsContainerRef.current.scrollLeft - scrollAmount
            : mobileTabsContainerRef.current.scrollLeft + scrollAmount;
        mobileTabsContainerRef.current.scrollTo({
          left: newScrollLeft,
          behavior: "smooth",
        });
      } catch (error) {
        console.error("Error scrolling categories (mobile):", error);
      }
    },
    [scrollAmount]
  );
  // (moved continuous scroll helpers below to avoid TDZ on callbacks)

  const checkSubScrollPosition = useCallback(() => {
    if (!subTabsContainerRef.current) return;
    try {
      const { scrollLeft, scrollWidth, clientWidth } =
        subTabsContainerRef.current;
      setShowSubLeftArrow(scrollLeft > 0);
      setShowSubRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    } catch (error) {
      console.error("Error checking sub scroll position:", error);
    }
  }, []);

  const checkMobileSubScrollPosition = useCallback(() => {
    if (!mobileSubTabsContainerRef.current) return;
    try {
      const { scrollLeft, scrollWidth, clientWidth } =
        mobileSubTabsContainerRef.current;
      setShowSubLeftArrowMobile(scrollLeft > 0);
      setShowSubRightArrowMobile(scrollLeft < scrollWidth - clientWidth - 1);
    } catch (error) {
      console.error("Error checking sub scroll position (mobile):", error);
    }
  }, []);
  const scrollSubCategories = useCallback(
    (direction: "left" | "right") => {
      if (!subTabsContainerRef.current) return;
      try {
        const newScrollLeft =
          direction === "left"
            ? subTabsContainerRef.current.scrollLeft - scrollAmount
            : subTabsContainerRef.current.scrollLeft + scrollAmount;
        subTabsContainerRef.current.scrollTo({
          left: newScrollLeft,
          behavior: "smooth",
        });
      } catch (error) {
        console.error("Error scrolling subcategories:", error);
      }
    },
    [scrollAmount]
  );

  const scrollSubCategoriesMobile = useCallback(
    (direction: "left" | "right") => {
      if (!mobileSubTabsContainerRef.current) return;
      try {
        const newScrollLeft =
          direction === "left"
            ? mobileSubTabsContainerRef.current.scrollLeft - scrollAmount
            : mobileSubTabsContainerRef.current.scrollLeft + scrollAmount;
        mobileSubTabsContainerRef.current.scrollTo({
          left: newScrollLeft,
          behavior: "smooth",
        });
      } catch (error) {
        console.error("Error scrolling subcategories (mobile):", error);
      }
    },
    [scrollAmount]
  );
  // Continuous scroll helpers for parent categories (after checks to avoid TDZ)
  const categoryScrollIntervalRef = useRef<number | null>(null);
  const startCategoryContinuousScroll = useCallback((direction: "left" | "right") => {
    const step = direction === "left" ? -20 : 20;
    if (!tabsContainerRef.current) return;
    if (categoryScrollIntervalRef.current) {
      window.clearInterval(categoryScrollIntervalRef.current);
      categoryScrollIntervalRef.current = null;
    }
    const tick = () => {
      if (!tabsContainerRef.current) return;
      tabsContainerRef.current.scrollBy({ left: step, behavior: "auto" });
      checkScrollPosition();
    };
    tick();
    categoryScrollIntervalRef.current = window.setInterval(tick, 16);
  }, [checkScrollPosition]);
  const stopCategoryContinuousScroll = useCallback(() => {
    if (categoryScrollIntervalRef.current) {
      window.clearInterval(categoryScrollIntervalRef.current);
      categoryScrollIntervalRef.current = null;
    }
  }, []);

  // Continuous scroll helpers for subcategories (after checks to avoid TDZ)
  const subCategoryScrollIntervalRef = useRef<number | null>(null);
  const startSubContinuousScroll = useCallback((direction: "left" | "right") => {
    const step = direction === "left" ? -20 : 20;
    if (!subTabsContainerRef.current) return;
    if (subCategoryScrollIntervalRef.current) {
      window.clearInterval(subCategoryScrollIntervalRef.current);
      subCategoryScrollIntervalRef.current = null;
    }
    const tick = () => {
      if (!subTabsContainerRef.current) return;
      subTabsContainerRef.current.scrollBy({ left: step, behavior: "auto" });
      checkSubScrollPosition();
    };
    tick();
    subCategoryScrollIntervalRef.current = window.setInterval(tick, 16);
  }, [checkSubScrollPosition]);
  const stopSubContinuousScroll = useCallback(() => {
    if (subCategoryScrollIntervalRef.current) {
      window.clearInterval(subCategoryScrollIntervalRef.current);
      subCategoryScrollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (sortedParentCategories.length > 0) {
      checkScrollPosition();
      window.addEventListener("resize", checkScrollPosition);
      return () => window.removeEventListener("resize", checkScrollPosition);
    }
  }, [sortedParentCategories, checkScrollPosition]);

  // Mobile parent categories scroll visibility
  useEffect(() => {
    if (sortedParentCategories.length > 0) {
      checkMobileScrollPosition();
      window.addEventListener("resize", checkMobileScrollPosition);
      return () =>
        window.removeEventListener("resize", checkMobileScrollPosition);
    }
  }, [sortedParentCategories, checkMobileScrollPosition]);
  useEffect(() => {
    if (sortedSubCategories.length > 0) {
      checkSubScrollPosition();
      window.addEventListener("resize", checkSubScrollPosition);
      return () => window.removeEventListener("resize", checkSubScrollPosition);
    }
  }, [sortedSubCategories, checkSubScrollPosition]);

  // Mobile subcategories scroll visibility
  useEffect(() => {
    if (sortedSubCategories.length > 0) {
      checkMobileSubScrollPosition();
      window.addEventListener("resize", checkMobileSubScrollPosition);
      return () =>
        window.removeEventListener("resize", checkMobileSubScrollPosition);
    }
  }, [sortedSubCategories, checkMobileSubScrollPosition]);
  if (!branchCode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 p-4">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-orange-200 bg-white p-8 text-center shadow-xl">
          <h2 className="text-2xl font-semibold text-gray-900">
            {t("selectBranch")}
          </h2>
          <p className="text-gray-600">{t("selectBranchDescription")}</p>
          <Button
            asChild
            className="rounded-xl border-0 bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 font-semibold text-white shadow-md transition hover:from-orange-600 hover:to-orange-700 hover:shadow-lg"
          >
            <Link to="/">{t("back") || "Back"}</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (itemsError || categoriesError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 p-4">
        <div className="w-full max-w-md rounded-2xl border border-orange-200 bg-white p-8 text-center shadow-xl">
          <h2 className="text-2xl font-semibold text-gray-900">
            {t("menuLoadError") || "Error Loading Menu"}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            {itemsError?.message ||
              categoriesError?.message ||
              "Failed to load menu data"}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="mt-6 rounded-xl border-0 bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 font-semibold text-white shadow-md transition hover:from-orange-600 hover:to-orange-700 hover:shadow-lg"
          >
            {t("tryAgain") || "Try Again"}
          </Button>
        </div>
      </div>
    );
  }

  const skeletonCount = validViewKey === "grid" ? 8 : 6;
  // Show loading only on initial load, not when refetching (we show cached data)
  const isLoadingContent = isInitialLoad || isLoadingSubCategories;
  const hasItems =
    Array.isArray(sortedFilteredItems) && sortedFilteredItems.length > 0;
  
  // Show subtle loading indicator when refreshing in background
  const isRefreshing = isFetchingItems && !isInitialLoad && shouldShowCachedData;

  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50",
        language === "ar" ? "text-right" : "text-left"
      )}
    >
      <header className="sticky top-0 z-40 border-b border-orange-100 bg-white/95 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4 lg:px-8">
          <Button
            variant="ghost"
            asChild
            size="sm"
            className="flex-shrink-0 rounded-xl border border-transparent px-4 py-3 transition hover:border-orange-200 hover:bg-orange-50"
          >
            <Link to="/" className="flex items-center gap-3">
              <ArrowLeft
                className={cn(
                  "h-5 w-5 text-orange-600 transition-transform duration-200 group-hover:-translate-x-1",
                  language === "ar" ? "rotate-180" : ""
                )}
              />
              <span className="hidden font-semibold text-gray-700 sm:inline">
                {t("back") || "Back"}
              </span>
            </Link>
          </Button>

          <div className="flex flex-1 flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-semibold text-gray-900 sm:text-3xl lg:text-4xl">
              {t("ourMenu") || "Our Menu"}
            </h1>
            {branchName && (
              <span className="text-sm font-medium text-gray-500">
                {branchName}
              </span>
            )}
          </div>

          <div className="flex flex-shrink-0 items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl border border-orange-200 bg-white px-3 py-2 shadow-sm transition hover:border-orange-300 hover:bg-orange-50"
                >
                  {React.createElement(currentViewStyle.icon, {
                    className: "h-4 w-4 text-orange-500",
                  })}
                  <ChevronDown className="ml-2 h-3 w-3 text-orange-400 transition group-hover:rotate-180" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-xl border border-orange-100 bg-white/95 p-1 shadow-lg backdrop-blur"
                align="end"
                sideOffset={8}
              >
                {Object.entries(VIEW_STYLES).map(([key, style]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() =>
                      handleChangeView(key as keyof typeof VIEW_STYLES)
                    }
                    className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 hover:bg-orange-50"
                  >
                    <span className="flex items-center gap-3 text-sm font-medium text-gray-800">
                      {React.createElement(style.icon, {
                        className: "h-4 w-4 text-orange-500",
                      })}
                      {style.name}
                    </span>
                    {validViewKey === key && (
                      <Check className="h-4 w-4 text-orange-500" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-8 lg:px-8">
        {isLoadingCategories ? (
          <div className="py-6 lg:py-8">
            <Skeleton className="h-12 w-full rounded-2xl bg-orange-100/70" />
          </div>
        ) : (
          <>
            <div className="sticky top-[88px] z-30 -mx-4 bg-white/95 px-4 pb-4 pt-6 backdrop-blur lg:hidden">
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 z-40 -translate-y-1/2 rounded-full border-orange-200 bg-white/95 shadow-md transition hover:border-orange-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => scrollCategoriesMobile("left")}
                onMouseDown={() => startCategoryContinuousScroll("left")}
                onMouseUp={stopCategoryContinuousScroll}
                onMouseLeave={stopCategoryContinuousScroll}
                onTouchStart={() => startCategoryContinuousScroll("left")}
                onTouchEnd={stopCategoryContinuousScroll}
                disabled={!showLeftArrowMobile}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 z-40 -translate-y-1/2 rounded-full border-orange-200 bg-white/95 shadow-md transition hover:border-orange-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => scrollCategoriesMobile("right")}
                onMouseDown={() => startCategoryContinuousScroll("right")}
                onMouseUp={stopCategoryContinuousScroll}
                onMouseLeave={stopCategoryContinuousScroll}
                onTouchStart={() => startCategoryContinuousScroll("right")}
                onTouchEnd={stopCategoryContinuousScroll}
                disabled={!showRightArrowMobile}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Tabs
                value={activeParentCategory || "all"}
                className=""
              >
                <div
                  ref={mobileTabsContainerRef}
                  className="flex overflow-x-auto scrollbar-hide"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  onScroll={checkMobileScrollPosition}
                >
                  <TabsList className="flex w-max gap-2 rounded-3xl border border-orange-100 bg-white/80 p-1">
                    {showAllCategory && (
                      <TabsTrigger
                        value="all"
                        onClick={() => {
                          setActiveParentCategory(null);
                          setActiveSubCategory(null);
                        }}
                        className="rounded-2xl px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-orange-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
                      >
                        {t("all") || "All"}
                      </TabsTrigger>
                    )}
                    {sortedParentCategories.map((category) => (
                      <TabsTrigger
                        key={category?.id ?? `parent-${category?.name}`}
                        value={category?.id ? String(category.id) : ""}
                        onClick={() =>
                          handleParentCategorySelect(
                            category?.id ? String(category.id) : null
                          )
                        }
                        className="rounded-2xl px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-orange-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
                      >
                        {category?.name || "Unknown Category"}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </Tabs>
            </div>

            <div className="relative hidden lg:block">
              {showLeftArrow && (
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border-orange-200 bg-white/95 shadow-md transition hover:border-orange-300 hover:bg-white lg:hidden"
                  onClick={() => scrollCategories("left")}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              {showRightArrow && (
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border-orange-200 bg-white/95 shadow-md transition hover:border-orange-300 hover:bg-white lg:hidden"
                  onClick={() => scrollCategories("right")}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              <Tabs
                value={activeParentCategory || "all"}
                className="sticky top-[104px] -mx-8 bg-white/95 px-8 pb-4 pt-6 backdrop-blur"
              >
                <div
                  ref={tabsContainerRef}
                  className="flex overflow-x-auto scrollbar-hide justify-center"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  onScroll={checkScrollPosition}
                >
                  <TabsList className="flex w-max gap-2 rounded-3xl border border-orange-100 bg-white/80 p-1">
                    {showAllCategory && (
                      <TabsTrigger
                        value="all"
                        onClick={() => {
                          setActiveParentCategory(null);
                          setActiveSubCategory(null);
                        }}
                        className="rounded-2xl px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-orange-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
                      >
                        {t("all") || "All"}
                      </TabsTrigger>
                    )}
                    {sortedParentCategories.map((category) => (
                      <TabsTrigger
                        key={category?.id ?? `parent-${category?.name}`}
                        value={category?.id ? String(category.id) : ""}
                        onClick={() =>
                          handleParentCategorySelect(
                            category?.id ? String(category.id) : null
                          )
                        }
                        className="rounded-2xl px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-orange-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white"
                      >
                        {category?.name || "Unknown Category"}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
              </Tabs>
            </div>

            {activeParentCategory && sortedSubCategories.length > 0 && (
              <>
                <div className="sticky top-[148px] z-20 -mx-4 bg-white/95 px-4 pb-4 pt-2 backdrop-blur lg:hidden">
                  {showSubLeftArrow && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-0 top-1/2 z-30 -translate-y-1/2 rounded-full border-blue-200 bg-white/95 shadow-md transition hover:border-blue-300 hover:bg-white"
                      onClick={() => scrollSubCategories("left")}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  )}
                  {showSubRightArrow && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-0 top-1/2 z-30 -translate-y-1/2 rounded-full border-blue-200 bg-white/95 shadow-md transition hover:border-blue-300 hover:bg-white"
                      onClick={() => scrollSubCategories("right")}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                  <Tabs
                    value={
                      activeSubCategory ||
                      (sortedSubCategories.length > 0
                        ? String(sortedSubCategories[0]?.id ?? "")
                        : "all-sub")
                    }
                    className=""
                  >
                    <div
                      ref={subTabsContainerRef}
                      className="flex overflow-x-auto scrollbar-hide justify-center"
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                      onScroll={checkSubScrollPosition}
                    >
                      <TabsList className="flex w-max gap-2 rounded-2xl border border-orange-100 bg-orange-50/60 p-1">
                        {/* <TabsTrigger
                          value="all-sub"
                          onClick={() => handleSubCategorySelect(null)}
                          className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-white data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm"
                        >
                          {t("all") || "All"}
                        </TabsTrigger> */}
                        {sortedSubCategories.map((subCategory) => (
                          <TabsTrigger
                            key={subCategory?.id ?? `sub-${subCategory?.name}`}
                            value={subCategory?.id ? String(subCategory.id) : ""}
                            onClick={() =>
                              handleSubCategorySelect(
                                subCategory?.id ? String(subCategory.id) : null
                              )
                            }
                            className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-white data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm"
                          >
                            {subCategory?.name || "Unknown Subcategory"}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>
                  </Tabs>
                </div>

                <div className="relative hidden lg:block">
                  {showSubLeftArrow && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border-blue-200 bg-white/95 shadow-md transition hover:border-blue-300 hover:bg-white lg:hidden"
                      onClick={() => scrollSubCategories("left")}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  )}
                  {showSubRightArrow && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border-blue-200 bg-white/95 shadow-md transition hover:border-blue-300 hover:bg-white lg:hidden"
                      onClick={() => scrollSubCategories("right")}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border-blue-200 bg-white/95 shadow-md transition hover:border-blue-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed lg:hidden"
                      onClick={() => scrollSubCategoriesMobile("left")}
                      onMouseDown={() => startSubContinuousScroll("left")}
                      onMouseUp={stopSubContinuousScroll}
                      onMouseLeave={stopSubContinuousScroll}
                      onTouchStart={() => startSubContinuousScroll("left")}
                      onTouchEnd={stopSubContinuousScroll}
                      disabled={!showSubLeftArrowMobile}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border-blue-200 bg-white/95 shadow-md transition hover:border-blue-300 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed lg:hidden"
                      onClick={() => scrollSubCategoriesMobile("right")}
                      onMouseDown={() => startSubContinuousScroll("right")}
                      onMouseUp={stopSubContinuousScroll}
                      onMouseLeave={stopSubContinuousScroll}
                      onTouchStart={() => startSubContinuousScroll("right")}
                      onTouchEnd={stopSubContinuousScroll}
                      disabled={!showSubRightArrowMobile}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Tabs
                      value={
                        activeSubCategory ||
                        (sortedSubCategories.length > 0
                          ? String(sortedSubCategories[0]?.id ?? "")
                          : "")
                      }
                      className="sticky top-[168px] -mx-8 bg-white/95 px-8 pb-4 pt-2 backdrop-blur"
                    >
                      <div
                        ref={mobileSubTabsContainerRef}
                        className="flex overflow-x-auto scrollbar-hide"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                        onScroll={checkMobileSubScrollPosition}
                      >
                        <TabsList className="flex w-max gap-2 rounded-2xl border border-orange-100 bg-orange-50/60 p-1">
                          {sortedSubCategories.map((subCategory) => (
                            <TabsTrigger
                              key={subCategory?.id ?? `sub-${subCategory?.name}`}
                              value={subCategory?.id ? String(subCategory.id) : ""}
                              onClick={() =>
                                handleSubCategorySelect(
                                  subCategory?.id ? String(subCategory.id) : null
                                )
                              }
                              className="rounded-xl px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-white data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm"
                            >
                              {subCategory?.name || "Unknown Subcategory"}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                      </div>
                    </Tabs>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        <section
          className={cn(
            "relative pt-6",
            activeParentCategory && sortedSubCategories.length > 0
              ? "lg:pt-4"
              : undefined
          )}
        >
          {/* Subtle loading indicator when refreshing in background */}
          {isRefreshing && (
            <div className="absolute top-0 right-0 z-50 m-4">
              <div className="flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-orange-600 shadow-md backdrop-blur-sm">
                <div className="h-2 w-2 animate-pulse rounded-full bg-orange-500" />
                Updating...
              </div>
            </div>
          )}
          {isLoadingContent ? (
            <div className={currentViewStyle.containerClass}>
              {Array.from({ length: skeletonCount }).map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    currentViewStyle.itemClass,
                    "rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"
                  )}
                >
                  <Skeleton
                    className={cn(
                      "mb-4 w-full rounded-xl bg-orange-100/70",
                      validViewKey === "grid" ? "aspect-square" : "h-28"
                    )}
                  />
                  <Skeleton className="mb-2 h-5 w-3/4 rounded bg-orange-100/70" />
                  <Skeleton className="h-4 w-1/2 rounded bg-orange-100/70" />
                </div>
              ))}
            </div>
          ) : (
            <div className={currentViewStyle.containerClass}>
                {hasItems ? (
                  sortedFilteredItems.map((item, index) => {
                    if (!item) return null;
                    return (
                      <div
                        key={item.id || index}
                        className={cn(currentViewStyle.itemClass)}
                      >
                        <MenuItemComponent
                          item={item}
                          language={language}
                          getImageSrc={getImageSrc}
                        />
                      </div>
                    );
                  })
                ) : (
                <div className="col-span-full flex flex-col items-center rounded-2xl border border-orange-100 bg-white px-6 py-16 text-center shadow-sm">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 text-orange-500">
                    <LayoutGrid className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold text-gray-900">
                    {t("noItemsInCategory") || "No items found"}
                  </h3>
                  <p className="mt-2 max-w-md text-sm text-gray-600">
                    {activeSubCategory
                      ? t("noItemsInSubcategory") ||
                        "No items in this subcategory. Try selecting a different one."
                      : t("trySelectingDifferentCategory") ||
                        "Try selecting a different category or check back later."}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Menu;
