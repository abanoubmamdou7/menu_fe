import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Tag,
  Upload,
  X,
  Save,
  CheckCircle2,
  AlertCircle,
  FileImage,
  Loader2,
} from 'lucide-react';
import { useTagsInfo, useSaveTagsInfo } from '@/services/tagsService.ts';

interface TagsFormValues {
  fasting: string | null;
  vegetarian: string | null;
  healthy_choice: string | null;
  signature_dish: string | null;
  spicy: string | null;
}

interface TagUploadState {
  file: File | null;
  preview: string | null;
  url: string | null;
  uploading: boolean;
  error: string | null;
  removed: boolean;
}

const normalizeRemoteImageUrl = (value?: string | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
    return trimmed;
  }
  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }
  return null;
};

const AdminTagsPage = () => {
  const { data: tagsInfo, isLoading, error } = useTagsInfo();
  const updateMutation = useSaveTagsInfo();

  const [tags, setTags] = useState<Record<string, TagUploadState>>({
    fasting: { file: null, preview: null, url: null, uploading: false, error: null, removed: false },
    vegetarian: { file: null, preview: null, url: null, uploading: false, error: null, removed: false },
    healthy_choice: { file: null, preview: null, url: null, uploading: false, error: null, removed: false },
    signature_dish: { file: null, preview: null, url: null, uploading: false, error: null, removed: false },
    spicy: { file: null, preview: null, url: null, uploading: false, error: null, removed: false }
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const tagLabels = {
    fasting: 'Fasting',
    vegetarian: 'Vegetarian',
    healthy_choice: 'Healthy Choice',
    signature_dish: 'Signature Dish',
    spicy: 'Spicy'
  };

  const form = useForm<TagsFormValues>({
    defaultValues: {
      fasting: null,
      vegetarian: null,
      healthy_choice: null,
      signature_dish: null,
      spicy: null,
    },
  });

  // Load existing tag data when tagsInfo is available
  useEffect(() => {
    if (tagsInfo) {
      form.reset({
        fasting: tagsInfo.fasting || null,
        vegetarian: tagsInfo.vegetarian || null,
        healthy_choice: tagsInfo.healthy_choice || null,
        signature_dish: tagsInfo.signature_dish || null,
        spicy: tagsInfo.spicy || null,
      });

      // Update tags state with existing URLs
      setTags(prev => ({
        fasting: { ...prev.fasting, url: tagsInfo.fasting || null },
        vegetarian: { ...prev.vegetarian, url: tagsInfo.vegetarian || null },
        healthy_choice: { ...prev.healthy_choice, url: tagsInfo.healthy_choice || null },
        signature_dish: { ...prev.signature_dish, url: tagsInfo.signature_dish || null },
        spicy: { ...prev.spicy, url: tagsInfo.spicy || null }
      }));
    }
  }, [tagsInfo, form]);

  // Monitor changes for save button state
  useEffect(() => {
    if (!tagsInfo) return;

    const initialValues = {
      fasting: tagsInfo.fasting || null,
      vegetarian: tagsInfo.vegetarian || null,
      healthy_choice: tagsInfo.healthy_choice || null,
      signature_dish: tagsInfo.signature_dish || null,
      spicy: tagsInfo.spicy || null,
    };

    const hasTagChanges = Object.keys(tags).some(key => {
      const tag = tags[key];
      const initialUrl = initialValues[key];
      return tag.removed || tag.file !== null || tag.url !== initialUrl;
    });

    setHasChanges(hasTagChanges);
  }, [tags, tagsInfo]);

  const validateFile = (file: File): string | null => {
    if (!file.name.toLowerCase().endsWith('.ico')) {
      return 'Only .ico files are allowed';
    }
    if (file.size > 1024 * 1024) { // 1MB limit
      return 'File size must be less than 1MB';
    }
    return null;
  };

  const handleTagChange = async (tagKey: string, file: File | null) => {
    setTags(prev => ({
      ...prev,
      [tagKey]: {
        ...prev[tagKey],
        removed: false,
        file: file,
        error: null
      }
    }));

    if (!file) {
      // Clean up previous preview URL
      const currentTag = tags[tagKey];
      if (currentTag.preview?.startsWith('blob:')) {
        URL.revokeObjectURL(currentTag.preview);
      }
      setTags(prev => ({
        ...prev,
        [tagKey]: {
          ...prev[tagKey],
          preview: null
        }
      }));
      return;
    }

    const validationError = validateFile(file);
    if (validationError) {
      setTags(prev => ({
        ...prev,
        [tagKey]: { ...prev[tagKey], error: validationError }
      }));
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setTags(prev => ({
      ...prev,
      [tagKey]: {
        ...prev[tagKey],
        preview: previewUrl
      }
    }));

    try {
      setTags(prev => ({
        ...prev,
        [tagKey]: { ...prev[tagKey], uploading: true }
      }));

      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/image/uploadImage`,
        {
          method: 'POST',
          headers: {
            'Authorization': localStorage.getItem('token') || '',
          },
          credentials: 'include',
          body: formData,
        }
      );

      if (res.status === 401) {
        toast.error('Unauthorized. Login required.');
        setTags(prev => ({
          ...prev,
          [tagKey]: { ...prev[tagKey], url: null, uploading: false }
        }));
        return;
      }

      const result = await res.json();

      if (res.ok && result?.fileUrls?.length > 0) {
        setTags(prev => ({
          ...prev,
          [tagKey]: {
            ...prev[tagKey],
            url: result.fileUrls[0],
            uploading: false,
            error: null
          }
        }));
        toast.success(`${tagLabels[tagKey]} icon uploaded successfully`);
      } else {
        throw new Error(result?.message || 'Failed to upload icon');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error(err?.message || 'Upload error');
      setTags(prev => ({
        ...prev,
        [tagKey]: { ...prev[tagKey], url: null, uploading: false, error: err.message }
      }));
    }
  };

  const handleFileInputChange = (tagKey: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    handleTagChange(tagKey, file);
  };

  const removeImage = (tagKey: string) => {
    const currentTag = tags[tagKey];

    // Clean up preview URL if it exists
    if (currentTag.preview?.startsWith('blob:')) {
      URL.revokeObjectURL(currentTag.preview);
    }

    setTags(prev => ({
      ...prev,
      [tagKey]: {
        ...prev[tagKey],
        file: null,
        preview: null,
        url: null,
        error: null,
        removed: true
      }
    }));
  };

  const getImageUrl = (tagData: TagUploadState): string | null => {
    // Priority: preview (for new uploads) > url (existing image from database)
    if (tagData.preview) {
      return tagData.preview;
    }
    if (tagData.url) {
      return normalizeRemoteImageUrl(tagData.url);
    }
    return null;
  };

  const hasImage = (tagData: TagUploadState): boolean => {
    return !!(tagData.preview || tagData.url);
  };

  const handleSubmit = async () => {
    try {
      setIsUploading(true);
      updateMutation.mutate(
        {
          fasting: tags.fasting.removed ? null : tags.fasting.url,
          vegetarian: tags.vegetarian.removed ? null : tags.vegetarian.url,
          healthy_choice: tags.healthy_choice.removed ? null : tags.healthy_choice.url,
          signature_dish: tags.signature_dish.removed ? null : tags.signature_dish.url,
          spicy: tags.spicy.removed ? null : tags.spicy.url,
        },
        {
          onSuccess: () => {
            toast.success('Tags updated successfully');
            setIsUploading(false);
            setHasChanges(false);

            // Reset removed flags and clean up blob URLs
            setTags(prev => {
              const updated = { ...prev };
              Object.keys(updated).forEach(key => {
                updated[key].removed = false;
                updated[key].file = null;
                if (updated[key].preview?.startsWith('blob:')) {
                  URL.revokeObjectURL(updated[key].preview);
                  updated[key].preview = null;
                }
              });
              return updated;
            });
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

  // Cleanup blob URLs on component unmount
  useEffect(() => {
    return () => {
      Object.values(tags).forEach(tag => {
        if (tag.preview?.startsWith('blob:')) {
          URL.revokeObjectURL(tag.preview);
        }
      });
    };
  }, []);

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
                There was an error loading your tags information. Please
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
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center">
            <Tag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Tag Management
            </h1>
            <p className="text-gray-600">
              Upload .ico files for each tag type. These icons will be displayed alongside menu items.
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="space-y-4">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-32 w-full rounded-lg" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(tags).map(([tagKey, tagData]) => (
                  <div key={tagKey} className="bg-gray-50 rounded-lg border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {tagLabels[tagKey]}
                    </h3>

                    <div className="space-y-4">
                      {/* Image Preview */}
                      <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                        {hasImage(tagData) ? (
                          <div className="relative">
                            <img
                              src={getImageUrl(tagData)!}
                              alt={tagLabels[tagKey]}
                              className="h-16 w-16 object-contain"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(tagKey)}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="text-center">
                            <FileImage className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">No icon uploaded</p>
                          </div>
                        )}
                      </div>

                      {/* Upload Button */}
                      <div className="relative">
                        <input
                          type="file"
                          accept=".ico"
                          onChange={(e) => handleFileInputChange(tagKey, e)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={tagData.uploading}
                        />
                        <button
                          type="button"
                          className={`w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                            tagData.uploading ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          disabled={tagData.uploading}
                        >
                          {tagData.uploading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              {hasImage(tagData) ? 'Replace Icon' : 'Upload Icon'}
                            </>
                          )}
                        </button>
                      </div>

                      {/* Error Display */}
                      {tagData.error && (
                        <div className="flex items-center text-red-600 text-sm">
                          <AlertCircle className="h-4 w-4 mr-1" />
                          {tagData.error}
                        </div>
                      )}

                      {/* File Requirements */}
                      <div className="text-xs text-gray-500">
                        <p>Requirements:</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>File format: .ico only</li>
                          <li>Max size: 1MB</li>
                          <li>Recommended: 32x32px</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
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
                  onClick={handleSubmit}
              
                  className="min-w-32 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-200"
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
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminTagsPage;