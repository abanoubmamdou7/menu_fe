
import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Location, defaultWorkingHours } from '@/services/locationServices';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Clock } from 'lucide-react';

const dayScheduleSchema = z.object({
  day: z.string(),
  open: z.string().optional(),
  close: z.string().optional(),
  closed: z.boolean().optional()
});

const locationSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  address: z.string().min(1, { message: 'Address is required' }),
  city: z.string().min(1, { message: 'City is required' }),
  map_link: z.string().url({ message: 'Must be a valid URL' }),
  is_open_24_7: z.boolean().default(false),
  working_hours: z.array(dayScheduleSchema).default([])
});

export type LocationFormValues = z.infer<typeof locationSchema>;

interface LocationFormDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  editingLocation: Location | null;
  onSubmit: (values: LocationFormValues) => void;
  isPending: boolean;
}

export const LocationFormDialog: React.FC<LocationFormDialogProps> = ({
  isOpen,
  setIsOpen,
  editingLocation,
  onSubmit,
  isPending
}) => {
  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      map_link: '',
      is_open_24_7: false,
      working_hours: defaultWorkingHours,
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "working_hours"
  });

  const is24x7 = form.watch('is_open_24_7');

  useEffect(() => {
    if (editingLocation) {
      form.reset({
        name: editingLocation.name,
        address: editingLocation.address,
        city: editingLocation.city,
        map_link: editingLocation.map_link,
        is_open_24_7: editingLocation.is_open_24_7,
        working_hours: editingLocation.working_hours && editingLocation.working_hours.length > 0 
          ? editingLocation.working_hours 
          : defaultWorkingHours,
      });
    } else {
      form.reset({
        name: '',
        address: '',
        city: '',
        map_link: '',
        is_open_24_7: false,
        working_hours: defaultWorkingHours,
      });
    }
  }, [editingLocation, form]);

  return (
    <DialogContent className="max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {editingLocation ? 'Edit Location' : 'Add New Location'}
        </DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Location name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input placeholder="Full address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="City name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="map_link"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Google Maps Link</FormLabel>
                <FormControl>
                  <Input placeholder="https://maps.google.com/?q=..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="is_open_24_7"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Open 24/7</FormLabel>
                  <FormDescription>
                    This location is open 24 hours a day, 7 days a week
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {!is24x7 && (
            <div className="space-y-4 border p-4 rounded-lg">
              <div className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                <h3 className="text-lg font-medium">Working Hours</h3>
              </div>
              {fields.map((field, index) => (
                <div key={field.id} className="grid grid-cols-[1fr,2fr,2fr] gap-2 items-center">
                  <div className="font-medium">{field.day}</div>
                  <FormField
                    control={form.control}
                    name={`working_hours.${index}.closed`}
                    render={({ field: closedField }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={closedField.value}
                            onCheckedChange={(checked) => {
                              closedField.onChange(checked);
                              if (checked) {
                                form.setValue(`working_hours.${index}.open`, "");
                                form.setValue(`working_hours.${index}.close`, "");
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Closed</FormLabel>
                      </FormItem>
                    )}
                  />
                  {!form.watch(`working_hours.${index}.closed`) && (
                    <div className="flex items-center space-x-2">
                      <FormField
                        control={form.control}
                        name={`working_hours.${index}.open`}
                        render={({ field: openField }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input type="time" {...openField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <span>-</span>
                      <FormField
                        control={form.control}
                        name={`working_hours.${index}.close`}
                        render={({ field: closeField }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input type="time" {...closeField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {editingLocation ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
};
