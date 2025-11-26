import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Tags Interface
export interface TagsInfo {
  id: string;
  fasting: string | null;
  vegetarian: string | null;
  healthy_choice: string | null;
  signature_dish: string | null;
  spicy: string | null;
  created_at: string;
  updated_at: string;
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

// Fetch Tags Info
export const fetchTagsInfo = async (): Promise<TagsInfo | null> => {
  try {
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching tags info:", error);
      return null;
    }
    return data || null;
  } catch (error) {
    console.error("Unexpected error:", error);
    return null;
  }
};

// Insert/Update Tags Info
export const updateTagsInfo = async (
  fasting: string | null,
  vegetarian: string | null,
  healthy_choice: string | null,
  signature_dish: string | null,
  spicy: string | null
): Promise<TagsInfo> => {
  try {
    const { data: currentInfo } = await supabase
      .from("tags")
      .select("id")
      .limit(1)
      .single();

    if (!currentInfo?.id) {
      // Create new record if none exists - generate UUID for id
      const { data, error } = await supabase
        .from("tags")
        .insert({
          id: crypto.randomUUID(),
          fasting,
          vegetarian,
          healthy_choice,
          signature_dish,
          spicy,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Update existing record
    const { data, error } = await supabase
      .from("tags")
      .update({
        fasting,
        vegetarian,
        healthy_choice,
        signature_dish,
        spicy,
      })
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
export const useTagsInfo = () =>
  useQuery({
    queryKey: ["tagsInfo"],
    queryFn: fetchTagsInfo,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });

// React Query: Mutation Hook
export const useSaveTagsInfo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      fasting,
      vegetarian,
      healthy_choice,
      signature_dish,
      spicy
    }: {
      fasting: string | null;
      vegetarian: string | null;
      healthy_choice: string | null;
      signature_dish: string | null;
      spicy: string | null;
    }) => {
      return await updateTagsInfo(
        fasting,
        vegetarian,
        healthy_choice,
        signature_dish,
        spicy
      );
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tagsInfo"] });
    },
    onError: (error) => {
      const errorMessage = getErrorMessage(error);
      console.error("Mutation error:", errorMessage);
    },
  });
};

// API Trigger Function (optional - can be used for programmatic saves)
export const handleSaveTagsInfo = async (
  fasting: string | null = null,
  vegetarian: string | null = null,
  healthy_choice: string | null = null,
  signature_dish: string | null = null,
  spicy: string | null = null
) => {
  try {
    return await updateTagsInfo(
      fasting,
      vegetarian,
      healthy_choice,
      signature_dish,
      spicy
    );
  } catch (error) {
    console.error("Error in handleSaveTagsInfo:", error);
    throw error;
  }
};