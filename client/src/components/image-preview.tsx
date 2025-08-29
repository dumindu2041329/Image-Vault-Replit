import { useState, useEffect } from "react";
import { X, Download, Trash2, ChevronLeft, ChevronRight, Calendar, FileImage, FolderOpen, Info, ZoomIn, Share2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
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
          className="max-w-[98vw] max-h-[98vh] p-0 bg-black/95 border-gray-800"
          aria-describedby="image-preview-description"
        >
          <DialogTitle className="sr-only">Image Preview - {currentImage.originalName}</DialogTitle>
          <DialogDescription id="image-preview-description" className="sr-only">
            Full-screen preview of {currentImage.originalName} with image details and actions
          </DialogDescription>
          
          {/* Full Screen Image View */}
          <div className="relative w-full h-[98vh] bg-black flex">
            {/* Top Control Bar */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-6">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="bg-white/20 text-white border-none">
                      <FolderOpen className="w-3 h-3 mr-1" />
                      {currentImage.category || 'uncategorized'}
                    </Badge>
                    {images.length > 1 && (
                      <Badge variant="secondary" className="bg-white/20 text-white border-none">
                        {currentIndex + 1} of {images.length}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost" 
                    size="icon"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
                    data-testid="button-zoom-image"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost" 
                    size="icon"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
                    data-testid="button-share-image"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost" 
                    size="icon"
                    onClick={onClose}
                    className="bg-white/10 hover:bg-red-500/80 text-white border-white/20 backdrop-blur-sm transition-colors"
                    data-testid="button-close-preview"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Main Image Area */}
            <div className="flex-1 relative flex items-center justify-center p-8 pt-24 pb-24">
              {/* Navigation Buttons */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handlePrevious}
                    className="absolute left-6 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white border-white/20 backdrop-blur-sm h-12 w-12 rounded-full"
                    data-testid="button-previous-image"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNext}
                    className="absolute right-6 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white border-white/20 backdrop-blur-sm h-12 w-12 rounded-full"
                    data-testid="button-next-image"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}

              <img
                src={`/uploads/${currentImage.filename}`}
                alt={currentImage.originalName}
                className="max-w-full max-h-full object-contain drop-shadow-2xl"
                data-testid="img-preview"
              />
            </div>

            {/* Bottom Info Panel */}
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 to-transparent p-6">
              <Card className="bg-white/10 backdrop-blur-md border-white/20 text-white">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Image Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h2 className="text-2xl font-semibold mb-2 text-white" data-testid="text-image-title">
                            {currentImage.originalName}
                          </h2>
                          <div className="flex items-center space-x-4 text-sm text-gray-300">
                            <div className="flex items-center space-x-1">
                              <FileImage className="w-4 h-4" />
                              <span data-testid="text-file-size">{formatFileSize(currentImage.size)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span data-testid="text-upload-date">{formatDate(currentImage.uploadedAt)}</span>
                            </div>
                            <Badge variant="secondary" className="bg-white/20 text-white border-none">
                              {currentImage.mimeType}
                            </Badge>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost" 
                          size="icon"
                          className="bg-white/10 hover:bg-pink-500/80 text-white border-white/20 backdrop-blur-sm transition-colors"
                          data-testid="button-favorite-image"
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-3">
                      <Button
                        onClick={handleDownload}
                        variant="secondary"
                        className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                        data-testid="button-download-image"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      
                      <Button
                        onClick={handleDelete}
                        variant="destructive"
                        className="bg-red-600/80 hover:bg-red-600 border-red-500/50 backdrop-blur-sm"
                        data-testid="button-delete-image"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
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