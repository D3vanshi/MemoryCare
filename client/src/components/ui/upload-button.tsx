import { useState } from "react";
import { Button } from "./button";
import { UploadCloud, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadButtonProps {
  onUpload: (url: string) => void;
}

export function UploadButton({ onUpload }: UploadButtonProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image under 2MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // For demo purposes, we'll create a data URL from the file
      // This keeps the image on the client side without requiring a backend service
      const reader = new FileReader();
      
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          onUpload(event.target.result);
          setUploading(false);
        }
      };
      
      reader.onerror = () => {
        toast({
          title: "Upload failed",
          description: "There was an error processing your image",
          variant: "destructive",
        });
        setUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload failed:", error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your image",
        variant: "destructive",
      });
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {uploading ? (
              <Loader2 className="w-8 h-8 mb-3 text-gray-400 animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />
            )}
            <p className="mb-2 text-sm text-gray-500">
              {uploading ? "Uploading..." : "Click to upload or drag and drop"}
            </p>
            <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF (MAX. 2MB)</p>
          </div>
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleUpload}
            accept="image/*"
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}
