import React, { useState, useMemo } from 'react';
import { Location } from '@/services/locationServices';
import { Button } from '@/components/ui/button';
import { MapPin, Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Input } from '../../ui/input.tsx';
import { toast } from 'sonner';

interface LocationsTableProps {
  locations: Location[];
  onEdit: (location: Location) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

export const LocationsTable: React.FC<LocationsTableProps> = ({
  locations,
  onEdit,
  onDelete,
  isLoading
}) => {
  const [itemOrderInputs, setItemOrderInputs] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | 'address' | 'city' | 'locationOrder';
    direction: 'ascending' | 'descending';
  }>({
    key: 'locationOrder',
    direction: 'ascending'
  });

  const handleItemOrderChange = (id: string, value: string) => {
    setItemOrderInputs(prev => ({ ...prev, [id]: value }));
  };

  const handleItemOrderSave = async (id: string) => {
    const rawInput = itemOrderInputs[id]?.trim();
    const itemOrder = parseInt(rawInput, 10);

    if (!rawInput || isNaN(itemOrder)) {
      toast.error("Please enter a valid number for location order");
      return;
    }

    try {
      const { error } = await supabase
        .from('locations')
        .update({ location_order: itemOrder })
        .eq('id', id);

      if (error) throw error;
      toast.success("Location order updated successfully");
    } catch (error: any) {
      toast.error("Failed to update location order: " + error.message);
    }
  };

  const requestSort = (key: 'name' | 'address' | 'city' | 'locationOrder') => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending'
    }));
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending'
      ? <ArrowUp className="ml-1 h-3 w-3" />
      : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  const sortedLocations = useMemo(() => {
    return [...locations].sort((a, b) => {
      let aValue: number | string, bValue: number | string;

      if (sortConfig.key === 'locationOrder') {
        aValue = a.locationOrder ?? 0;
        bValue = b.locationOrder ?? 0;
      } else if (sortConfig.key === 'name') {
        aValue = (a.name || "").toLowerCase();
        bValue = (b.name || "").toLowerCase();
      } else if (sortConfig.key === 'address') {
        aValue = (a.address || "").toLowerCase();
        bValue = (b.address || "").toLowerCase();
      } else { // city
        aValue = (a.city || "").toLowerCase();
        bValue = (b.city || "").toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [locations, sortConfig]);

  if (isLoading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  if (sortedLocations.length === 0) {
    return (
      <div className="text-center py-8">
        <MapPin className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium">No locations found</h3>
        <p className="mt-1 text-gray-500">Get started by adding a new location.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="cursor-pointer" onClick={() => requestSort('name')}>
              <div className="flex items-center">Name {getSortIcon('name')}</div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => requestSort('address')}>
              <div className="flex items-center">Address {getSortIcon('address')}</div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => requestSort('city')}>
              <div className="flex items-center">City {getSortIcon('city')}</div>
            </TableHead>
            <TableHead className="cursor-pointer" onClick={() => requestSort('locationOrder')}>
              <div className="flex items-center">Location Order {getSortIcon('locationOrder')}</div>
            </TableHead>
            <TableHead className="w-[150px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedLocations.map((location) => (
            <TableRow key={location.id}>
              <TableCell className="font-medium">{location.name}</TableCell>
              <TableCell>{location.address}</TableCell>
              <TableCell>{location.city}</TableCell>
              <TableCell>
  <Input
    type="number"
    value={itemOrderInputs[location.id] ?? location.locationOrder?.toString() ?? ''}
    onChange={(e) => handleItemOrderChange(location.id, e.target.value)}
    onBlur={() => handleItemOrderSave(location.id)}
    onKeyDown={(e) => {
      if (e.key === 'Enter') handleItemOrderSave(location.id);
    }}
    className="w-20"
  />
</TableCell>
              <TableCell>
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon" onClick={() => onEdit(location)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => onDelete(location.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};