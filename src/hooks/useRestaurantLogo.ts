import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useRestaurantLogo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const { data, error } = await supabase
          .from("restaurant_info")
          .select("logo_url")
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data && data.logo_url) {
          const fileName = data.logo_url.split("/").pop();
          if (fileName) {
            setLogoUrl(`${import.meta.env.VITE_API_BASE_URL}/api/image/getImage?fileName=${encodeURIComponent(fileName)}`);
          }
        }
      } catch (error) {
        console.error("Failed to fetch default logo:", error);
      }
    };

    fetchLogo();
  }, []);

  return logoUrl;
}
