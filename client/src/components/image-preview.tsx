import { useState, useEffect } from "react";
import { X, Download, Trash2, ChevronLeft, ChevronRight, Calendar, FileImage, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import type { Image } from "@shared/schema";

interface ImagePreviewProps {
  image: Image | null;
  images: Image[];
  isOpen: boolean;
  onClose: () => void;
  onDelete: (imageId: string) => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

export function ImagePreview({ 
  image, 
  images, 
  isOpen, 
  onClose, 
  onDelete, 
  onPrevious, 
  onNext 
}: ImagePreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (image && images.length > 0) {
      const index = images.findIndex(img => img.id === image.id);
      setCurrentIndex(index >= 0 ? index : 0);
    }
  }, [image, images]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, images.length]);

  const handlePrevious = () => {
    if (images.length > 1) {
      const newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
      setCurrentIndex(newIndex);
      onPrevious?.();
    }
  };

  const handleNext = () => {
    if (images.length > 1) {
      const newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
      setCurrentIndex(newIndex);
      onNext?.();
    }
  };

  const handleDownload = () => {
    if (!image) return;
    
    const link = document.createElement('a');
    link.href = `/uploads/${image.filename}`;
    link.download = image.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = () => {
    if (!image) return;
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!image) return;
    onDelete(image.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!image) return null;

  const currentImage = images[currentIndex] || image;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className="max-w-7xl max-h-[95vh] p-0 bg-background/95 backdrop-blur-md border-border/50"
          aria-describedby="image-preview-description"
        >
          <DialogTitle className="sr-only">Image Preview - {currentImage.originalName}</DialogTitle>
          <DialogDescription id="image-preview-description" className="sr-only">
            Full-screen preview of {currentImage.originalName} with image details and actions
          </DialogDescription>
          <div className="flex flex-col lg:flex-row h-full max-h-[95vh]">
            {/* Image Display Area */}
            <div className="flex-1 relative bg-black/20 flex items-center justify-center p-4">
              <Button
                variant="ghost" 
                size="icon"
                onClick={onClose}
                className="absolute top-4 right-4 z-10 bg-black/20 hover:bg-black/40 text-white border-white/20"
                data-testid="button-close-preview"
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Navigation Buttons */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white border-white/20"
                    data-testid="button-previous-image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNext}
                    className="absolute right-16 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white border-white/20"
                    data-testid="button-next-image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}

              <img
                src={`/uploads/${currentImage.filename}`}
                alt={currentImage.originalName}
                className="max-w-full max-h-full object-contain"
                data-testid="img-preview"
              />

              {/* Image Counter */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 text-white px-3 py-1 rounded-full text-sm">
                  {currentIndex + 1} of {images.length}
                </div>
              )}
            </div>

            {/* Image Details Sidebar */}
            <div className="lg:w-80 bg-card border-l p-6 overflow-y-auto">
              <div className="space-y-6">
                {/* Image Title */}
                <div>
                  <h2 className="text-xl font-semibold mb-2 gradient-text" data-testid="text-image-title">
                    {currentImage.originalName}
                  </h2>
                  <Badge variant="secondary" className="capitalize">
                    <FolderOpen className="w-3 h-3 mr-1" />
                    {currentImage.category || 'uncategorized'}
                  </Badge>
                </div>

                <Separator />

                {/* Image Metadata */}
                <div className="space-y-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
                    Details
                  </h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center">
                        <FileImage className="w-4 h-4 mr-2" />
                        Size
                      </span>
                      <span data-testid="text-file-size">{formatFileSize(currentImage.size)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center">
                        <Calendar className="w-4 h-4 mr-2" />
                        Uploaded
                      </span>
                      <span data-testid="text-upload-date">{formatDate(currentImage.uploadedAt)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Type</span>
                      <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                        {currentImage.mimeType}
                      </span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={handleDownload}
                    className="w-full"
                    variant="default"
                    data-testid="button-download-image"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  
                  <Button
                    onClick={handleDelete}
                    variant="destructive"
                    className="w-full"
                    data-testid="button-delete-image"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Image
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Image"
        description={`Are you sure you want to delete "${currentImage.originalName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  );
}