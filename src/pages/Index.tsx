import React, { useMemo, useState } from 'react';
import Logo from '@/components/Logo';
import LinkTreeContainer from '@/components/LinkTreeContainer';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from '@/hooks/useTranslation';
import { useIndexSocialLinks } from '@/hooks/useIndexSocialLinks';
import MainNavigationLinks from '@/components/MainNavigationLinks';
import SocialLinks from '@/components/SocialLinks';
import { useQuery } from '@tanstack/react-query';
import { fetchRestaurantInfo } from '@/services/restaurantInfoService';
import { Skeleton } from '@/components/ui/skeleton';
import { SocialLink } from '@/services/socialLinkServices';

const Index = () => {
  const defaultLogoPath = '/mashwiz.jpg'; // Default logo in public folder
  const { t } = useTranslation();

  const { socialLinks, loading: loadingSocialLinks } = useIndexSocialLinks();

  const {
    data: restaurantInfo,
    isLoading: loadingRestaurantInfo,
  } = useQuery({
    queryKey: ['restaurantInfo'],
    queryFn: fetchRestaurantInfo,
  });

  const loading = loadingSocialLinks || loadingRestaurantInfo;
  const logoPath = restaurantInfo?.logo_url || defaultLogoPath;

  // Sorting configuration
  const [sortConfig, setSortConfig] = useState<{
    direction: 'ascending' | 'descending';
  }>({
    direction: 'ascending', // Default to ascending as requested
  });

  // Sort social links by linksOrder
  const sortedSocialLinks = useMemo(() => {
    console.log('Sorting socialLinks with direction:', sortConfig.direction); // Debug log
    console.log({});
    
    return [...socialLinks].sort((a: SocialLink, b: SocialLink) => {
      const aOrder = a.linksOrder ?? 0; // Fallback to 0 if undefined
      const bOrder = b.linksOrder ?? 0;
      if (aOrder < bOrder) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aOrder > bOrder) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [socialLinks, sortConfig]);

  return (
    <LinkTreeContainer title={restaurantInfo?.name || t('mashwizRestaurant')}>
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <Logo logoPath={logoPath} alt={restaurantInfo?.name || t('mashwizRestaurant')} />

      {loadingRestaurantInfo ? (
        <Skeleton className="h-6 w-3/4 mx-auto mb-6" />
      ) : (
        <h2 className="text-center text-gray-600 mb-6">
          {restaurantInfo?.slogan}
        </h2>
      )}

      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <div className="space-y-3">
          <MainNavigationLinks />
          <SocialLinks socialLinks={sortedSocialLinks} />
        </div>
      )}

      <div className="mt-10 text-center"></div>
    </LinkTreeContainer>
  );
};

export default Index;