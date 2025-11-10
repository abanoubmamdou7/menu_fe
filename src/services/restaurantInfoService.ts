import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

// Restaurant Info Interface
export interface RestaurantInfo {
  style: string;
  branch_code: string;
  id: string;
  name: string;
  slogan: string | null;
  created_at: string;
  updated_at: string;
  logo_url: string | null;
  logo_blob: string | null;
  theme_id: string | null;
  show_all_category: boolean;
}

// Helper to extract error
const getErrorMessage = (error): string => {
  if (typeof error === "string") return error;
  if (error?.message) return typeof error.message === "string" ? error.message : JSON.stringify(error.message);
  if (error?.error) return typeof error.error === "string" ? error.error : JSON.stringify(error.error);
  if (error?.details) return typeof error.details === "string" ? error.details : JSON.stringify(error.details);
  try {
    return JSON.stringify(error, null, 2);
  } catch {
    return "Unknown error occurred";
  }
};

// Fetch Info
export const fetchRestaurantInfo = async (): Promise<RestaurantInfo | null> => {
  try {
    const { data, error } = await supabase
      .from("restaurant_info")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching restaurant info:", error);
      return null;
    }
    return data || null;
  } catch (error) {
    console.error("Unexpected error:", error);
    return null;
  }
};

// Insert/Update Restaurant Info
export const updateRestaurantInfo = async (
  name: string,
  slogan: string | null,
  logoUrl: string | null,
  removeLogo: boolean,
  themeId: string | null,
  show_all_category: boolean,
  branch_code: string | null,
  style: string | null
): Promise<RestaurantInfo> => {
  try {
    const { data: currentInfo, error: currentInfoError } = await supabase
      .from("restaurant_info")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (currentInfoError && currentInfoError.code !== 'PGRST116') {
      throw currentInfoError;
    }

    if (!currentInfo?.id) {
      const { data, error } = await supabase
        .from("restaurant_info")
        .insert({
          name,
          slogan,
          logo_url: logoUrl,
          theme_id: themeId,
          show_all_category,
          branch_code,
          style: style || '',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    const updateData: any = {
      name,
      slogan,
      show_all_category,
      branch_code,
      style: style || '',
    };

    if (removeLogo) {
      updateData.logo_url = null;
    } else if (logoUrl !== null) {
      updateData.logo_url = logoUrl;
    }

    if (themeId !== undefined) {
      updateData.theme_id = themeId;
    }

    const { data, error } = await supabase
      .from("restaurant_info")
      .update(updateData)
      .eq("id", currentInfo.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    throw new Error(`Database update failed: ${getErrorMessage(error)}`);
  }
};

// React Query: Fetch Hook
export const useRestaurantInfo = () =>
  useQuery({
    queryKey: ["restaurantInfo"],
    queryFn: fetchRestaurantInfo,
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

// React Query: Mutation Hook
export const useSaveRestaurantInfo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      slogan,
      logoUrl,
      removeLogo,
      themeId,
      show_all_category,
      branch_code,
      style
    }: {
      name: string;
      slogan: string | null;
      logoUrl: string | null;
      removeLogo: boolean;
      themeId: string | null;
      show_all_category: boolean;
      branch_code: string | null;
      style: string | null;
    }) => {
      return await updateRestaurantInfo(
        name, 
        slogan, 
        logoUrl, 
        removeLogo, 
        themeId, 
        show_all_category,
        branch_code,
        style
      );
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurantInfo"] });
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
      console.error("Mutation error:", errorMessage);
    },
  });
};

// API Trigger Function
export const handleSaveRestaurantInfo = async (
  name: string,
  slogan: string | null,
  file: File | null,
  removeLogo: boolean = false,
  themeId: string | null = null,
  dbName: string | null = null,
  showAllCategory: boolean = true,
  branch_code: string | null,
  style: string | null
) => {
  const { mutate } = useSaveRestaurantInfo();

  try {
    let logoUrl: string | null = null;

    if (file && !removeLogo) {
      const formData = new FormData();
      formData.append("image", file);

      const uploadResponse = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/image/uploadImage`,
        formData,
        { withCredentials: true }
      );

      logoUrl = uploadResponse.data.fileUrls[0];
      if (!logoUrl) throw new Error("No file URL returned from upload");
    }

    mutate(
      {
        name,
        slogan,
        logoUrl: removeLogo ? null : logoUrl,
        removeLogo,
        themeId,
        show_all_category: showAllCategory,
        branch_code,
        style
      },
      {
        onSuccess: () => {
          console.log("Restaurant info saved successfully");
        },
        onError: (error) => {
          console.error("Failed to save restaurant info:", error);
          throw error;
        },
      }
    );
  } catch (error) {
    console.error("Error in handleSaveRestaurantInfo:", error);
    throw error;
  }
};