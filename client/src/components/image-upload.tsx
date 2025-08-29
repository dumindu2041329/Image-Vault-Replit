import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface UploadProgress {
  fileName: string;
  progress: number;
}

export function ImageUpload() {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const formData = new FormData();
      files.forEach(file => {
        formData.append('images', file);
      });

      const response = await apiRequest('POST', '/api/images/upload', formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/images'] });
      setUploadProgress([]);
      toast({
        title: "Upload successful",
        description: "Your images have been uploaded successfully.",
      });
    },
    onError: () => {
      setUploadProgress([]);
      toast({
        title: "Upload failed",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Validate files
    const validFiles = acceptedFiles.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file.`,
          variant: "destructive",
        });
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    // Initialize progress tracking
    setUploadProgress(
      validFiles.map(file => ({
        fileName: file.name,
        progress: 0,
      }))
    );

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => 
        prev.map(item => ({
          ...item,
          progress: Math.min(item.progress + Math.random() * 20, 90)
        }))
      );
    }, 200);

    uploadMutation.mutate(validFiles, {
      onSettled: () => {
        clearInterval(progressInterval);
      }
    });
  }, [uploadMutation, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const clearProgress = () => {
    setUploadProgress([]);
  };

  return (
    <section className="mb-12">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold mb-4 gradient-text">Manage Your Images</h2>
        <p className="text-muted-foreground text-lg">Upload, organize, and showcase your visual content with style</p>
      </div>

      <div
        {...getRootProps()}
        className={`upload-zone rounded-lg p-12 text-center bg-card hover:bg-muted/50 transition-colors cursor-pointer ${
          isDragActive ? 'dragover border-primary bg-primary/5' : ''
        }`}
        data-testid="upload-zone"
      >
        <input {...getInputProps()} data-testid="input-file-upload" />
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center">
            <CloudUpload className="text-white text-2xl" />
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-2">
              {isDragActive ? "Drop your images here" : "Drop your images here"}
            </h3>
            <p className="text-muted-foreground">
              or <span className="text-primary font-medium">browse files</span> to upload
            </p>
            <p className="text-sm text-muted-foreground mt-2">Supports PNG, JPG, GIF up to 10MB</p>
          </div>
        </div>
      </div>

      {uploadProgress.length > 0 && (
        <div className="mt-6 bg-card rounded-lg p-4 border" data-testid="upload-progress">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium">Uploading images...</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearProgress}
              data-testid="button-clear-progress"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="space-y-3">
            {uploadProgress.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="truncate">{item.fileName}</span>
                  <span className="text-muted-foreground">{Math.round(item.progress)}%</span>
                </div>
                <Progress value={item.progress} className="h-2" />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
