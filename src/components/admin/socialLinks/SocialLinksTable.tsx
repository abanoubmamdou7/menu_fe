// import React, { useState, useMemo } from 'react';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Button } from '@/components/ui/button';
// import { Pencil, Trash2, Share2, Facebook, Instagram, MessageCircle, Star, ArrowUp, ArrowDown } from 'lucide-react';
// import { SocialLink } from '@/services/socialLinkServices';
// import { mysqlClient } from '@/lib/mysql-client';
// import { toast } from 'sonner';
// import { Input } from '../../ui/input.tsx';


// interface SocialLinksTableProps {
//   socialLinks: SocialLink[];
//   onEdit: (link: SocialLink) => void;
//   onDelete: (id: string) => void;
//   isLoading: boolean;
// }

// export const SocialLinksTable: React.FC<SocialLinksTableProps> = ({
//   socialLinks,
//   onEdit,
//   onDelete,
//   isLoading,
// }) => {
//   const [itemOrderInputs, setItemOrderInputs] = useState<Record<string, string>>({});
//   const [sortConfig, setSortConfig] = useState<{
//     key: 'platform' | 'url' | 'linksOrder';
//     direction: 'ascending' | 'descending';
//   }>({
//     key: 'linksOrder',
//     direction: 'ascending',
//   });

//   // Function to get the appropriate icon for each platform
//   const getPlatformIcon = (platform: string) => {
//     switch (platform.toLowerCase()) {
//       case 'facebook':
//         return <Facebook className="h-5 w-5 text-blue-600" />;
//       case 'instagram':
//         return <Instagram className="h-5 w-5 text-pink-600" />;
//       case 'whatsapp':
//         return <MessageCircle className="h-5 w-5 text-green-500" />;
//       case 'google_review':
//         return <Star className="h-5 w-5 text-yellow-500" />;
//       default:
//         return <Share2 className="h-5 w-5 text-gray-500" />;
//     }
//   };

//   // Handle input change for order field
//   const handleItemOrderChange = (id: string, value: string) => {
//     setItemOrderInputs((prev) => ({ ...prev, [id]: value }));
//   };

//   // Handle saving the order to the backend
//   const handleItemOrderSave = async (id: string) => {
//     const rawInput = itemOrderInputs[id]?.trim();
//     const itemOrder = parseInt(rawInput, 10);

//     if (!rawInput || isNaN(itemOrder)) {
//       toast.error('Please enter a valid number for link order');
//       return;
//     }

//     try {
//       const { error } = await mysqlClient
//         .from('social_links')
//         .eq('id', id)
//         .update({ links_order: itemOrder });

//       if (error) throw error;
//       toast.success('Link order updated successfully');
//     } catch (error: any) {
//       toast.error('Failed to update link order: ' + error.message);
//     }
//   };

//   // Handle sorting
//   const requestSort = (key: 'platform' | 'url' | 'linksOrder') => {
//     setSortConfig((prev) => ({
//       key,
//       direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending',
//     }));
//   };

//   // Get sort icon for column headers
//   const getSortIcon = (key: string) => {
//     if (sortConfig.key !== key) return null;
//     return sortConfig.direction === 'ascending' ? (
//       <ArrowUp className="ml-1 h-3 w-3" />
//     ) : (
//       <ArrowDown className="ml-1 h-3 w-3" />
//     );
//   };

//   // Sort social links
//   const sortedLinks = useMemo(() => {
//     return [...socialLinks].sort((a, b) => {
//       let aValue: number | string, bValue: number | string;

//       if (sortConfig.key === 'linksOrder') {
//         aValue = a.linksOrder ?? 0;
//         bValue = b.linksOrder ?? 0;
//       } else if (sortConfig.key === 'platform') {
//         aValue = (a.platform || '').toLowerCase();
//         bValue = (b.platform || '').toLowerCase();
//       } else {
//         // url
//         aValue = (a.url || '').toLowerCase();
//         bValue = (b.url || '').toLowerCase();
//       }

//       if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
//       if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
//       return 0;
//     });
//   }, [socialLinks, sortConfig]);

//   if (isLoading) {
//     return <div className="text-center py-4">Loading...</div>;
//   }

