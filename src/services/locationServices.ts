import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

export interface DaySchedule {
  day: string;
  open?: string;
  close?: string;
  closed?: boolean;
}

export interface Location {
  location_order: number;
  locationOrder: number;
  id: string;
  name: string;
  address: string;
  city: string;
  map_link: string;
  working_hours: DaySchedule[];
  is_open_24_7: boolean;
  branch_code?: string | null;
  branchCode?: string | null;
}

// Helper function to convert Json to DaySchedule[]
export const parseWorkingHours = (json: Json | null): DaySchedule[] => {
  if (!json) return [];
  
  try {
    if (Array.isArray(json)) {
      return json.map(day => {
        // Safe type casting after checking that the object has the expected structure
        const typedDay = day as Record<string, unknown>;
        return {
          day: typedDay.day as string,
          open: typedDay.open as string | undefined,
          close: typedDay.close as string | undefined,
          closed: typedDay.closed as boolean | undefined
        };
      });
    }
    return [];
  } catch (error) {
    console.error("Error parsing working hours:", error);
    return [];
  }
};

export const fetchLocations = async (): Promise<Location[]> => {
  try {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("name");

    if (error) throw error;

    // Transform data to ensure working_hours is properly typed
    return (data || []).map(location => ({
      ...location,
      locationOrder: location.location_order,
      location_order: location.location_order,
      working_hours: parseWorkingHours(location.working_hours),
      branch_code: location.branch_code ?? location.branchCode ?? null,
      branchCode: location.branch_code ?? location.branchCode ?? null,
    }));
  } catch (error) {
    console.error("Error fetching locations:", error);
    toast.error("Failed to load locations");
    return [];
  }
};

export const createLocation = async (location: Omit<Location, "id" | "locationOrder" | "location_order">): Promise<Location | null> => {
  try {
    const { data, error } = await supabase
      .from("locations")
      .insert([{
        name: location.name,
        address: location.address,
        city: location.city,
        map_link: location.map_link,
        is_open_24_7: location.is_open_24_7,
        working_hours: location.working_hours as any,
      }])
      .select()
      .single();

    if (error) throw error;

    toast.success("Location created successfully");

    return {
      ...data,
      locationOrder: data.location_order,
      location_order: data.location_order,
      working_hours: parseWorkingHours(data.working_hours),
    };
  } catch (error: any) {
    console.error("Error creating location:", error);
    toast.error("Failed to create location");
    return null;
  }
};

export const updateLocation = async (location: Location): Promise<Location | null> => {
  try {
    const { data, error } = await supabase
      .from("locations")
      .update({
        name: location.name,
        address: location.address,
        city: location.city,
        map_link: location.map_link,
        is_open_24_7: location.is_open_24_7,
        working_hours: location.working_hours as any,
      })
      .eq("id", location.id)
      .select()
      .single();

    if (error) throw error;

    toast.success("Location updated successfully");

    return {
      ...data,
      locationOrder: data.location_order,
      location_order: data.location_order,
      working_hours: parseWorkingHours(data.working_hours),
    };
  } catch (error: any) {
    console.error("Error updating location:", error);
    toast.error("Failed to update location");
    return null;
  }
};
export const deleteLocation = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from("locations")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting location:", error);
    toast.error("Failed to delete location");
    return false;
  }

  toast.success("Location deleted successfully");
  return true;
};

export const defaultWorkingHours: DaySchedule[] = [
  { day: "Monday", open: "09:00", close: "17:00" },
  { day: "Tuesday", open: "09:00", close: "17:00" },
  { day: "Wednesday", open: "09:00", close: "17:00" },
  { day: "Thursday", open: "09:00", close: "17:00" },
  { day: "Friday", open: "09:00", close: "17:00" },
  { day: "Saturday", closed: true },
  { day: "Sunday", closed: true }
];
