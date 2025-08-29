import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, Trash2, Grid3X3, List, CheckSquare, Square, X, Calendar, FileImage, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ImagePreview } from "@/components/image-preview";
import { ImageSearch } from "@/components/image-search";
import { ConfirmationDialog } from "@/components/confirmation-dialog";
import type { Image } from "@shared/schema";

interface ImageGalleryProps {
  images: Image[];
}

const categories = ["All", "Landscape", "Portrait", "Abstract", "Nature"];

export function ImageGallery() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewImage, setPreviewImage] = useState<Image | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    onConfirm: () => {}
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: images = [], isLoading } = useQuery<Image[]>({
    queryKey: ['/api/images'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (imageId: string) => {
      await apiRequest('DELETE', `/api/images/${imageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/images'] });
      toast({
        title: "Image deleted",
        description: "The image has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete the image. Please try again.",
        variant: "destructive",
      });
    }
  });

  const filteredImages = useMemo(() => {
    return images.filter(image => {
      const matchesCategory = selectedCategory === "All" || 
        image.category?.toLowerCase() === selectedCategory.toLowerCase();
      
      const matchesSearch = !searchQuery || 
        image.originalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.category?.toLowerCase().includes(searchQuery.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });
  }, [images, selectedCategory, searchQuery]);

  const formatFileSize = (bytes: number) => {
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDelete = (imageId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Image",
      description: "Are you sure you want to delete this image? This action cannot be undone.",
      onConfirm: () => deleteMutation.mutate(imageId)
    });
  };

  const handleImageView = (image: Image) => {
    setPreviewImage(image);
    setIsPreviewOpen(true);
  };

  const handlePreviewClose = () => {
    setIsPreviewOpen(false);
    setPreviewImage(null);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedImages(new Set());
  };

  const toggleImageSelection = (imageId: string) => {
    const newSelection = new Set(selectedImages);
    if (newSelection.has(imageId)) {
      newSelection.delete(imageId);
    } else {
      newSelection.add(imageId);
    }
    setSelectedImages(newSelection);
  };

  const selectAllImages = () => {
    setSelectedImages(new Set(filteredImages.map(img => img.id)));
  };

  const deselectAllImages = () => {
    setSelectedImages(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedImages.size === 0) return;
    
    setConfirmDialog({
      isOpen: true,
      title: "Delete Multiple Images",
      description: `Are you sure you want to delete ${selectedImages.size} selected images? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          // Delete images one by one
          for (const imageId of Array.from(selectedImages)) {
            await apiRequest('DELETE', `/api/images/${imageId}`);
          }
          
          queryClient.invalidateQueries({ queryKey: ['/api/images'] });
          setSelectedImages(new Set());
          setSelectionMode(false);
          
          toast({
            title: "Images deleted",
            description: `Successfully deleted ${selectedImages.size} images.`,
          });
        } catch (error) {
          toast({
            title: "Delete failed", 
            description: "Failed to delete some images. Please try again.",
            variant: "destructive",
          });
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg border animate-pulse">
            <div className="aspect-[4/3] bg-muted rounded-t-lg"></div>
            <div className="p-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Gallery Stats and Filters */}
      <section className="mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h3 className="text-2xl font-bold mb-1">Your Gallery</h3>
            <p className="text-muted-foreground" data-testid="text-image-count">
              {filteredImages.length} of {images.length} images 
              {searchQuery && ` matching "${searchQuery}"`}
              {selectedCategory !== "All" && ` in ${selectedCategory.toLowerCase()}`}
            </p>
          </div>

          {/* Search Bar */}
          <ImageSearch 
            onSearch={handleSearch}
            placeholder="Search by name or category..."
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-6">
          {/* Bulk Operations */}
          <div className="flex items-center gap-3">
            <Button
              variant={selectionMode ? "default" : "outline"}
              size="sm"
              onClick={toggleSelectionMode}
              data-testid="button-selection-mode"
            >
              {selectionMode ? <X className="h-4 w-4 mr-2" /> : <CheckSquare className="h-4 w-4 mr-2" />}
              {selectionMode ? "Cancel" : "Select"}
            </Button>
            
            {selectionMode && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllImages}
                  data-testid="button-select-all"
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deselectAllImages}
                  data-testid="button-deselect-all"
                >
                  Deselect All
                </Button>
                {selectedImages.size > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" data-testid="badge-selected-count">
                      {selectedImages.size} selected
                    </Badge>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      data-testid="button-bulk-delete"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Selected
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex bg-muted rounded-lg p-1">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCategory === category 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  data-testid={`button-filter-${category.toLowerCase()}`}
                >
                  {category}
                </Button>
              ))}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
                data-testid="button-view-grid"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
                data-testid="button-view-list"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Image Gallery */}
      {filteredImages.length === 0 ? (
        <div className="text-center py-12" data-testid="empty-gallery">
          <p className="text-muted-foreground text-lg">
            {selectedCategory === "All" 
              ? "No images in your gallery yet. Upload some images to get started!" 
              : `No ${selectedCategory.toLowerCase()} images found.`
            }
          </p>
        </div>
      ) : (
        <section 
          className={
            viewMode === "grid" 
              ? "masonry-grid" 
              : "space-y-4"
          }
          data-testid="image-gallery"
        >
          {filteredImages.map((image) => (
            <div 
              key={image.id} 
              className={`${viewMode === "grid" ? "masonry-item" : ""} relative`}
            >
              {viewMode === "grid" ? (
                <>
                  {/* Selection Checkbox for Grid View */}
                  {selectionMode && (
                    <div className="absolute top-2 left-2 z-10">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleImageSelection(image.id)}
                        className={`p-1 h-8 w-8 rounded-md ${
                          selectedImages.has(image.id) 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-white/80 text-gray-700 hover:bg-white"
                        }`}
                        data-testid={`button-select-${image.id}`}
                      >
                        {selectedImages.has(image.id) ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}

                  <div className={`bg-card rounded-lg overflow-hidden border hover-scale group relative ${
                    selectedImages.has(image.id) ? "ring-2 ring-primary" : ""
                  }`}>
                    <img 
                      src={`/uploads/${image.filename}`}
                      alt={image.originalName}
                      className="w-full h-auto"
                      loading="lazy"
                      data-testid={`img-${image.id}`}
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex space-x-2">
                        <Button
                          size="icon"
                          variant="secondary"
                          className="bg-white text-gray-700 hover:bg-gray-100 shadow-lg"
                          onClick={() => handleImageView(image)}
                          data-testid={`button-view-${image.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="shadow-lg"
                          onClick={() => handleDelete(image.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${image.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-muted-foreground" data-testid={`text-info-${image.id}`}>
                        {image.category} • {formatFileSize(image.size)}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                /* Detailed List View */
                <div className={`bg-card rounded-lg border p-4 hover:bg-accent/5 transition-colors ${
                  selectedImages.has(image.id) ? "ring-2 ring-primary bg-primary/5" : ""
                }`}>
                  <div className="flex items-center space-x-4">
                    {/* Selection Checkbox for List View */}
                    {selectionMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleImageSelection(image.id)}
                        className={`p-1 h-8 w-8 rounded-md ${
                          selectedImages.has(image.id) 
                            ? "bg-primary text-primary-foreground" 
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                        data-testid={`button-select-${image.id}`}
                      >
                        {selectedImages.has(image.id) ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    )}

                    {/* Thumbnail */}
                    <div className="flex-shrink-0">
                      <img 
                        src={`/uploads/${image.filename}`}
                        alt={image.originalName}
                        className="w-16 h-16 rounded-lg object-cover border"
                        loading="lazy"
                        data-testid={`img-${image.id}`}
                      />
                    </div>

                    {/* Image Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className="text-sm font-medium text-foreground truncate mb-1">
                            {image.originalName}
                          </h4>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <FolderOpen className="h-3 w-3" />
                              <span className="capitalize">{image.category || 'uncategorized'}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <FileImage className="h-3 w-3" />
                              <span>{formatFileSize(image.size)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{image.uploadedAt ? new Date(image.uploadedAt).toLocaleDateString() : 'Unknown'}</span>
                            </div>
                          </div>
                          <div className="mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {image.mimeType}
                            </Badge>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleImageView(image)}
                            className="text-muted-foreground hover:text-foreground"
                            data-testid={`button-view-${image.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(image.id)}
                            disabled={deleteMutation.isPending}
                            className="text-muted-foreground hover:text-destructive"
                            data-testid={`button-delete-${image.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Image Preview Modal */}
      <ImagePreview
        image={previewImage}
        images={filteredImages}
        isOpen={isPreviewOpen}
        onClose={handlePreviewClose}
        onDelete={handleDelete}
      />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </>
  );
}
