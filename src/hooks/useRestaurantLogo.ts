import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_LOGO_PATH = "/smartlogo.png";

const normalizeLogoUrl = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  return null;
};

export function useRestaurantLogo() {
  const [logoUrl, setLogoUrl] = useState<string>(DEFAULT_LOGO_PATH);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const { data, error } = await supabase
          .from("restaurant_info")
          .select("logo_url")
          .limit(1)
          .single();

        if (error && error.code !== "PGRST116") throw error;

        const normalized = normalizeLogoUrl(data?.logo_url);
        if (normalized) {
          setLogoUrl(normalized);
        } else {
          setLogoUrl(DEFAULT_LOGO_PATH);
        }
      } catch (error) {
        console.error("Failed to fetch default logo:", error);
        setLogoUrl(DEFAULT_LOGO_PATH);
      }
    };

    fetchLogo();
  }, []);

  return logoUrl;
}
