import { useState } from "react";
import { Button } from "./button";
import { UploadCloud, Loader2 } from "lucide-react";

interface UploadButtonProps {
  onUpload: (url: string) => void;
}

// In a real app, this would upload to an actual service
// For the purpose of this demo, we'll simulate with placeholder URLs
export function UploadButton({ onUpload }: UploadButtonProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);

      // In a real implementation, we would upload the file to a server
      // For this demo, we'll simulate with a placeholder URL from Unsplash
      // In a production app, remove this simulation and implement actual uploads
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate upload time

      // Use a placeholder image from Unsplash
      const placeholderUrls = [
        "https://images.unsplash.com/photo-1612805232759-9a3d09c78ab7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1506126613408-eca07ce68773?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1596436889106-be35e843f974?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        "https://images.unsplash.com/photo-1528825871115-3581a5387919?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80"
      ];
      
      const randomUrl = placeholderUrls[Math.floor(Math.random() * placeholderUrls.length)];
      onUpload(randomUrl);
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
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