//   if (sortedLinks.length === 0) {
//     return (
//       <div className="text-center py-8">
//         <Share2 className="mx-auto h-12 w-12 text-gray-400" />
//         <h3 className="mt-2 text-lg font-medium">No social links found</h3>
//         <p className="mt-1 text-gray-500">Get started by adding a new social link.</p>
//       </div>
//     );
//   }

//   return (
//     <div className="border rounded-md overflow-hidden">
//       <Table>
//         <TableHeader>
//           <TableRow>
//             <TableHead className="w-[80px]">Icon</TableHead>
//             <TableHead className="cursor-pointer" onClick={() => requestSort('platform')}>
//               <div className="flex items-center">Platform {getSortIcon('platform')}</div>
//             </TableHead>
//             <TableHead className="cursor-pointer" onClick={() => requestSort('url')}>
//               <div className="flex items-center">URL {getSortIcon('url')}</div>
//             </TableHead>
//             <TableHead className="cursor-pointer" onClick={() => requestSort('linksOrder')}>
//               <div className="flex items-center">Link Order {getSortIcon('linksOrder')}</div>
//             </TableHead>
//             <TableHead className="w-[150px]">Actions</TableHead>
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//           {sortedLinks.map((link) => (
//             <TableRow key={link.id}>
//               <TableCell>{getPlatformIcon(link.platform)}</TableCell>
//               <TableCell className="font-medium">{link.platform}</TableCell>
//               <TableCell className="truncate max-w-xs">
//                 <a
//                   href={link.url}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="text-blue-600 hover:underline"
//                 >
//                   {link.url}
//                 </a>
//               </TableCell>
//               <TableCell>
//                 <Input
//                   type="number"
//                   value={itemOrderInputs[link.id] ?? link.linksOrder?.toString() ?? ''}
//                   onChange={(e) => handleItemOrderChange(link.id, e.target.value)}
//                   onBlur={() => handleItemOrderSave(link.id)}
//                   onKeyDown={(e) => {
//                     if (e.key === 'Enter') handleItemOrderSave(link.id);
//                   }}
//                   className="w-20"
//                   aria-label={`Set order for ${link.platform} link`}
//                 />
//               </TableCell>
//               <TableCell>
//                 <div className="flex space-x-2">
//                   <Button
//                     variant="outline"
//                     size="icon"
//                     onClick={() => onEdit(link)}
//                     aria-label={`Edit ${link.platform} link`}
//                   >
//                     <Pencil className="h-4 w-4" />
//                   </Button>
//                   <Button
//                     variant="outline"
//                     size="icon"
//                     onClick={() => onDelete(link.id)}
//                     aria-label={`Delete ${link.platform} link`}
//                   >
//                     <Trash2 className="h-4 w-4" />
//                   </Button>
//                 </div>
//               </TableCell>
//             </TableRow>
//           ))}
//         </TableBody>
//       </Table>
//     </div>
//   );
// };
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Pencil, 
  Trash2, 
  Share2, 
  Facebook, 
  Instagram, 
  MessageCircle, 
  Star, 
  ArrowUp, 
  ArrowDown, 
  Palette,
  Eye,
  EyeOff,
  Check,
  X,
  Copy,
  ExternalLink,
  Search
} from 'lucide-react';
import { SocialLink } from '@/services/socialLinkServices';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SocialLinksTableProps {
  socialLinks: SocialLink[];
  onEdit: (link: SocialLink) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
}

// Enhanced color palette with better organization
const COLOR_PALETTE = {
  primary: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
  secondary: ['#DDA0DD', '#98D8E8', '#F7DC6F', '#BB8FCE', '#85C1E9'],
  neutral: ['#2C3E50', '#34495E', '#95A5A6', '#BDC3C7', '#ECF0F1'],
  social: ['#3B5998', '#E4405F', '#25D366', '#FF0000', '#1DA1F2'],
  accent: ['#E74C3C', '#9B59B6', '#F39C12', '#1ABC9C', '#16A085']
};

