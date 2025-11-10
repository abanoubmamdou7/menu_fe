import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { z } from 'zod';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pencil, Trash2, Share2, Facebook, Instagram, MessageCircle, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Define the schema for form validation
export const socialLinkSchema = z.object({
  platform: z.string().min(1, { message: 'Platform name is required' }),
  url: z.string().url({ message: 'Must be a valid URL' }),
  iconType: z.enum(['lucide', 'custom']).optional(),
  lucideIcon: z.string().optional(),
  customIconUrl: z.string().url({ message: 'Invalid icon URL' }).optional(),
  color: z.string().optional(),
});

// Define form values type
export type SocialLinkFormValues = z.infer<typeof socialLinkSchema>;

// Define Color type
export type Color = string;

// Define SocialLink interface
export interface SocialLink {
  linksOrder: any;
  links_order: any;
  id: string;
  platform: string;
  url: string;
  iconUrl?: string;
  bgColor?: string | null;
  textColor?: string | null;
  hoverBgColor?: string | null;
  borderColor?: string | null;

}

// Service Functions
export const fetchSocialLinks = async (): Promise<SocialLink[]> => {
  try {
    const { data, error } = await supabase
      .from('social_links')
      .select('*')
      .order('platform');

    if (error) throw error;
    
    return (data || []).map(link => ({
      ...link,
      linksOrder: link.links_order,
    }));
  } catch (error) {
    console.error('Error fetching social links:', error);
    toast.error('Failed to load social links');
    return [];
  }
};

export const createSocialLink = async (link: Omit<SocialLink, 'id' | 'linksOrder' | 'links_order'>): Promise<SocialLink | null> => {
  try {
    const { data, error } = await supabase
      .from('social_links')
      .insert([
        {
          platform: link.platform,
          url: link.url,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    toast.success('Social link created successfully');
    return {
      ...data,
      linksOrder: data.links_order,
    };
  } catch (error: any) {
    console.error('Error creating social link:', error);
    toast.error('Failed to create social link');
    return null;
  }
};

export const updateSocialLink = async (link: SocialLink): Promise<SocialLink | null> => {
  try {
    const { data, error } = await supabase
      .from('social_links')
      .update({
        platform: link.platform,
        url: link.url,
      })
      .eq('id', link.id)
      .select()
      .single();

    if (error) throw error;

    toast.success('Social link updated successfully');
    return {
      ...data,
      linksOrder: data.links_order,
    };
  } catch (error: any) {
    console.error('Error updating social link:', error);
    toast.error('Failed to update social link');
    return null;
  }
};

export const deleteSocialLink = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('social_links')
      .delete()
      .eq('id', id);

    if (error) throw error;

    toast.success('Social link deleted successfully');
    return true;
  } catch (error: any) {
    console.error('Error deleting social link:', error);
    toast.error('Failed to delete social link');
    return false;
  }
};
