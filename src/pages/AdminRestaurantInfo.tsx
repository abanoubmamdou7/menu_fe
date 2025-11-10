import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useRestaurantInfo,
  useSaveRestaurantInfo,
} from "@/services/restaurantInfoService";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  Save,
  CheckCircle2,
  AlertCircle,
  Building2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import ThemeSelector from "@/components/admin/ThemeSelector";
import RestaurantBasicInfoForm from "@/components/admin/restaurant/RestaurantBasicInfoForm";
import RestaurantLogoUpload from "@/components/admin/restaurant/RestaurantLogoUpload";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { QRCodeCanvas } from "qrcode.react";

interface RestaurantInfoFormValues {
  name: string;
  slogan: string;
  theme_id: string;
  show_all_category: boolean;
  branch_code: string;
  style: string;
}

const AdminRestaurantInfo = () => {
  const { data: restaurantInfo, isLoading, error } = useRestaurantInfo();
  const updateMutation = useSaveRestaurantInfo();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [logoRemoved, setLogoRemoved] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const form = useForm<RestaurantInfoFormValues>({
    defaultValues: {
      name: "",
      slogan: "",
      theme_id: "",
      show_all_category: true,
      branch_code: "",
      style: "",
    },
  });

  useEffect(() => {
    if (restaurantInfo) {
      form.reset({
        name: restaurantInfo.name || "",
        slogan: restaurantInfo.slogan || "",
        theme_id: restaurantInfo.theme_id || "",
        show_all_category: restaurantInfo.show_all_category ?? true,
        branch_code: restaurantInfo.branch_code || "",
        style: restaurantInfo.style || "grid",
      });
      setLogoUrl(restaurantInfo.logo_url || null);
      setLogoRemoved(false);
      setLogoFile(null);
      setLogoPreview(null);
    }
  }, [restaurantInfo, form]);

  const watchedValues = form.watch();

  useEffect(() => {
    if (!restaurantInfo) return;
    const initialValues = {
      name: restaurantInfo.name || "",
      slogan: restaurantInfo.slogan || "",
      theme_id: restaurantInfo.theme_id || "",
      show_all_category: restaurantInfo.show_all_category ?? true,
      branch_code: restaurantInfo.branch_code || "",
      style: restaurantInfo.style || "grid",
    };

    const hasFormChanges =
      watchedValues.name !== initialValues.name ||
      watchedValues.slogan !== initialValues.slogan ||
      watchedValues.theme_id !== initialValues.theme_id ||
      watchedValues.show_all_category !== initialValues.show_all_category ||
      watchedValues.branch_code !== initialValues.branch_code ||
      watchedValues.style !== initialValues.style ||
      logoRemoved ||
      logoFile !== null;

    setHasChanges(hasFormChanges);
  }, [watchedValues, logoRemoved, logoFile, restaurantInfo]);

  const handleLogoChange = async (file: File | null) => {
    setLogoRemoved(false);
    setLogoFile(file);
    setHasChanges(true);

    if (!file) {
      if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
      setLogoPreview(null);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/image/uploadImage`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      if (res.status === 401) {
        toast.error("Unauthorized. Login required.");
        setLogoUrl(null);
        return;
      }

      const result = await res.json();

      if (res.ok && result?.fileUrls?.length > 0) {
        setLogoUrl(result.fileUrls[0]);
        toast.success("Logo uploaded successfully");
      } else {
        toast.error(result?.message || "Failed to upload logo");
        setLogoUrl(null);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Upload error");
      setLogoUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    setLogoPreview(null);
    setLogoUrl(null);
    setLogoRemoved(true);
    setLogoFile(null);
    setHasChanges(true);
  };

  const handleSyncAll = async () => {
    try {
      setIsSyncing(true);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/transfer/sync-all`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: localStorage.getItem("token") || "",
          },
          credentials: "include",
        }
      );

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage =
          result?.message || `Server error: ${response.status}`;
        throw new Error(errorMessage);
      }

      const failures = Array.isArray(result?.failures)
        ? result.failures.filter(Boolean)
        : [];
      const message =
        result?.message ||
        (failures.length > 0
          ? "Sync completed with some branch errors."
          : "All branches synced successfully.");

      if (failures.length === 0) {
        toast.success(message);
      } else if (failures.length === result?.summary?.totalBranches) {
        toast.error(message);
      } else {
        toast.error(
          `${message} Failed branches: ${failures
            .map(
              (branch) =>
                branch?.branchName ||
                branch?.branchCode ||
                branch?.name ||
                "Unknown"
            )
            .join(", ")}`
        );
      }
    } catch (error) {
      console.error("Data sync failed:", error);
      const errorMessage =
        error?.message ||
        "Sync failed for all branches. Check console for details.";
      toast.error(errorMessage);
    } finally {
      setIsSyncing(false);
    }
  };

  const onSubmit = async (values: RestaurantInfoFormValues) => {
    try {
      setIsUploading(true);
      updateMutation.mutate(
        {
          name: values.name,
          slogan: values.slogan,
          themeId: values.theme_id || null,
          logoUrl: logoRemoved ? null : logoUrl,
          removeLogo: logoRemoved,
          show_all_category: values.show_all_category,
          branch_code: values.branch_code || null,
          style: values.style || "grid",
        },

        {
          onSuccess: () => {
            toast.success("Restaurant information updated successfully");
            setIsUploading(false);
            setLogoRemoved(false);
            setHasChanges(false);
            setLogoFile(null);
          },
          onError: (error) => {
            toast.error(`Update failed: ${error.message}`);
            setIsUploading(false);
          },
        }
      );
    } catch (error) {
      toast.error(`Error: ${error.message}`);
      setIsUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Card className="p-8 max-w-md mx-auto border-red-200 bg-red-50/50">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900">
                Unable to Load Data
              </h3>
              <p className="text-red-700 mt-2">
                There was an error loading your restaurant information. Please
                try refreshing the page or contact support.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Restaurant Information
            </h1>
            <p className="text-gray-600">
              Manage your restaurant's basic information and branding
            </p>
          </div>
        </div>
        {hasChanges && (
          <div className="flex items-center gap-2 mt-4">
            <Badge
              variant="secondary"
              className="bg-amber-100 text-amber-800 border-amber-200"
            >
              <AlertCircle className="w-3 h-3 mr-1" /> Unsaved changes
            </Badge>
          </div>
        )}
      </div>

      <Card className="border-0 shadow-lg bg-white">
        <div className="p-8">
          {isLoading ? (
            <div className="space-y-8">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-12 w-64" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-32 w-32 rounded-lg" />
              <Skeleton className="h-11 w-32" />
            </div>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                <div className="space-y-6">
                  <RestaurantBasicInfoForm form={form} />

                  <div className="space-y-3 rounded-md border border-dashed border-slate-200 p-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Building2 className="w-4 h-4" />
                      <span>Branch Data Sync</span>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSyncAll}
                        disabled={isSyncing}
                        className="sm:w-auto"
                      >
                        {isSyncing ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Syncing All Branches...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Sync All Branches
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Pull the latest menu data from every branch in one step.
                      </p>
                    </div>
                    {restaurantInfo?.branch_code && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Default branch:</span>{" "}
                        {restaurantInfo.branch_code}
                      </div>
                    )}
                  </div>
                  {/*Menu display style*/}
                  <FormField
                    control={form.control}
                    name="style"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Menu Display Style</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select display style" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="grid">Grid</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="list">List</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="show_all_category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Show All Categories by Default</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/*QR code generator*/}
                <div className="border-t pt-8">
                  <FormLabel className="text-lg font-semibold text-gray-900">
                    Menu QR Code
                  </FormLabel>

                  <div className="mt-4 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    {/* QR Code Preview */}
                    <div className="p-4 rounded-lg border bg-white shadow-sm hover:shadow-md transition-shadow">
                      <QRCodeCanvas
                        id="menu-qrcode"
                        value={`${window.location.origin}`}
                        size={150}
                        includeMargin={true}
                      />
                    </div>

                    {/* Text + Actions */}
                    <div className="flex flex-col justify-center gap-3">
                      <p className="text-sm text-gray-600 max-w-xs">
                        Scan this QR code to instantly access the restaurant’s
                        menu page. This link will adapt to your website’s
                        domain.
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-fit"
                        onClick={() => {
                          const canvas = document.getElementById(
                            "menu-qrcode"
                          ) as HTMLCanvasElement;
                          const pngUrl = canvas
                            .toDataURL("image/png")
                            .replace("image/png", "image/octet-stream");
                          const downloadLink = document.createElement("a");
                          downloadLink.href = pngUrl;
                          downloadLink.download = "menu-qrcode.png";
                          document.body.appendChild(downloadLink);
                          downloadLink.click();
                          document.body.removeChild(downloadLink);
                        }}
                      >
                        Download QR Code
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-8">
                  <RestaurantLogoUpload
                    logoPreview={logoPreview}
                    onLogoChange={handleLogoChange}
                    onRemoveLogo={handleRemoveLogo}
                  />
                </div>

                <div className="border-t pt-8 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    {updateMutation.isSuccess && !hasChanges && (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-green-600">
                          All changes saved
                        </span>
                      </>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={
                      isUploading || updateMutation.isPending || !hasChanges
                    }
                    className="min-w-32 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isUploading || updateMutation.isPending ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminRestaurantInfo;
