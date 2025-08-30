import express, { type Express, type Request, type Response, type NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import multer from "multer";
import path from "path";
import fs from "fs";
import { insertImageSchema } from "@shared/schema";
import { createClient } from "@supabase/supabase-js";

interface MulterRequest extends Request {
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

// Initialize Supabase client with service role key for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Configure multer for local file storage with user folders
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const userId = req.headers['x-user-id'] as string;
      const uploadDir = userId ? `uploads/${userId}` : 'uploads/anonymous';
      
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const randomSuffix = Math.round(Math.random() * 1E9);
      const fileExtension = path.extname(file.originalname);
      const filename = `${timestamp}-${randomSuffix}${fileExtension}`;
      cb(null, filename);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});


export async function registerRoutes(app: Express): Promise<Server> {

  // Configuration endpoint for client
  app.get("/api/config", (req, res) => {
    res.json({
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    });
  });

  // User management endpoints
  app.post("/api/users", async (req, res) => {
    try {
      const { id, email, fullName, avatarUrl } = req.body;
      
      if (!id || !email) {
        return res.status(400).json({ message: "User ID and email are required" });
      }

      const user = await storage.createUser({
        id,
        email,
        fullName: fullName || null,
        avatarUrl: avatarUrl || null,
      });

      res.json(user);
    } catch (error: any) {
      console.error('Create user error:', error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { email, fullName, avatarUrl } = req.body;
      
      const user = await storage.updateUser(id, {
        email,
        fullName,
        avatarUrl,
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error: any) {
      console.error('Update user error:', error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Serve uploaded images statically
  app.use('/uploads', express.static('uploads'));

  // Get all images
  app.get("/api/images", async (req, res) => {
    try {
      const images = await storage.getImages();
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch images" });
    }
  });

  // Upload images to local storage with user folders
  app.post("/api/images/upload", upload.array('images', 10), async (req: any, res) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const uploadedImages = [];
      
      for (const file of req.files as Express.Multer.File[]) {
        const userId = req.headers['x-user-id'] as string || 'anonymous';

        const imageData = {
          filename: `${userId}/${file.filename}`, // Store relative path only
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          category: determineCategory(file.originalname),
          userId: userId === 'anonymous' ? null : userId
        };

        const validatedData = insertImageSchema.parse(imageData);
        const image = await storage.createImage(validatedData);
        uploadedImages.push(image);
      }

      res.json({ images: uploadedImages });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: "Failed to upload images" });
    }
  });

  // Delete image
  app.delete("/api/images/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const image = await storage.getImage(id);
      
      if (!image) {
        return res.status(404).json({ message: "Image not found" });
      }

      // Delete local file
      const filePath = path.join(process.cwd(), 'uploads', image.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const deleted = await storage.deleteImage(id);
      if (deleted) {
        res.json({ message: "Image deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete image" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete image" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function determineCategory(filename: string): string {
  const name = filename.toLowerCase();
  if (name.includes('portrait') || name.includes('face') || name.includes('person')) {
    return 'portrait';
  }
  if (name.includes('abstract') || name.includes('art')) {
    return 'abstract';
  }
  if (name.includes('nature') || name.includes('flower') || name.includes('tree') || name.includes('animal')) {
    return 'nature';
  }
  return 'landscape';
}
