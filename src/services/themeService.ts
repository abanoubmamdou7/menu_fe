import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface WebTheme {
  theme_id: string;
  theme_name: string;
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}
export const fetchWebThemes = async (): Promise<WebTheme[]> => {
  try {
    const { data, error } = await supabase
      .from('web_themes')
      .select('*')
      .order('theme_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching web themes:', error);
    throw new Error('Failed to fetch web themes');
  }
};


export const useWebThemes = () => {
  return useQuery({
    queryKey: ['webThemes'],
    queryFn: fetchWebThemes,
  });
};

export const applyTheme = (theme: WebTheme) => {
  const root = document.documentElement;

  root.style.setProperty('--primary', theme.primary_color);
  root.style.setProperty('--secondary', theme.secondary_color);
  root.style.setProperty('--background', theme.background_color);
  root.style.setProperty('--foreground', theme.text_color);

  root.setAttribute('data-theme', theme.theme_id);
  localStorage.setItem('selectedTheme', JSON.stringify(theme));
};
export const getStoredTheme = (): WebTheme | null => {
  const stored = localStorage.getItem('selectedTheme');
  return stored ? JSON.parse(stored) : null;
};
