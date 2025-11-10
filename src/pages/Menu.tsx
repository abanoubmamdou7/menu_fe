/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState, useRef, useEffect } from "react";
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
  Plus,
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
  useCategoryHierarchy,
} from "@/services/menuServices";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/hooks/useLanguage";
import MenuItemCard from "@/components/MenuItemCard";
import { Skeleton } from "@/components/ui/skeleton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { cn } from "@/lib/utils";
import { useRestaurantInfo } from "../services/restaurantInfoService.ts";
import { useSortedMenuItems } from "@/hooks/useSortedMenuItems.ts";
import { useMenuItemImage } from "../getImageSrc.ts";

// Enhanced view styles with professional improvements
const VIEW_STYLES = {
  grid: {
    name: "Grid View",
    icon: Grid3X3,
    containerClass:
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8",
    itemClass:
      "bg-white rounded-2xl shadow-lg border border-orange-100/50 overflow-hidden hover:shadow-2xl hover:border-orange-200 hover:-translate-y-2 transition-all duration-500 ease-out",
  },
  list: {
    name: "List View",
    icon: List,
    containerClass: "space-y-4 lg:space-y-5",
    itemClass:
      "bg-white rounded-xl shadow-md border border-orange-100/50 overflow-hidden hover:shadow-xl hover:border-orange-200 transition-all duration-400 ease-out",
  },
  card: {
    name: "Card View",
    icon: LayoutGrid,
    containerClass: "grid gap-6 lg:gap-8",
    itemClass:
      "bg-white rounded-2xl shadow-lg border border-orange-100/50 overflow-hidden hover:shadow-2xl hover:border-orange-200 transition-all duration-500 ease-out",
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

// Professional Menu Item Components with original colors
const GridMenuItem = ({ item }) => {
  const { getImageSrc } = useMenuItemImage();
  const { language } = useLanguage();

  return (
    <div className="group cursor-pointer h-full flex flex-col">
      <div className="relative aspect-square mb-4 overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-orange-100">
        <img
          src={getImageSrc(item)}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          onError={(e) => (e.currentTarget.src = "/placeholder-food.jpg")}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-orange-900/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="text-xl font-bold text-restaurant-dark mb-1">
          {item.name}
          {language === "ar" && item.name && item.nameAr && (
            <span className="block text-sm font-normal text-gray-500 mt-1 ltr:text-left">
              {item.name}
            </span>
          )}
        </h3>
        <p className="text-sm line-clamp-2 text-gray-700 mb-2">
          {language === "ar"
            ? item.descriptionAr || item.description
            : item.description}
          {language === "en" && item.nameAr && (
            <span className="block text-sm font-normal text-gray-500 mt-1 rtl:text-right">
              {item.nameAr}
            </span>
          )}
          {language === "en" && item.descriptionAr && (
            <span className="block text-xs text-gray-500 mt-1 rtl:text-right line-clamp-1">
              {item.descriptionAr}
            </span>
          )}
          {language === "ar" && item.description && item.descriptionAr && (
            <span className="block text-xs text-gray-500 mt-1 ltr:text-left line-clamp-1">
              {item.description}
            </span>
          )}
        </p>
        {/* Render tag icons */}
        <div className="flex flex-wrap gap-2 mb-2">
          {item.tagIcons?.fasting && (
            <img
              src={item.tagIcons.fasting}
              alt="Fasting"
              className="w-5 h-5"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
          {item.tagIcons?.vegetarian && (
            <img
              src={item.tagIcons.vegetarian}
              alt="Vegetarian"
              className="w-5 h-5"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
          {item.tagIcons?.healthyChoice && (
            <img
              src={item.tagIcons.healthyChoice}
              alt="Healthy Choice"
              className="w-5 h-5"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
          {item.tagIcons?.signatureDish && (
            <img
              src={item.tagIcons.signatureDish}
              alt="Signature Dish"
              className="w-5 h-5"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
          {item.tagIcons?.spicy && (
            <img
              src={item.tagIcons.spicy}
              alt="Spicy"
              className="w-5 h-5"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
        </div>
        <div className="flex justify-between items-center mt-auto">
          <span className="text-orange-500 font-bold text-lg tracking-tight">
            {item.price}
          </span>
        </div>
      </div>
    </div>
  );
};

const ListMenuItem = ({ item }) => {
  const { getImageSrc } = useMenuItemImage();
  const { language } = useLanguage();

  return (
    <div className="flex items-center gap-5 p-5 group cursor-pointer">
      <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-orange-50 to-orange-100 shadow-md">
        <img
          src={getImageSrc(item)}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => (e.currentTarget.src = "/placeholder-food.jpg")}
        />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-900 text-base mb-1 truncate group-hover:text-orange-600 transition-colors duration-300">
          {item.name}
        </h3>
        <p className="text-sm line-clamp-2 text-gray-700 mb-2">
          {language === "ar"
            ? item.descriptionAr || item.description
            : item.description}
          {language === "en" && item.nameAr && (
            <span className="block text-sm font-normal text-gray-500 mt-1 rtl:text-right">
              {item.nameAr}
            </span>
          )}
          {language === "en" && item.descriptionAr && (
            <span className="block text-xs text-gray-500 mt-1 rtl:text-right line-clamp-1">
              {item.descriptionAr}
            </span>
          )}
          {language === "ar" && item.description && item.descriptionAr && (
            <span className="block text-xs text-gray-500 mt-1 ltr:text-left line-clamp-1">
              {item.description}
            </span>
          )}
        </p>
        {/* Render tag icons */}
        <div className="flex flex-wrap gap-2 mb-2">
          {item.tagIcons?.fasting && (
            <img
              src={item.tagIcons.fasting}
              alt="Fasting"
              className="w-5 h-5"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
          {item.tagIcons?.vegetarian && (
            <img
              src={item.tagIcons.vegetarian}
              alt="Vegetarian"
              className="w-5 h-5"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
          {item.tagIcons?.healthyChoice && (
            <img
              src={item.tagIcons.healthyChoice}
              alt="Healthy Choice"
              className="w-5 h-5"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
          {item.tagIcons?.signatureDish && (
            <img
              src={item.tagIcons.signatureDish}
              alt="Signature Dish"
              className="w-5 h-5"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
          {item.tagIcons?.spicy && (
            <img
              src={item.tagIcons.spicy}
              alt="Spicy"
              className="w-5 h-5"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-3 flex-shrink-0">
        <span className="text-orange-500 font-bold text-lg tracking-tight">
          {item.price}
        </span>
      </div>
    </div>
  );
};

const CardMenuItem = ({ item }) => {
  const { getImageSrc } = useMenuItemImage();
  const { language } = useLanguage();

  return (
    <div className="group cursor-pointer">
      <div className="flex flex-col sm:flex-row">
        <div className="relative w-full sm:w-48 md:w-56 h-56 sm:h-40 md:h-48 flex-shrink-0 bg-gradient-to-br from-orange-50 to-orange-100">
          <img
            src={getImageSrc(item)}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            onError={(e) => (e.currentTarget.src = "/placeholder-food.jpg")}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-orange-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
        <div className="flex-1 p-6 lg:p-8 flex flex-col">
          <h3 className="font-bold text-gray-900 text-xl lg:text-2xl mb-3 group-hover:text-orange-600 transition-colors duration-300 leading-tight">
            {item.name}
          </h3>
          <p className="text-sm line-clamp-2 text-gray-700 mb-2">
            {language === "ar"
              ? item.descriptionAr || item.description
              : item.description}
            {language === "en" && item.nameAr && (
              <span className="block text-sm font-normal text-gray-500 mt-1 rtl:text-right">
                {item.nameAr}
              </span>
            )}
            {language === "en" && item.descriptionAr && (
              <span className="block text-xs text-gray-500 mt-1 rtl:text-right line-clamp-1">
                {item.descriptionAr}
              </span>
            )}
            {language === "ar" && item.description && item.descriptionAr && (
              <span className="block text-xs text-gray-500 mt-1 ltr:text-left line-clamp-1">
                {item.description}
              </span>
            )}
          </p>
          {/* Render tag icons */}
          <div className="flex flex-wrap gap-2 mb-2">
            {item.tagIcons?.fasting && (
              <img
                src={item.tagIcons.fasting}
                alt="Fasting"
                className="w-5 h-5"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
            {item.tagIcons?.vegetarian && (
              <img
                src={item.tagIcons.vegetarian}
                alt="Vegetarian"
                className="w-5 h-5"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
            {item.tagIcons?.healthyChoice && (
              <img
                src={item.tagIcons.healthyChoice}
                alt="Healthy Choice"
                className="w-5 h-5"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
            {item.tagIcons?.signatureDish && (
              <img
                src={item.tagIcons.signatureDish}
                alt="Signature Dish"
                className="w-5 h-5"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
            {item.tagIcons?.spicy && (
              <img
                src={item.tagIcons.spicy}
                alt="Spicy"
                className="w-5 h-5"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
          </div>
          <div className="flex justify-between items-center mt-auto">
            <span className="text-orange-500 font-bold text-2xl tracking-tight">
              {item.price}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Menu = () => {
  const [hasError, setHasError] = useState(false);

  try {
    const { t } = useTranslation() || { t: (key) => key };
    const { language } = useLanguage() || { language: "en" };
    const [searchParams] = useSearchParams();

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

    if (!branchCode) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-orange-200 p-8 max-w-md w-full text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {t("selectBranch")}
            </h2>
            <p className="text-gray-600">{t("selectBranchDescription")}</p>
            <Button
              asChild
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0"
            >
              <Link to="/">{t("back") || "Back"}</Link>
            </Button>
          </div>
        </div>
      );
    }

    // States for nested navigation
    const [activeParentCategory, setActiveParentCategory] = useState(null);
    const [activeSubCategory, setActiveSubCategory] = useState(null);
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(false);
    const [showSubLeftArrow, setShowSubLeftArrow] = useState(false);
    const [showSubRightArrow, setShowSubRightArrow] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [currentView, setCurrentView] = useState("card");

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const tabsContainerRef = useRef(null);
    const subTabsContainerRef = useRef(null);

    useEffect(() => {
      setActiveParentCategory(null);
      setActiveSubCategory(null);
    }, [branchCode]);

    // Get restaurant info and extract style options
    const { data: restaurantInfo, isLoading: isLoadingRestaurant } =
      useRestaurantInfo();
    const showAllCategory = !!restaurantInfo?.show_all_category;

    const allowedViews = ["grid", "list", "card"];
    const defaultView = restaurantInfo?.style;

    useEffect(() => {
      // 1️⃣ Check if user has saved preference
      const savedView = localStorage.getItem("menuView");

      if (savedView && allowedViews.includes(savedView)) {
        setCurrentView(savedView); // User preference wins
      } else if (defaultView && allowedViews.includes(defaultView)) {
        setCurrentView(defaultView); // Admin default fallback
      } else {
        setCurrentView("grid"); // Final fallback
      }
    }, [defaultView]);

    // 2️⃣ Function when user changes view
    const handleChangeView = (view: string) => {
      if (allowedViews.includes(view)) {
        setCurrentView(view);
        localStorage.setItem("menuView", view); // Save user choice
      }
    };

    const {
      data: menuItems = [],
      isLoading: isLoadingItems = false,
      error: itemsError,
    } = useMenuItems(branchCode) || {};

    const visibleMenuItems = React.useMemo(() => {
      if (!Array.isArray(menuItems)) return [];

      return menuItems.filter((item) => {
        const rawItem = item as unknown as Record<string, unknown>;

        const showValue =
          rawItem["show_in_website"] ??
          rawItem["showInWebsite"] ??
          rawItem["displayOnWebsite"] ??
          rawItem["showOnWebsite"];
        const saleableValue =
          rawItem["saleable"] ?? rawItem["isSaleable"] ?? rawItem["is_saleable"];

        return (
          normalizeBooleanFlag(showValue) && normalizeBooleanFlag(saleableValue)
        );
      });
    }, [menuItems]);

    const {
      data: parentCategories = [],
      isLoading: isLoadingCategories = false,
      error: categoriesError,
    } = useMenuCategories(branchCode) || {};

    // Get subcategories for the active parent category
    const {
      data: subCategories = [],
      isLoading: isLoadingSubCategories = false,
    } = useSubCategories(activeParentCategory, branchCode);

    // Sort parent categories by order_group
    const sortedParentCategories = React.useMemo(() => {
      if (!Array.isArray(parentCategories)) return [];
      return [...parentCategories].sort((a, b) => {
        const orderA = a.orderGroup || 0;
        const orderB = b.orderGroup || 0;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return (a.name || "").localeCompare(b.name || "");
      });
    }, [parentCategories]);
    useEffect(() => {
      if (
        !activeParentCategory &&
        sortedParentCategories?.length > 0 &&
        !showAllCategory
      ) {
        // auto select first parent category only when "All" option is hidden
        setActiveParentCategory(sortedParentCategories[0].id);
        setActiveSubCategory(null); // reset subcategory
      }
    }, [activeParentCategory, sortedParentCategories, showAllCategory]);

    // Sort subcategories by order_group
    const sortedSubCategories = React.useMemo(() => {
      if (!Array.isArray(subCategories)) return [];
      return [...subCategories].sort((a, b) => {
        const orderA = a.orderGroup || 0;
        const orderB = b.orderGroup || 0;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return (a.name || "").localeCompare(b.name || "");
      });
    }, [subCategories]);
    // Replace the existing useEffect with this:
    useEffect(() => {
      if (activeParentCategory && sortedSubCategories.length > 0) {
        const firstSubCategory = sortedSubCategories[0];
        if (firstSubCategory?.id) {
          setActiveSubCategory(firstSubCategory.id);
        }
      } else if (!activeParentCategory) {
        setActiveSubCategory(null);
      }
    }, [activeParentCategory, sortedSubCategories]); // Remove activeSubCategory from deps

    // Filter and sort menu items based on active category/subcategory
    const filteredItems = React.useMemo(() => {
      if (!Array.isArray(visibleMenuItems)) return [];

      // If no parent category is selected and showAllCategory is disabled
      if (!showAllCategory && !activeParentCategory && !activeSubCategory)
        return [];

      // If subcategory is selected, filter by subcategory
      if (activeSubCategory) {
        return visibleMenuItems.filter(
          (item) => item?.category === activeSubCategory
        );
      }

      // If parent category is selected but no subcategory, show items from parent category
      if (activeParentCategory) {
        return visibleMenuItems.filter(
          (item) => item?.category === activeParentCategory
        );
      }

      // Show all items if showAllCategory is enabled and no specific category is selected
      return visibleMenuItems;
    }, [
      visibleMenuItems,
      activeParentCategory,
      activeSubCategory,
      showAllCategory,
    ]);

    const sortedFilteredItems = useSortedMenuItems(filteredItems);

    // Get active category name for display

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

      // ✅ if nothing is selected, default to the first category
      if (sortedParentCategories?.length > 0) {
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

    // Handle parent category selection
    const handleParentCategorySelect = (categoryId) => {
      setActiveParentCategory(categoryId);
      setActiveSubCategory(null); // Reset subcategory when parent changes
      setDropdownOpen(false);
    };

    // Handle subcategory selection
    const handleSubCategorySelect = (categoryId) => {
      setActiveSubCategory(categoryId);
      setDropdownOpen(false);
    };

    // Render menu item based on current view
    const renderMenuItem = (item, index) => {
      const commonProps = { item, key: item.id || index };

      switch (currentView) {
        case "grid":
          return <GridMenuItem {...commonProps} />;
        case "list":
          return <ListMenuItem {...commonProps} />;
        case "card":
        default:
          return <CardMenuItem {...commonProps} />;
      }
    };

    // Scroll functions for parent categories
    const checkScrollPosition = () => {
      if (!tabsContainerRef.current) return;
      try {
        const { scrollLeft, scrollWidth, clientWidth } =
          tabsContainerRef.current;
        setShowLeftArrow(scrollLeft > 0);
        setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
      } catch (error) {
        console.error("Error checking scroll position:", error);
      }
    };

    const scrollCategories = (direction) => {
      if (!tabsContainerRef.current) return;
      try {
        const scrollAmount = 200;
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
    };

    // Scroll functions for subcategories
    const checkSubScrollPosition = () => {
      if (!subTabsContainerRef.current) return;
      try {
        const { scrollLeft, scrollWidth, clientWidth } =
          subTabsContainerRef.current;
        setShowSubLeftArrow(scrollLeft > 0);
        setShowSubRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
      } catch (error) {
        console.error("Error checking sub scroll position:", error);
      }
    };

    const scrollSubCategories = (direction) => {
      if (!subTabsContainerRef.current) return;
      try {
        const scrollAmount = 200;
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
    };

    // Effect for parent categories scroll
    useEffect(() => {
      if (sortedParentCategories?.length > 0) {
        checkScrollPosition();
        window.addEventListener("resize", checkScrollPosition);
        return () => window.removeEventListener("resize", checkScrollPosition);
      }
    }, [sortedParentCategories]);

    // Effect for subcategories scroll
    useEffect(() => {
      if (sortedSubCategories?.length > 0) {
        checkSubScrollPosition();
        window.addEventListener("resize", checkSubScrollPosition);
        return () =>
          window.removeEventListener("resize", checkSubScrollPosition);
      }
    }, [sortedSubCategories]);

    if (itemsError || categoriesError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-orange-200 p-8 max-w-md w-full text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Error Loading Menu
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              {itemsError?.message ||
                categoriesError?.message ||
                "Failed to load menu data"}
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0"
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div
        className={cn(
          "min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50",
          language === "ar" ? "text-right" : "text-left"
        )}
      >
        {/* Enhanced Header with original colors */}
        <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/95 border-b border-orange-200/60 shadow-lg">
          <div className="container mx-auto px-4 lg:px-8 py-4 lg:py-6">
            <div className="flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                asChild
                size="sm"
                className="group hover:bg-orange-100 transition-all duration-300 flex-shrink-0 rounded-xl px-4 py-3 border border-transparent hover:border-orange-200"
              >
                <Link to="/" className="flex items-center gap-3">
                  <ArrowLeft
                    className={cn(
                      "w-5 h-5 transition-transform duration-300 group-hover:-translate-x-1 text-orange-600",
                      language === "ar"
                        ? "rotate-180 group-hover:translate-x-1"
                        : ""
                    )}
                  />
                  <span className="font-semibold text-gray-700 hidden sm:inline">
                    {t("back") || "Back"}
                  </span>
                </Link>
              </Button>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center flex-1 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 bg-clip-text text-transparent px-4">
                {t("ourMenu") || "Our Menu"}
                {branchName && (
                  <span className="block text-base font-semibold text-gray-700 mt-1 text-center">
                    {branchName}
                  </span>
                )}
              </h1>
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* View Switcher */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="group bg-white/90 backdrop-blur-sm border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-300 rounded-xl px-3 py-2 shadow-md hover:shadow-lg"
                    >
                      {React.createElement(VIEW_STYLES[currentView].icon, {
                        className:
                          "w-4 h-4 text-orange-500 group-hover:text-orange-600",
                      })}
                      <ChevronDown className="w-3 h-3 ml-2 text-orange-400 group-hover:text-orange-500 transition-transform duration-300 group-hover:rotate-180" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-48 rounded-xl border-2 border-orange-200 shadow-xl bg-white/95 backdrop-blur-sm"
                    align="end"
                    sideOffset={8}
                  >
                    {Object.entries(VIEW_STYLES).map(([key, style]) => (
                      <DropdownMenuItem
                        key={key}
                        onClick={() => setCurrentView(key)}
                        className="flex items-center justify-between py-3 px-4 cursor-pointer hover:bg-orange-50 rounded-lg mx-2 my-1 transition-colors duration-200"
                      >
                        <div className="flex items-center gap-3">
                          {React.createElement(style.icon, {
                            className: "w-4 h-4 text-orange-500",
                          })}
                          <span className="text-sm font-medium text-gray-800">
                            {style.name}
                          </span>
                        </div>
                        {currentView === key && (
                          <Check className="h-4 w-4 text-orange-500" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <LanguageSwitcher />
              </div>

              {/* <div className="flex items-center gap-3 flex-shrink-0">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="bg-white/90 backdrop-blur-sm border-2 border-orange-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-300 rounded-xl px-3 py-2 shadow-md hover:shadow-lg"
                >
                  <Link to="/">{t("selectBranch")}</Link>
                </Button>
              </div> */}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 pb-8">
          {/* Enhanced Parent Categories Section */}
          {isLoadingCategories ? (
            <div className="py-6 lg:py-8">
              <Skeleton className="h-14 w-full rounded-2xl bg-gradient-to-r from-orange-400 via-orange-100 to-orange-200" />
            </div>
          ) : (
            <>
              {/* Enhanced Mobile Dropdown for Parent Categories */}
              <div className="lg:hidden sticky top-[89px] bg-white/95 backdrop-blur-sm pt-6 pb-4 z-40 -mx-4 px-4">
                <DropdownMenu
                  open={dropdownOpen}
                  onOpenChange={setDropdownOpen}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between h-14 px-6 bg-gradient-to-r from-orange-50 to-white border-2 border-orange-200 hover:border-orange-300 hover:from-orange-100 hover:to-orange-50 transition-all duration-300 rounded-2xl shadow-lg hover:shadow-xl"
                    >
                      <span className="font-bold text-gray-900 truncate text-lg">
                        {activeCategoryName}
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-5 w-5 transition-transform duration-300 flex-shrink-0 ml-3 text-orange-500",
                          dropdownOpen && "rotate-180"
                        )}
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[calc(100vw-32px)] max-h-80 overflow-y-auto rounded-2xl border-2 border-orange-200 shadow-2xl bg-white/95 backdrop-blur-sm"
                    align="center"
                    sideOffset={12}
                  >
                    {showAllCategory && (
                      <DropdownMenuItem
                        onClick={() => {
                          setActiveParentCategory(null);
                          setActiveSubCategory(null);
                          setDropdownOpen(false);
                        }}
                        className="flex items-center justify-between py-4 px-6 cursor-pointer hover:bg-orange-50 rounded-xl mx-2 my-1 transition-colors duration-200"
                      >
                        <span className="text-base font-semibold text-gray-900">
                          {t("all") || "All"}
                        </span>
                        {activeParentCategory === null &&
                          activeSubCategory === null && (
                            <Check className="h-5 w-5 text-orange-500" />
                          )}
                      </DropdownMenuItem>
                    )}
                    {sortedParentCategories.map((category) => (
                      <DropdownMenuItem
                        key={category?.id || Math.random()}
                        onClick={() => handleParentCategorySelect(category?.id)}
                        className="flex items-center justify-between py-4 px-6 cursor-pointer hover:bg-orange-50 rounded-xl mx-2 my-1 transition-colors duration-200"
                      >
                        <span className="text-base font-semibold text-gray-900 truncate pr-3">
                          {category?.name || "Unknown Category"}
                        </span>
                        {activeParentCategory === category?.id && (
                          <Check className="h-5 w-5 text-orange-500 flex-shrink-0" />
                        )}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="hidden lg:block sticky top-[105px] bg-white/95 backdrop-blur-sm pt-6 pb-4 z-40 -mx-8 px-8 border-b border-gray-100/50">
                <div className="relative">
                  {/* Left Arrow - Enhanced */}
                  {showLeftArrow && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 
        bg-white/90 backdrop-blur-md shadow-lg rounded-full w-11 h-11 p-0 
        hover:bg-white hover:scale-110 hover:shadow-xl
        border border-orange-200/60 hover:border-orange-300
        text-orange-500 hover:text-orange-600
        transition-all duration-300 ease-out
        hover:rotate-[-2deg] active:scale-95"
                      onClick={() => scrollCategories("left")}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  )}

                  {/* Right Arrow - Enhanced */}
                  {showRightArrow && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 
        bg-white/90 backdrop-blur-md shadow-lg rounded-full w-11 h-11 p-0 
        hover:bg-white hover:scale-110 hover:shadow-xl
        border border-orange-200/60 hover:border-orange-300
        text-orange-500 hover:text-orange-600
        transition-all duration-300 ease-out
        hover:rotate-[2deg] active:scale-95"
                      onClick={() => scrollCategories("right")}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}

                  <Tabs
                    value={activeParentCategory || "all"}
                    className="w-full"
                  >
                    <div
                      ref={tabsContainerRef}
                      className="overflow-x-auto px-14 flex justify-center
        scrollbar-hide smooth-scroll"
                      style={{
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                      }}
                      onScroll={checkScrollPosition}
                    >
                      {/* Enhanced TabsList */}
                      <TabsList
                        className="
        bg-gradient-to-r from-orange-50/80 via-white/90 to-orange-50/80 
        backdrop-blur-sm p-1.5 w-max rounded-3xl
        shadow-sm border border-orange-100/50
        relative overflow-hidden
        before:absolute before:inset-0 
        before:bg-gradient-to-r before:from-orange-100/20 before:via-transparent before:to-orange-100/20
        before:animate-pulse before:duration-3000"
                      >
                        {/* All Categories Tab - Enhanced */}
                        {showAllCategory && (
                          <TabsTrigger
                            value="all"
                            onClick={() => {
                              setActiveParentCategory(null);
                              setActiveSubCategory(null);
                            }}
                            className="group relative px-6 py-3 rounded-2xl font-semibold text-sm
              transition-all duration-300 ease-out
              text-center whitespace-nowrap border border-transparent
              bg-white/70 backdrop-blur-sm text-gray-600 tracking-wide
              hover:bg-white/95 hover:border-orange-200/60 hover:-translate-y-0.5 
              hover:shadow-md hover:shadow-orange-100/60 hover:text-gray-800
              hover:scale-[1.02]
              
              data-[state=active]:bg-gradient-to-br 
              data-[state=active]:from-orange-500 
              data-[state=active]:via-orange-600
              data-[state=active]:to-amber-600
              data-[state=active]:text-white 
              data-[state=active]:border-orange-400/30
              data-[state=active]:shadow-lg 
              data-[state=active]:shadow-orange-500/30
              data-[state=active]:-translate-y-1
              data-[state=active]:scale-105
              data-[state=active]:font-bold
              
              data-[state=active]:hover:from-orange-600 
              data-[state=active]:hover:via-orange-700
              data-[state=active]:hover:to-amber-700
              data-[state=active]:hover:-translate-y-1.5
              data-[state=active]:hover:scale-[1.08]
              data-[state=active]:hover:shadow-xl
              data-[state=active]:hover:shadow-orange-500/40
              
              overflow-hidden
              before:absolute before:inset-0 before:bg-gradient-to-r 
              before:from-transparent before:via-white/30 before:to-transparent
              before:-translate-x-full before:transition-transform before:duration-500
              hover:before:translate-x-full
              
              after:absolute after:inset-0 after:rounded-2xl
              after:bg-gradient-to-t after:from-black/5 after:to-transparent
              after:opacity-0 after:transition-opacity after:duration-300
              data-[state=active]:after:opacity-100"
                          >
                            <span className="relative z-10">
                              {t("all") || "All"}
                            </span>
                          </TabsTrigger>
                        )}

                        {/* Category Tabs - Enhanced */}
                        {sortedParentCategories.map((category) => (
                          <TabsTrigger
                            key={category?.id || Math.random()}
                            value={category?.id || ""}
                            onClick={() =>
                              handleParentCategorySelect(category?.id)
                            }
                            className="group relative px-6 py-3 rounded-2xl font-semibold text-sm
              transition-all duration-300 ease-out
              text-center whitespace-nowrap border border-transparent
              bg-white/70 backdrop-blur-sm text-gray-600 tracking-wide
              hover:bg-white/95 hover:border-orange-200/60 hover:-translate-y-0.5 
              hover:shadow-md hover:shadow-orange-100/60 hover:text-gray-800
              hover:scale-[1.02]
              
              data-[state=active]:bg-gradient-to-br 
              data-[state=active]:from-orange-500 
              data-[state=active]:via-orange-600
              data-[state=active]:to-amber-600
              data-[state=active]:text-white 
              data-[state=active]:border-orange-400/30
              data-[state=active]:shadow-lg 
              data-[state=active]:shadow-orange-500/30
              data-[state=active]:-translate-y-1
              data-[state=active]:scale-105
              data-[state=active]:font-bold
              
              data-[state=active]:hover:from-orange-600 
              data-[state=active]:hover:via-orange-700
              data-[state=active]:hover:to-amber-700
              data-[state=active]:hover:-translate-y-1.5
              data-[state=active]:hover:scale-[1.08]
              data-[state=active]:hover:shadow-xl
              data-[state=active]:hover:shadow-orange-500/40
              
              overflow-hidden
              before:absolute before:inset-0 before:bg-gradient-to-r 
              before:from-transparent before:via-white/30 before:to-transparent
              before:-translate-x-full before:transition-transform before:duration-500
              hover:before:translate-x-full
              
              after:absolute after:inset-0 after:rounded-2xl
              after:bg-gradient-to-t after:from-black/5 after:to-transparent
              after:opacity-0 after:transition-opacity after:duration-300
              data-[state=active]:after:opacity-100"
                          >
                            <span className="relative z-10">
                              {category?.name || "Unknown Category"}
                            </span>
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </div>
                  </Tabs>

                  {/* Optional: Add subtle glow effect */}
                  <div className="absolute inset-0 -z-10 bg-gradient-to-r from-transparent via-orange-50/30 to-transparent blur-xl opacity-60"></div>
                </div>
              </div>

              {/* ✨ NEW: Subcategories Section (nested_level = 2) */}
              {activeParentCategory && sortedSubCategories.length > 0 && (
                <>
                  {/* Mobile Subcategories Dropdown */}
                  <div className="lg:hidden sticky top-[167px] bg-white/90 backdrop-blur-sm pt-2 pb-4 z-35 -mx-4 px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between h-12 px-5 bg-gradient-to-r from-blue-50 to-white border-2 border-blue-200 hover:border-blue-300 hover:from-blue-100 hover:to-blue-50 transition-all duration-300 rounded-xl shadow-md hover:shadow-lg"
                        >
                          <span className="font-semibold text-gray-800 truncate">
                            {activeSubCategory
                              ? sortedSubCategories.find(
                                  (cat) => cat.id === activeSubCategory
                                )?.name || "Select Subcategory"
                              : sortedSubCategories.length > 0
                              ? "Loading subcategories..." // Show loading state while subcategories load
                              : "All " +
                                (sortedParentCategories.find(
                                  (cat) => cat.id === activeParentCategory
                                )?.name || "Items")}
                          </span>
                          <ChevronDown className="h-4 w-4 transition-transform duration-300 flex-shrink-0 ml-3 text-blue-500" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        className="w-[calc(100vw-32px)] max-h-60 overflow-y-auto rounded-xl border-2 border-blue-200 shadow-xl bg-white/95 backdrop-blur-sm"
                        align="center"
                        sideOffset={8}
                      >
                        <DropdownMenuItem
                          onClick={() => setActiveSubCategory(null)}
                          className="flex items-center justify-between py-3 px-5 cursor-pointer hover:bg-blue-50 rounded-lg mx-2 my-1 transition-colors duration-200"
                        >
                          <span className="text-sm font-medium text-gray-800">
                            All{" "}
                            {sortedParentCategories.find(
                              (cat) => cat.id === activeParentCategory
                            )?.name || "Items"}
                          </span>
                          {activeSubCategory === null && (
                            <Check className="h-4 w-4 text-blue-500" />
                          )}
                        </DropdownMenuItem>
                        {sortedSubCategories.map((subCategory) => (
                          <DropdownMenuItem
                            key={subCategory?.id || Math.random()}
                            onClick={() =>
                              handleSubCategorySelect(subCategory?.id)
                            }
                            className="flex items-center justify-between py-3 px-5 cursor-pointer hover:bg-blue-50 rounded-lg mx-2 my-1 transition-colors duration-200"
                          >
                            <span className="text-sm font-medium text-gray-800 truncate pr-3">
                              {subCategory?.name || "Unknown Subcategory"}
                            </span>
                            {activeSubCategory === subCategory?.id && (
                              <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Desktop Subcategories Tabs */}
                  <div className="hidden lg:block sticky top-[169px] bg-white/90 backdrop-blur-sm pt-2 pb-6 z-35 -mx-8 px-8">
                    <div className="relative">
                      {showSubLeftArrow && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 backdrop-blur-sm shadow-lg rounded-full w-10 h-10 p-0 hover:bg-white border-2 border-blue-200 hover:border-blue-300 text-blue-500 hover:text-blue-600"
                          onClick={() => scrollSubCategories("left")}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                      )}
                      {showSubRightArrow && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/95 backdrop-blur-sm shadow-lg rounded-full w-10 h-10 p-0 hover:bg-white border-2 border-blue-200 hover:border-blue-300 text-blue-500 hover:text-blue-600"
                          onClick={() => scrollSubCategories("right")}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      )}

                      {/* <Tabs
                        value={activeSubCategory || "all-sub"}
                        className="w-full"
                      > */}

                      <Tabs
                        value={
                          activeSubCategory ||
                          (sortedSubCategories.length > 0
                            ? sortedSubCategories[0]?.id
                            : "all-sub")
                        }
                        className="w-full"
                      >
                        <div
                          ref={subTabsContainerRef}
                          className="overflow-x-auto px-12 flex justify-center"
                          style={{
                            scrollbarWidth: "none",
                            msOverflowStyle: "none",
                          }}
                          onScroll={checkSubScrollPosition}
                        >
                          <TabsList className="bg-gradient-to-r from-orange-100 via-orange-50 to-orange-100 p-1.5 w-max">
                            {sortedSubCategories.map((subCategory) => (
                              <TabsTrigger
                                key={subCategory?.id || Math.random()}
                                value={subCategory?.id || ""}
                                onClick={() =>
                                  handleSubCategorySelect(subCategory?.id)
                                }
                                className="group relative px-6 py-3 rounded-xl font-semibold text-sm
                                transition-all duration-400 ease-out
                                text-center whitespace-nowrap border border-transparent
                                bg-white/70 backdrop-blur-sm text-gray-600
                                hover:bg-white/90 hover:border-orange-200 hover:-translate-y-0.5 
                                hover:shadow-md hover:shadow-orange-100 hover:text-gray-800
                                data-[state=active]:bg-gradient-to-br 
                                data-[state=active]:from-orange-500 
                                data-[state=active]:to-orange-600
                                data-[state=active]:text-white 
                                data-[state=active]:border-white/20
                                data-[state=active]:shadow-lg 
                                data-[state=active]:shadow-orange-500/30
                                data-[state=active]:-translate-y-1
                                data-[state=active]:hover:from-orange-600 
                                data-[state=active]:hover:to-orange-700
                                data-[state=active]:hover:-translate-y-1.5
                                data-[state=active]:hover:shadow-xl
                                data-[state=active]:hover:shadow-orange-500/40"
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

          {/* Enhanced Menu Items */}
          <div
            className={cn(
              "pt-6",
              activeParentCategory && sortedSubCategories.length > 0
                ? "lg:pt-4"
                : ""
            )}
          >
            {isLoadingItems || isLoadingSubCategories ? (
              <div className={VIEW_STYLES[currentView].containerClass}>
                {[...Array(currentView === "grid" ? 8 : 6)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      VIEW_STYLES[currentView].itemClass,
                      "animate-pulse"
                    )}
                  >
                    <Skeleton
                      className={cn(
                        "bg-gradient-to-br from-orange-200 via-orange-100 to-orange-200",
                        currentView === "grid"
                          ? "aspect-square mb-4"
                          : "h-20 sm:h-24 md:h-32"
                      )}
                    />
                    <div className="p-5 space-y-3">
                      <Skeleton className="h-5 w-3/4 bg-gradient-to-r from-orange-200 to-orange-100" />
                      <Skeleton className="h-4 w-full bg-gradient-to-r from-orange-100 to-orange-200" />
                      <Skeleton className="h-5 w-20 bg-gradient-to-r from-orange-200 to-orange-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={VIEW_STYLES[currentView].containerClass}>
                {Array.isArray(sortedFilteredItems) &&
                sortedFilteredItems.length > 0 ? (
                  sortedFilteredItems.map((item, index) => {
                    if (!item) return null;
                    return (
                      <div
                        key={item.id || index}
                        className={cn(
                          VIEW_STYLES[currentView].itemClass,
                          "animate-in fade-in duration-700 slide-in-from-bottom-4"
                        )}
                        style={{
                          animationDelay: `${index * 100}ms`,
                          animationFillMode: "both",
                        }}
                      >
                        {renderMenuItem(item, index)}
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-20 lg:py-28 px-4">
                    <div className="w-28 h-28 mx-auto mb-8 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-300 to-orange-400 rounded-full" />
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-4">
                      {t("noItemsInCategory") || "No items found"}
                    </h3>
                    <p className="text-lg text-gray-600 max-w-md mx-auto leading-relaxed">
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
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Menu component error:", error);
    setHasError(true);
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-orange-200 p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full"></div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Component Error
          </h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            Something went wrong while rendering the menu. Please check the
            console for details.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border-0"
          >
            Refresh Page
          </Button>
        </div>
      </div>
    );
  }
};

export default Menu;