// Enhanced Color Picker Component
const ColorPicker: React.FC<{
  value: string;
  onChange: (color: string) => void;
  onSave: () => void;
  label: string;
  isLoading?: boolean;
}> = ({ value, onChange, onSave, label, isLoading = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value);

  useEffect(() => {
    setCustomColor(value);
  }, [value]);

  const handleColorSelect = (color: string) => {
    onChange(color);
    setCustomColor(color);
    onSave();
    setIsOpen(false);
  };

  const handleCustomColorApply = () => {
    if (customColor && /^#[0-9A-Fa-f]{6}$/.test(customColor)) {
      onChange(customColor);
      onSave();
      setIsOpen(false);
    } else {
      toast.error('Please enter a valid hex color (e.g., #FF0000)');
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={label}
            >
              <div 
                className="w-5 h-5 rounded border border-gray-300 shadow-sm" 
                style={{ backgroundColor: value || '#ffffff' }}
              />
              <Palette className="h-4 w-4" />
              {isLoading && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-500" />}
            </button>
            
            {isOpen && (
              <div className="absolute z-20 mt-2 p-4 bg-white border rounded-lg shadow-xl min-w-[280px] max-w-[320px]">
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-3">Color Palette</h4>
                  {Object.entries(COLOR_PALETTE).map(([category, colors]) => (
                    <div key={category} className="mb-3">
                      <p className="text-xs text-gray-500 mb-2 capitalize">{category}</p>
                      <div className="grid grid-cols-5 gap-2">
                        {colors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => handleColorSelect(color)}
                            className={`w-8 h-8 rounded border-2 hover:scale-110 transition-transform shadow-sm ${
                              value === color ? 'border-gray-800 ring-2 ring-blue-500' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            aria-label={`Select color ${color}`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-3">
                  <label className="block text-sm font-medium mb-2">Custom Color:</label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      placeholder="#RRGGBB"
                      className="flex-1 text-sm font-mono"
                      maxLength={7}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCustomColorApply();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      onClick={handleCustomColorApply}
                      disabled={!customColor || !/^#[0-9A-Fa-f]{6}$/.test(customColor)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Format: #RRGGBB (e.g., #FF0000)</p>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="flex-1"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(value);
                      toast.success('Color copied to clipboard!');
                    }}
                    className="flex-1"
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Enhanced Social Links Table Component
export const SocialLinksTable: React.FC<SocialLinksTableProps> = ({
  socialLinks,
  onEdit,
  onDelete,
  isLoading,
}) => {
  const [itemOrderInputs, setItemOrderInputs] = useState<Record<string, string>>({});
  const [colorInputs, setColorInputs] = useState<Record<string, { bgColor: string; textColor: string; borderColor: string }>>({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: 'platform' | 'url' | 'linksOrder' | 'bgColor' | 'textColor' | 'borderColor';
    direction: 'ascending' | 'descending';
  }>({
    key: 'linksOrder',
    direction: 'ascending',
  });

  // Enhanced platform icon mapping
  const getPlatformIcon = useCallback((platform: string) => {
    const iconMap = {
      facebook: <Facebook className="h-5 w-5 text-blue-600" />,
      instagram: <Instagram className="h-5 w-5 text-pink-600" />,
      whatsapp: <MessageCircle className="h-5 w-5 text-green-500" />,
      google_review: <Star className="h-5 w-5 text-yellow-500" />,
      twitter: <Share2 className="h-5 w-5 text-blue-400" />,
      linkedin: <Share2 className="h-5 w-5 text-blue-700" />,
      youtube: <Share2 className="h-5 w-5 text-red-600" />,
      tiktok: <Share2 className="h-5 w-5 text-black" />,
      pinterest: <Share2 className="h-5 w-5 text-red-500" />,
      snapchat: <Share2 className="h-5 w-5 text-yellow-400" />,
    };
    
    return iconMap[platform.toLowerCase()] || <Share2 className="h-5 w-5 text-gray-500" />;
  }, []);

  // Enhanced URL validation
  const isValidUrl = useCallback((url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Handle input change for order field with validation
  const handleItemOrderChange = useCallback((id: string, value: string) => {
    // Only allow numbers and empty string
    if (value === '' || /^\d+$/.test(value)) {
      setItemOrderInputs((prev) => ({ ...prev, [id]: value }));
    }
  }, []);

  // Handle input change for color fields with validation
  const handleColorChange = useCallback((id: string, field: 'bgColor' | 'textColor' | 'borderColor', value: string) => {
    setColorInputs((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  }, []);

  // Get current color value with fallback
  const getCurrentColor = useCallback((id: string, field: 'bgColor' | 'textColor' | 'borderColor') => {
    const link = socialLinks.find(l => l.id === id);
    return colorInputs[id]?.[field] || link?.[field] || '#ffffff';
  }, [socialLinks, colorInputs]);

  // Enhanced order saving with better error handling
  const handleItemOrderSave = useCallback(async (id: string) => {
    const rawInput = itemOrderInputs[id]?.trim();
    
    if (!rawInput) {
      // Clear the order if empty
      const originalLink = socialLinks.find(l => l.id === id);
      if (originalLink?.linksOrder) {
        setItemOrderInputs(prev => ({ ...prev, [id]: originalLink.linksOrder?.toString() || '' }));
      }
      return;
    }

    const itemOrder = parseInt(rawInput, 10);
    
    if (isNaN(itemOrder) || itemOrder < 0) {
      toast.error('Please enter a valid positive number for link order');
      return;
    }

    setLoadingStates(prev => ({ ...prev, [`${id}-order`]: true }));

    try {
      const { error } = await supabase
        .from('social_links')
        .update({ links_order: itemOrder })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Link order updated successfully');
      
      // Update the local state to reflect the change
      setItemOrderInputs(prev => ({ ...prev, [id]: itemOrder.toString() }));
      
    } catch (error: any) {
      toast.error('Failed to update link order: ' + error.message);
      console.error('Order update error:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [`${id}-order`]: false }));
    }
  }, [itemOrderInputs, socialLinks]);

  // Enhanced color saving with better validation
  const handleColorSave = useCallback(async (id: string, field: 'bgColor' | 'textColor' | 'borderColor') => {
    const value = getCurrentColor(id, field).trim();

    if (!value) {
      toast.error(`Please enter a color for ${field}`);
      return;
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
      toast.error(`Please enter a valid hex color for ${field} (e.g., #FF0000)`);
      return;
    }

    setLoadingStates(prev => ({ ...prev, [`${id}-${field}`]: true }));

    try {
      const { error } = await supabase
        .from('social_links')
        .update({ [field]: value })
        .eq('id', id);

      if (error) throw error;
      
      toast.success(`${field.replace(/([A-Z])/g, ' $1').toLowerCase()} updated successfully`);
      
    } catch (error: any) {
      toast.error(`Failed to update ${field}: ` + error.message);
      console.error('Color update error:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, [`${id}-${field}`]: false }));
    }
  }, [getCurrentColor]);

  // Enhanced sorting with better type safety
  const requestSort = useCallback((key: typeof sortConfig.key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending',
    }));
  }, []);

  // Get sort icon for column headers
  const getSortIcon = useCallback((key: string) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'ascending' ? (
      <ArrowUp className="ml-1 h-3 w-3" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3" />
    );
  }, [sortConfig]);

  // Enhanced filtering and sorting
  const filteredAndSortedLinks = useMemo(() => {
    let filtered = socialLinks;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(link => 
        link.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
        link.url.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      let aValue: number | string, bValue: number | string;

      switch (sortConfig.key) {
        case 'linksOrder':
          aValue = a.linksOrder ?? 0;
          bValue = b.linksOrder ?? 0;
          break;
        case 'platform':
          aValue = (a.platform || '').toLowerCase();
          bValue = (b.platform || '').toLowerCase();
          break;
        case 'url':
          aValue = (a.url || '').toLowerCase();
          bValue = (b.url || '').toLowerCase();
          break;
        case 'bgColor':
          aValue = (a.bgColor || '').toLowerCase();
          bValue = (b.bgColor || '').toLowerCase();
          break;
        case 'textColor':
          aValue = (a.textColor || '').toLowerCase();
          bValue = (b.textColor || '').toLowerCase();
          break;
        case 'borderColor':
          aValue = (a.borderColor || '').toLowerCase();
          bValue = (b.borderColor || '').toLowerCase();
          break;
        default:
          aValue = a.linksOrder ?? 0;
          bValue = b.linksOrder ?? 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
      return 0;
    });
  }, [socialLinks, sortConfig, searchTerm]);

  // Copy URL to clipboard
  const copyUrl = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('URL copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  }, []);

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading social links...</p>
      </div>
    );
  }

  if (socialLinks.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Share2 className="mx-auto h-16 w-16 text-gray-400" />
        <h3 className="mt-4 text-xl font-medium text-gray-900">No social links found</h3>
        <p className="mt-2 text-gray-500">Get started by adding your first social media link.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Enhanced Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search platforms or URLs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {filteredAndSortedLinks.length} of {socialLinks.length} links
          </Badge>
        </div>
      </div>

      {/* Enhanced Table */}
      <div className="border rounded-lg overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[80px]">Icon</TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('platform')}>
                <div className="flex items-center font-medium">
                  Platform {getSortIcon('platform')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('url')}>
                <div className="flex items-center font-medium">
                  URL {getSortIcon('url')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('linksOrder')}>
                <div className="flex items-center font-medium">
                  Order {getSortIcon('linksOrder')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('bgColor')}>
                <div className="flex items-center font-medium">
                  Background {getSortIcon('bgColor')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('textColor')}>
                <div className="flex items-center font-medium">
                  Text {getSortIcon('textColor')}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => requestSort('borderColor')}>
                <div className="flex items-center font-medium">
                  Border {getSortIcon('borderColor')}
                </div>
              </TableHead>
              <TableHead className="w-[180px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedLinks.map((link) => (
              <TableRow key={link.id} className="hover:bg-gray-50 transition-colors">
                <TableCell className="text-center">
                  {getPlatformIcon(link.platform)}
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <span className="capitalize">{link.platform}</span>
                    <Badge variant="outline" className="text-xs">
                      {link.platform.replace('_', ' ')}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 max-w-xs">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`truncate flex-1 hover:underline transition-colors ${
                        isValidUrl(link.url) ? 'text-blue-600' : 'text-red-600'
                      }`}
                      title={link.url}
                    >
                      {link.url}
                    </a>
                    <div className="flex gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyUrl(link.url)}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Copy URL</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(link.url, '_blank')}
                              className="h-6 w-6 p-0"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Open in new tab</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={itemOrderInputs[link.id] ?? link.linksOrder?.toString() ?? ''}
                      onChange={(e) => handleItemOrderChange(link.id, e.target.value)}
                      onBlur={() => handleItemOrderSave(link.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleItemOrderSave(link.id);
                      }}
                      className="w-20 text-center"
                      disabled={loadingStates[`${link.id}-order`]}
                      aria-label={`Set order for ${link.platform} link`}
                    />
                    {loadingStates[`${link.id}-order`] && (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <ColorPicker
                    value={getCurrentColor(link.id, 'bgColor')}
                    onChange={(color) => handleColorChange(link.id, 'bgColor', color)}
                    onSave={() => handleColorSave(link.id, 'bgColor')}
                    label={`Set background color for ${link.platform} link`}
                    isLoading={loadingStates[`${link.id}-bgColor`]}
                  />
                </TableCell>
                <TableCell>
                  <ColorPicker
                    value={getCurrentColor(link.id, 'textColor')}
                    onChange={(color) => handleColorChange(link.id, 'textColor', color)}
                    onSave={() => handleColorSave(link.id, 'textColor')}
                    label={`Set text color for ${link.platform} link`}
                    isLoading={loadingStates[`${link.id}-textColor`]}
                  />
                </TableCell>
                <TableCell>
                  <ColorPicker
                    value={getCurrentColor(link.id, 'borderColor')}
                    onChange={(color) => handleColorChange(link.id, 'borderColor', color)}
                    onSave={() => handleColorSave(link.id, 'borderColor')}
                    label={`Set border color for ${link.platform} link`}
                    isLoading={loadingStates[`${link.id}-borderColor`]}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(link)}
                            className="h-8 w-8 p-0"
                            aria-label={`Edit ${link.platform} link`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit link</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(link.id)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-200"
                            aria-label={`Delete ${link.platform} link`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete link</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* No results message */}
      {filteredAndSortedLinks.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <Search className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No links found</h3>
          <p className="mt-1 text-gray-500">
            No social links match your search for "{searchTerm}". Try a different search term.
          </p>
          <Button
            variant="outline"
            onClick={() => setSearchTerm('')}
            className="mt-4"
          >
            Clear search
          </Button>
        </div>
      )}
    </div>
  );
};