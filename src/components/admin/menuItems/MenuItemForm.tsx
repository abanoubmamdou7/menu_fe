import React, { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MenuItem,
  MenuCategory,
  handleMenuItemSubmit,
  updateMenuItem,
} from "@/services/menuServices";
import { SheetClose, SheetFooter } from "@/components/ui/sheet";
import { ImagePlus } from "lucide-react";
import axios from "axios";
import { Switch } from "@/components/ui/switch";

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

interface MenuItemFormProps {
  currentItem: MenuItem | null;
  isEditing: boolean;
  categories?: MenuCategory[];
  onSubmit: (data: MenuItemFormData, photoFile: File | null) => Promise<void>;
  onClose: () => void;
}

type MenuCategoryWithBranch = MenuCategory & {
  branchCode?: string | null;
  orderGroup?: number | null;
};

const MenuItemForm = ({
  currentItem,
  isEditing,
  categories = [],
  onSubmit,
  onClose,
}: MenuItemFormProps) => {
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MenuItemFormData>({
    defaultValues: {
      itm_code: "",
      itm_name: "",
      website_name_en: "",
      website_name_ar: "",
      website_description_en: "",
      website_description_ar: "",
      sales_price: "",
      itm_group_code: "",
      photo_url: "",
      image: "",
      show_in_website: true,
      fasting: false,
      vegetarian: false,
      healthyChoice: false,
      signatureDish: false,
      spicy: false,
    },
  });
  const categoryOptions = useMemo(() => {
    if (!Array.isArray(categories)) {
      return [];
    }

    const deduped = new Map<string, MenuCategoryWithBranch>();

    categories.forEach((category) => {
      const categoryWithBranch = category as MenuCategoryWithBranch;
      const key = `${categoryWithBranch.id ?? ""}__${categoryWithBranch.branchCode ?? "default"}`;

      if (!categoryWithBranch.id || deduped.has(key)) {
        return;
      }

      deduped.set(key, categoryWithBranch);
    });

    return Array.from(deduped.values()).sort((a, b) => {
      const orderA = Number.isFinite(a.orderGroup) ? (a.orderGroup as number) : 0;
      const orderB = Number.isFinite(b.orderGroup) ? (b.orderGroup as number) : 0;

      if (orderA !== orderB) {
        return orderA - orderB;
      }

      return (a.name || "").localeCompare(b.name || "");
    });
  }, [categories]);

  const getCategoryLabel = (category: MenuCategoryWithBranch) => {
    if (category.branchCode) {
      return `${category.name} (${category.branchCode})`;
    }
    return category.name;
  };

  useEffect(() => {
    if (currentItem && isEditing) {
      const imageName =
        typeof currentItem.image === "string" &&
        currentItem.image !==
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400"
          ? currentItem.image
          : "";

      form.reset({
        itm_code: currentItem.id,
        itm_name: currentItem.name,
        website_name_en: currentItem.name,
        website_name_ar: currentItem.nameAr || "",
        website_description_en: currentItem.description,
        website_description_ar: currentItem.descriptionAr || "",
        sales_price: currentItem.price.replace("$", ""),
        itm_group_code: currentItem.category,
        photo_url: imageName,
        image: imageName,
        show_in_website: true,
        fasting: currentItem.fasting || false,
        vegetarian: currentItem.vegetarian || false,
        healthyChoice: currentItem.healthyChoice || false,
        signatureDish: currentItem.signatureDish || false,
        spicy: currentItem.spicy || false,
      });

      if (imageName) {
        handlePhotoChange(imageName);
      } else {
        setPhotoPreview(null);
        setPhotoFile(null);
      }
    } else {
      form.reset({
        itm_code: "",
        itm_name: "",
        website_name_en: "",
        website_name_ar: "",
        website_description_en: "",
        website_description_ar: "",
        sales_price: "",
        itm_group_code: "",
        photo_url: "",
        image: "",
        show_in_website: true,
        fasting: false,
        vegetarian: false,
        healthyChoice: false,
        signatureDish: false,
        spicy: false,
      });
      setPhotoPreview(null);
      setPhotoFile(null);
    }
  }, [currentItem, isEditing, form]);

  const handlePhotoChange = (
    eOrFilename: React.ChangeEvent<HTMLInputElement> | string | null
  ) => {
    if (!eOrFilename) return;

    if (typeof eOrFilename === "string") {
      const url = `${import.meta.env.VITE_API_BASE_URL}/images/${eOrFilename}`;
      setPhotoPreview(url);
      setPhotoFile(null);
    } else {
      const file = eOrFilename.target.files?.[0];
      if (file) {
        const previewUrl = URL.createObjectURL(file);
        setPhotoFile(file);
        setPhotoPreview(previewUrl);
      }
    }
  };

  const handleSubmit = async (data: MenuItemFormData) => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (!data.itm_code.trim()) {
        form.setError("itm_code", { message: "Item code is required" });
        setIsSubmitting(false);
        return;
      }

      if (!data.itm_name.trim()) {
        form.setError("itm_name", { message: "Item name is required" });
        setIsSubmitting(false);
        return;
      }

      if (!data.itm_group_code) {
        form.setError("itm_group_code", {
          message: "Please select a category",
        });
        setIsSubmitting(false);
        return;
      }

      if (photoFile) {
        const formData = new FormData();
        formData.append("image", photoFile);

        const uploadResponse = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/image/uploadImage`,
          formData,
          { withCredentials: true }
        );

        const fileUrls = uploadResponse.data?.fileUrls;
        if (!fileUrls || !fileUrls[0]) {
          throw new Error("Image upload failed");
        }

        data.image = fileUrls[0];
      }

      await onSubmit(data, photoFile);

      if (!isEditing) {
        form.reset();
        setPhotoPreview(null);
        setPhotoFile(null);
      }
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchChange = async (
    fieldName: keyof MenuItemFormData,
    value: boolean
  ) => {
    const itemId = form.getValues("itm_code");
    if (itemId) {
      const updatedItem: MenuItem = {
        id: itemId,
        name: form.getValues("itm_name"),
        nameAr: form.getValues("website_name_ar"),
        description: form.getValues("website_description_en"),
        descriptionAr: form.getValues("website_description_ar"),
        price: form.getValues("sales_price"),
        category: form.getValues("itm_group_code"),
        image: form.getValues("image"),
        fasting: fieldName === "fasting" ? value : form.getValues("fasting"),
        vegetarian:
          fieldName === "vegetarian" ? value : form.getValues("vegetarian"),
        healthyChoice:
          fieldName === "healthyChoice"
            ? value
            : form.getValues("healthyChoice"),
        signatureDish:
          fieldName === "signatureDish"
            ? value
            : form.getValues("signatureDish"),
        spicy: fieldName === "spicy" ? value : form.getValues("spicy"),
        order: 0,
      };
      await updateMenuItem(updatedItem);
      form.setValue(fieldName, value);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="space-y-4 py-4"
      >
        <FormField
          control={form.control}
          name="itm_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Code *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter unique item code"
                  {...field}
                  disabled={isEditing || isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="itm_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Name *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Enter item name"
                  {...field}
                  disabled={isSubmitting}
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
              <FormLabel>Display Name (English)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Name to display on website (English)"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="website_name_ar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display Name (Arabic)</FormLabel>
              <FormControl>
                <Input
                  placeholder="Name to display on website (Arabic)"
                  {...field}
                  dir="rtl"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="website_description_en"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (English)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Item description (English)"
                  {...field}
                  className="min-h-[100px]"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="website_description_ar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Arabic)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Item description (Arabic)"
                  {...field}
                  className="min-h-[100px]"
                  dir="rtl"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sales_price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Price</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Price"
                  {...field}
                  step="0.01"
                  min="0"
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="itm_group_code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category *</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        categoryOptions.length === 0
                          ? "No categories available"
                          : "Select a category"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categoryOptions.length === 0 ? (
                    <SelectItem value="__empty" disabled>
                      No categories available
                    </SelectItem>
                  ) : (
                    categoryOptions.map((category) => (
                      <SelectItem key={`${category.id}-${category.branchCode ?? "default"}`} value={category.id}>
                        {getCategoryLabel(category)}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="photo_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Photo</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  {photoPreview && (
                    <div className="w-full overflow-hidden rounded-md border">
                      <AspectRatio ratio={16 / 9}>
                        <img
                          src={photoPreview}
                          alt="Item preview"
                          className="w-full h-full object-cover"
                        />
                      </AspectRatio>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                      id="photo-upload"
                      disabled={isSubmitting}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        document.getElementById("photo-upload")?.click()
                      }
                      disabled={isSubmitting}
                    >
                      <ImagePlus className="h-4 w-4 mr-2" />
                      {photoPreview ? "Change Photo" : "Upload Photo"}
                    </Button>
                    {photoPreview && (
                      <Button
                        type="button"
                        variant="outline"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => {
                          setPhotoPreview(null);
                          setPhotoFile(null);
                          field.onChange("");
                        }}
                        disabled={isSubmitting}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <Input type="hidden" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormLabel>Tags</FormLabel>

        <FormField
          control={form.control}
          name="fasting"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Fasting</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={(value) =>
                    handleSwitchChange("fasting", value)
                  }
                  disabled={isSubmitting}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="vegetarian"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Vegetarian</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={(value) =>
                    handleSwitchChange("vegetarian", value)
                  }
                  disabled={isSubmitting}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="healthyChoice"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Healthy Choice</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={(value) =>
                    handleSwitchChange("healthyChoice", value)
                  }
                  disabled={isSubmitting}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="signatureDish"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Signature Dish</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={(value) =>
                    handleSwitchChange("signatureDish", value)
                  }
                  disabled={isSubmitting}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="spicy"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Spicy</FormLabel>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={(value) =>
                    handleSwitchChange("spicy", value)
                  }
                  disabled={isSubmitting}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <SheetFooter className="pt-4">
          <SheetClose asChild>
            <Button
              variant="outline"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </SheetClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </SheetFooter>
      </form>
    </Form>
  );
};

export default MenuItemForm;
