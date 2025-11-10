import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LogoProps {
  logoPath?: string; // Optional logoPath from parent
  alt: string;
  size?: number;
  className?: string;
  onLogoAvailable?: (available: boolean) => void; // Optional callback
}

const Logo: React.FC<LogoProps> = ({
  logoPath,
  alt,
  size = 120,
  className = "",
  onLogoAvailable,
}) => {
  const [logo, setLogo] = useState<string | null>(logoPath || null);
  const [loading, setLoading] = useState<boolean>(!logoPath); // Skip loading if logoPath is provided
  const defaultLogoPath = "/smartlogo.png"; // Path to default logo

  useEffect(() => {
    // Skip fetching if logoPath is provided
    if (logoPath) {
      setLogo(logoPath);
      onLogoAvailable?.(true);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const { data: restaurantInfoData, error } = await supabase
          .from('restaurant_info')
          .select('logo_url')
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (restaurantInfoData && restaurantInfoData.logo_url) {
          const relativePath = restaurantInfoData.logo_url;
          const fileName = relativePath.split('/').pop() || '';
          setLogo(fileName);
          onLogoAvailable?.(true);
        } else {
          setLogo(defaultLogoPath); // Use default logo if no logo_url
          onLogoAvailable?.(false);
        }
      } catch (error) {
        console.error('Failed to fetch restaurant logo:', error);
        setLogo(defaultLogoPath); // Use default logo on error
        onLogoAvailable?.(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [logoPath, onLogoAvailable]);

  if (loading) {
    return <div className={`flex justify-center mb-6 ${className}`}>Loading...</div>;
  }

  return (
    <div className={`flex justify-center mb-6 ${className}`}>
      {/* <div className="rounded-full overflow-hidden border-4 border-restaurant-primary p-1 bg-white"> */}
      <div className="rounded-full overflow-hidden p-1 bg-white">

        <img
          src={
            logo
              ? `${import.meta.env.VITE_API_BASE_URL}/api/image/getImage?fileName=${encodeURIComponent(logo)}`
              : defaultLogoPath
          }
          alt={alt}
          width={size}
          height={size}
          className="rounded-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null; // Prevent infinite error loop
            target.src = defaultLogoPath; // Fallback to default logo
            setLogo(defaultLogoPath);
            onLogoAvailable?.(false);
          }}
        />
      </div>
    </div>
  );
};

export default Logo;