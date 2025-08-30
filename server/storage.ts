import { type Image, type InsertImage, type User, type InsertUser } from "@shared/schema";

export interface IStorage {
  // User methods
  createUser(user: InsertUser): Promise<User>;
  getUser(id: string): Promise<User | undefined>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Image methods
  getImages(): Promise<Image[]>;
  getImage(id: string): Promise<Image | undefined>;
  createImage(image: InsertImage): Promise<Image>;
  deleteImage(id: string): Promise<boolean>;
}

class MemoryStorage implements IStorage {
  private users = new Map<string, User>();
  private images = new Map<string, Image>();

  // User methods
  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: insertUser.id,
      email: insertUser.email,
      fullName: insertUser.fullName ?? null,
      avatarUrl: insertUser.avatarUrl ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser: User = {
      ...existingUser,
      ...updateData,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Image methods
  async getImages(): Promise<Image[]> {
    const imageList = Array.from(this.images.values());
    return imageList.sort((a, b) => new Date(b.uploadedAt!).getTime() - new Date(a.uploadedAt!).getTime());
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
      category: insertImage.category ?? null,
      userId: insertImage.userId ?? null,
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
