import React, { useState } from 'react';
import { useRestaurantInfo, useSaveRestaurantInfo } from '@/services/restaurantInfoService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const AdminRestaurantInfo: React.FC = () => {
  const { data: restaurantInfo, isLoading } = useRestaurantInfo();
  const saveMutation = useSaveRestaurantInfo();
  const [name, setName] = useState(restaurantInfo?.name || '');
  const [slogan, setSlogan] = useState(restaurantInfo?.slogan || '');
  const [logoFile, setLogoFile] = useState<File | null>(null);

  React.useEffect(() => {
    if (restaurantInfo) {
      setName(restaurantInfo.name);
      setSlogan(restaurantInfo.slogan || '');
    }
  }, [restaurantInfo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveMutation.mutateAsync({
      name,
      slogan: slogan || null,
      logoUrl: null,
      removeLogo: false,
      themeId: null,
      show_all_category: true,
      branch_code: null,
      style: null
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Restaurant Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Restaurant Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter restaurant name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slogan">Slogan</Label>
            <Input
              id="slogan"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              placeholder="Enter restaurant slogan"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo">Logo</Label>
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
            />
          </div>

          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="w-full"
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>

        </form>
      </CardContent>
    </Card>
  );
};

export default AdminRestaurantInfo; 
