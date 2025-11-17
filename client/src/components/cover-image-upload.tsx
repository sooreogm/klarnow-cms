import { useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { uploadImageToFirebase, isFirebaseInitialized } from "@/lib/firebase";

interface CoverImageUploadProps {
  imageUrl: string;
  onImageChange: (url: string) => void;
  articleId: string;
}

export function CoverImageUpload({
  imageUrl,
  onImageChange,
  articleId,
}: CoverImageUploadProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleUpload = async (file: File) => {
    if (!isFirebaseInitialized()) {
      toast({
        title: "Firebase not configured",
        description: "Please configure Firebase settings first",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const imagePath = `covers/${articleId}-${Date.now()}.${file.name.split('.').pop()}`;
      const url = await uploadImageToFirebase(file, imagePath);
      onImageChange(url);
      toast({
        title: "Success",
        description: "Cover image uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload cover image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleRemove = () => {
    onImageChange("");
  };

  if (imageUrl) {
    return (
      <div className="relative aspect-video rounded-lg overflow-hidden group">
        <img
          src={imageUrl}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <label htmlFor="cover-upload">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => document.getElementById("cover-upload")?.click()}
              data-testid="button-change-cover"
            >
              <Upload className="w-4 h-4 mr-2" />
              Change Cover
            </Button>
          </label>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRemove}
            data-testid="button-remove-cover"
          >
            <X className="w-4 h-4 mr-2" />
            Remove
          </Button>
        </div>
        <input
          id="cover-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
        />
      </div>
    );
  }

  return (
    <div
      className={`aspect-video rounded-lg border-2 border-dashed flex flex-col items-center justify-center transition-colors ${
        isDragging ? "border-primary bg-primary/5" : "border-border"
      }`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      data-testid="dropzone-cover-upload"
    >
      {isUploading ? (
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Uploading...</p>
        </div>
      ) : (
        <>
          <Upload className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop an image, or click to browse
          </p>
          <label htmlFor="cover-upload">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => document.getElementById("cover-upload")?.click()}
              data-testid="button-upload-cover"
            >
              Choose File
            </Button>
          </label>
          <input
            id="cover-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
          />
        </>
      )}
    </div>
  );
}
