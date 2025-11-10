import React from "react";
import { Card } from "@/components/ui/card";
import { MenuItem } from "@/services/menuServices";
import { useLanguage } from "@/hooks/useLanguage";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";
import { useRestaurantLogo } from "../hooks/useRestaurantLogo.ts";

function uint8ToBase64(uint8Array: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < uint8Array.length; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}


interface MenuItemCardProps {
  item: MenuItem;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ item }) => {
  const { language } = useLanguage();
  const defaultImage = useRestaurantLogo();
  const getImageSrc = (item: MenuItem): string => {
    if (!item) return defaultImage;
  
    // 1️⃣ If photo_url (LONGBLOB) is valid, show base64 image
    if (
      item.photo_url &&
      typeof item.photo_url === "object" &&
      "data" in item.photo_url &&
      Array.isArray(item.photo_url.data) &&
      item.photo_url.data.length > 0
    ) {
      const byteArray = new Uint8Array(item.photo_url.data);
      const base64 = uint8ToBase64(byteArray);
      return `data:image/jpeg;base64,${base64}`;
    }
  
    // 2️⃣ If image is a filename string, use server API
    if (typeof item.image === "string" && item.image.trim()) {
      const encoded = encodeURIComponent(item.image.trim());
      return `${import.meta.env.VITE_API_BASE_URL}/api/image/getImage?fileName=${encoded}`;
    }
  
    // 3️⃣ Fallback
    return defaultImage;
  };
  

  return (
    <Card
      className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-lg group",
        language === "ar" ? "text-right" : "text-left"
      )}
    >
      <div
        className={cn(
          "flex h-full",
          language === "ar" ? "flex-row-reverse" : "flex-row"
        )}
      >
        <div className="relative w-1/3 min-w-[120px] overflow-hidden">
          <AspectRatio ratio={1} className="h-full">
            <img
              src={getImageSrc(item)}
              alt={item.name || "Menu item"}
              onError={(e) => {
                e.currentTarget.src = defaultImage;
              }}
              className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
          </AspectRatio>
        </div>

        <div className="flex flex-col justify-between w-2/3 p-4">
          <div>
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
          </div>
          <div className="mt-auto">
            <span className="font-bold text-restaurant-primary text-lg">
              {`EGP ${item.price.replace("$", "")}`}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MenuItemCard;
