import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, desc } from "drizzle-orm";
import { type Image, type InsertImage, type User, type InsertUser, images, users } from "@shared/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

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

class DatabaseStorage implements IStorage {
  // User methods
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Image methods
  async getImages(): Promise<Image[]> {
    return await db.select().from(images).orderBy(desc(images.uploadedAt));
  }

  async getImage(id: string): Promise<Image | undefined> {
    const [image] = await db.select().from(images).where(eq(images.id, id));
    return image;
  }

  async createImage(insertImage: InsertImage): Promise<Image> {
    const [image] = await db.insert(images).values(insertImage).returning();
    return image;
  }

  async deleteImage(id: string): Promise<boolean> {
    const result = await db.delete(images).where(eq(images.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
