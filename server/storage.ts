import { type Image, type InsertImage } from "@shared/schema";

export interface IStorage {
  getImages(): Promise<Image[]>;
  getImage(id: string): Promise<Image | undefined>;
  createImage(image: InsertImage): Promise<Image>;
  deleteImage(id: string): Promise<boolean>;
}

class MemoryStorage implements IStorage {
  private images: Map<string, Image> = new Map();

  async getImages(): Promise<Image[]> {
    return Array.from(this.images.values()).sort((a, b) => 
      new Date(b.uploadedAt || 0).getTime() - new Date(a.uploadedAt || 0).getTime()
    );
  }

  async getImage(id: string): Promise<Image | undefined> {
    return this.images.get(id);
  }

  async createImage(insertImage: InsertImage): Promise<Image> {
    const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const image: Image = {
      id,
      filename: insertImage.filename,
      originalName: insertImage.originalName,
      mimeType: insertImage.mimeType,
      size: insertImage.size,
      category: insertImage.category || "landscape",
      userId: insertImage.userId || null,
      uploadedAt: new Date(),
    };
    this.images.set(id, image);
    return image;
  }

  async deleteImage(id: string): Promise<boolean> {
    return this.images.delete(id);
  }
}

export const storage = new MemoryStorage();
