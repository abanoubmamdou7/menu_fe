import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SocialLink } from '@/services/socialLinkServices';

export const useIndexSocialLinks = () => {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSocialLinks = async () => {
      try {
        const { data, error } = await supabase
          .from('social_links')
          .select('*')
          .order('links_order', { ascending: true });

        if (error) throw error;

        if (data) {
          setSocialLinks(data.map(link => ({
            ...link,
            linksOrder: link.links_order,
          })) as SocialLink[]);
        } else {
          console.warn('No data returned from social_links query');
          setSocialLinks([]);
        }
      } catch (error) {
        console.error('Failed to fetch social links:', error);
        setSocialLinks([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSocialLinks();
  }, []);

  return { socialLinks, loading };
};