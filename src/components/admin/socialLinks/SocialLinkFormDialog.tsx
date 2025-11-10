
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SocialLink } from '@/services/socialLinkServices';
import { SocialLinkFormValues, socialLinkSchema } from '@/hooks/useSocialLinks';

interface SocialLinkFormDialogProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  editingLink: SocialLink | null;
  onSubmit: (values: SocialLinkFormValues) => void;
  isPending: boolean;
}

export const SocialLinkFormDialog: React.FC<SocialLinkFormDialogProps> = ({
  isOpen,
  setIsOpen,
  editingLink,
  onSubmit,
  isPending
}) => {
  const form = useForm<SocialLinkFormValues>({
    resolver: zodResolver(socialLinkSchema),
    defaultValues: {
      platform: '',
      url: '',
    },
  });

  useEffect(() => {
    if (editingLink) {
      form.reset({
        platform: editingLink.platform,
        url: editingLink.url,
      });
    } else {
      form.reset({
        platform: '',
        url: '',
      });
    }
  }, [editingLink, form]);

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingLink ? 'Edit Social Link' : 'Add New Social Link'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="platform"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Platform</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. facebook, instagram, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={false}>
                {editingLink ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
