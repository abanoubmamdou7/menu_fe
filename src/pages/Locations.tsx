import React, { useEffect, useState, useMemo, ReactNode } from "react";
import { Link } from "react-router-dom";
import { MapPin, ArrowLeft, Clock } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import LinkTreeContainer from "@/components/LinkTreeContainer";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Location,
  DaySchedule,
  parseWorkingHours,
} from "@/services/locationServices";

const Locations = () => {
  const { t } = useTranslation();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [restaurantName, setRestaurantName] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    direction: 'ascending' | 'descending';
  }>({
    direction: 'ascending',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [locationsResult, restaurantInfoResult] = await Promise.all([
          supabase.from("locations").select("*"),
          supabase.from("restaurant_info").select("name").limit(1).single(),
        ]);

        // Handle locations
        if (locationsResult.data) {
          const typedLocations = locationsResult.data.map((location) => ({
            ...location,
            locationOrder: location.location_order,
            location_order: location.location_order,
            working_hours: parseWorkingHours(location.working_hours),
          }));
          setLocations(typedLocations);
        } else {
          console.warn("No data returned from locations query");
          setLocations([]);
        }

        // Handle restaurant name
        if (restaurantInfoResult.data) {
          setRestaurantName(restaurantInfoResult.data.name);
        } else {
          console.warn("No data returned from restaurant_info query");
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setLocations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatWorkingHours = (daySchedule: DaySchedule) => {
    if (daySchedule.closed) return t("closed");
    return `${daySchedule.open} - ${daySchedule.close}`;
  };

  // Sorting logic limited to location_order
  const sortedLocations = useMemo(() => {
    console.log("Sorting locations with direction:", sortConfig.direction); // Debug log
    return [...locations].sort((a, b) => {
      const aValue = a.location_order ?? 0;
      const bValue = b.location_order ?? 0;

      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [locations, sortConfig]);

  return (
    <LinkTreeContainer title={t("locationsTitle")}>
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="mb-6 flex justify-center">
        <Button variant="ghost" asChild className="flex items-center gap-2">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" />
            <span>{restaurantName || t("Restaurant")}</span>
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-4">Loading locations...</div>
      ) : (
        <div className="space-y-6">
          {sortedLocations.map((location) => (
            <div
              key={location.id}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <h3 className="text-xl font-bold text-restaurant-dark">
                {location.name}
              </h3>
              <p className="text-gray-600 mt-2">
                {location.address}, {location.city}
              </p>
              <div className="mt-4 flex flex-col space-y-2">
                {location.is_open_24_7 ? (
                  <div className="flex items-center text-green-600 font-medium">
                    <Clock className="h-4 w-4 mr-2" />
                    {t("open24_7")}
                  </div>
                ) : location.working_hours &&
                  location.working_hours.length > 0 ? (
                  <div className="space-y-1">
                    <div className="flex items-center text-gray-700">
                      <Clock className="h-4 w-4 mr-2" />
                      <span className="font-medium">{t("workingHours")}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-sm text-gray-600 ml-6">
                      {location.working_hours.map((day) => (
                        <div key={day.day} className="flex justify-between">
                          <span>{day.day}:</span>
                          <span>
                            {day.closed
                              ? t("closed")
                              : `${day.open} - ${day.close}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <a
                  href={location.map_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-restaurant-primary hover:text-restaurant-primary/80"
                >
                  <MapPin className="h-4 w-4" />
                  <span>{t("viewOnMap")}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </LinkTreeContainer>
  );
};

export default Locations;