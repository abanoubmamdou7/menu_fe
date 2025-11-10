// export default RegisterHeader;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

const RegisterHeader = () => {
  const [restaurantName, setRestaurantName] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: restaurantInfoData, error } = await supabase
          .from('restaurant_info')
          .select('name')
          .limit(1)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (restaurantInfoData) {
          setRestaurantName(restaurantInfoData.name);
        } else {
          console.warn('No data returned from restaurant_info query');
        }
      } catch (error) {
        console.error('Failed to fetch restaurant info:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="mb-6 flex justify-center">
      <Button variant="ghost" asChild className="flex items-center gap-2">
        <Link to="/">
          <ArrowLeft className="h-4 w-4" />
          <span>{restaurantName || 'Restaurant'}</span>
        </Link>
      </Button>
    </div>
  );
};

export default RegisterHeader;