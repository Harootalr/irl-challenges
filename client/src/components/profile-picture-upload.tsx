import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ProfilePictureUploadProps {
  onSuccess?: () => void;
}

export function ProfilePictureUpload({ onSuccess }: ProfilePictureUploadProps) {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('avatar', file);
      
      // In a real app, this would upload to a file storage service
      // For now, we'll simulate with a base64 conversion
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });
    },
    onSuccess: async (avatarUrl) => {
      try {
        // Update user profile with new avatar URL
        const response = await apiRequest('PUT', `/api/users/${user?.id}`, { avatarUrl });
        
        toast({
          title: "Profile picture updated",
          description: "Your profile picture has been updated successfully.",
        });
        
        // Refresh user data
        refreshUser();
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
        
        // Clear preview
        setPreviewUrl(null);
        
        onSuccess?.();
      } catch (error: any) {
        throw error;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload profile picture. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setIsUploading(true);
    uploadMutation.mutate(file);
  };

  const handleRemovePhoto = async () => {
    try {
      setIsUploading(true);
      
      // Remove avatar URL from user profile
      await apiRequest('PUT', `/api/users/${user?.id}`, { avatarUrl: null });
      
      toast({
        title: "Profile picture removed",
        description: "Your profile picture has been removed.",
      });
      
      // Refresh user data
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      // Clear preview
      setPreviewUrl(null);
      
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Failed to remove photo",
        description: error.message || "Failed to remove profile picture. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        {/* Current/Preview Avatar */}
        <div className="relative inline-block mb-4">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-24 h-24 rounded-full object-cover border-4 border-primary"
            />
          ) : user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-primary"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center border-4 border-primary">
              <span className="text-white text-2xl font-medium">
                {user?.name?.slice(0, 2)?.toUpperCase() || "??"}
              </span>
            </div>
          )}
          
          {/* Upload indicator */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
              <i className="fas fa-spinner fa-spin text-white text-xl"></i>
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Upload a photo to personalize your profile
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-file-upload"
      />

      {/* Action buttons */}
      <div className="space-y-2">
        {previewUrl ? (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setPreviewUrl(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="flex-1"
              data-testid="button-cancel-upload"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1"
              data-testid="button-confirm-upload"
            >
              {isUploading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Uploading...
                </>
              ) : (
                <>
                  <i className="fas fa-upload mr-2"></i>
                  Upload Photo
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              onClick={triggerFileSelect}
              className="w-full"
              data-testid="button-select-photo"
            >
              <i className="fas fa-camera mr-2"></i>
              {user?.avatarUrl ? "Change Photo" : "Upload Photo"}
            </Button>
            
            {user?.avatarUrl && (
              <Button
                variant="outline"
                onClick={handleRemovePhoto}
                disabled={isUploading}
                className="w-full"
                data-testid="button-remove-photo"
              >
                {isUploading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Removing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trash-alt mr-2"></i>
                    Remove Photo
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Upload guidelines */}
      <div className="bg-muted/50 p-3 rounded-lg">
        <h4 className="font-medium text-sm mb-2 flex items-center">
          <i className="fas fa-info-circle text-primary mr-2"></i>
          Photo Guidelines
        </h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Maximum file size: 5MB</li>
          <li>• Supported formats: JPG, PNG, GIF</li>
          <li>• Square images work best</li>
          <li>• Choose a clear, recognizable photo</li>
        </ul>
      </div>
    </div>
  );
}