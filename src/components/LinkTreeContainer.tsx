
import React, { ReactNode, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LinkTreeContainerProps {
  children: ReactNode;
  title?: string;
}

const LinkTreeContainer: React.FC<LinkTreeContainerProps> = ({ children, title }) => {
  const [restaurantName, setRestaurantName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

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
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  console.log({title});
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white py-10 px-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 mb-10">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          {restaurantName}
        </h1>
        {restaurantName.length > 0 && <div className="w-16 h-1 bg-blue-500 mx-auto mb-6 rounded-full"></div>}
        {loading ? <p>Loading...</p> : children}
      </div>
      <div className="text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} {restaurantName || 'Restaurant'}</p>
      </div>
    </div>
  );
};

export default LinkTreeContainer;