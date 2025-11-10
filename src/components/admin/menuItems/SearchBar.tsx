
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddClick: () => void;
}

const SearchBar = ({ searchTerm, onSearchChange, onAddClick }: SearchBarProps) => {
  return (
    <div className="flex gap-2 w-full md:w-auto">
      <div className="relative flex-1 md:w-64">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
      <Button onClick={onAddClick} className="whitespace-nowrap">
        <Plus className="h-4 w-4 mr-1" /> Add Item
      </Button>
    </div>
  );
};

export default SearchBar;
