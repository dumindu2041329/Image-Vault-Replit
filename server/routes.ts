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

// Ensure the images bucket exists
async function ensureImagesBucket() {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const imagesBucket = buckets?.find(bucket => bucket.name === 'images');
    
    if (!imagesBucket) {
      // Create the bucket
      const { data, error: createError } = await supabase.storage.createBucket('images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 10485760 // 10MB
      });

      if (createError) {
        console.error('Error creating images bucket:', createError);
      } else {
        console.log('Images bucket created successfully');
      }
    }
  } catch (error) {
    console.error('Error ensuring images bucket:', error);
  }
}

// Initialize bucket on startup
ensureImagesBucket();

// Configure multer for memory storage (files will be uploaded to Supabase)
const upload = multer({
  storage: multer.memoryStorage(),
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

  // Images are now served from Supabase storage - no local static serving needed

  // Get all images
  app.get("/api/images", async (req, res) => {
    try {
      const images = await storage.getImages();
      res.json(images);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch images" });
    }
  });

  // Upload images to Supabase storage with user UID folders
  app.post("/api/images/upload", upload.array('images', 10), async (req: any, res) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const uploadedImages = [];
      
      for (const file of req.files as Express.Multer.File[]) {
        const userId = req.headers['x-user-id'] as string || 'anonymous';
        
        // Generate unique filename for Supabase storage
        const timestamp = Date.now();
        const randomSuffix = Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        const filename = `${timestamp}-${randomSuffix}${fileExtension}`;
        const filePath = `${userId}/${filename}`;

        // Upload to Supabase Storage
        const { data, error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false
          });

        if (uploadError) {
          console.error('Supabase upload error:', uploadError);
          throw new Error(`Failed to upload ${file.originalname}: ${uploadError.message}`);
        }

        // Get public URL for the uploaded image
        const { data: urlData } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        const imageData = {
          filename: urlData.publicUrl, // Store Supabase public URL
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

      // Extract file path from Supabase URL for deletion
      // image.filename is now a Supabase public URL, extract the path
      try {
        const url = new URL(image.filename);
        const pathParts = url.pathname.split('/');
        // URL format: /storage/v1/object/public/images/{userId}/{filename}
        const filePath = pathParts.slice(6).join('/'); // Get userId/filename part
        
        if (filePath) {
          // Delete from Supabase Storage
          const { error: deleteError } = await supabase.storage
            .from('images')
            .remove([filePath]);

          if (deleteError) {
            console.error('Supabase delete error:', deleteError);
          }
        }
      } catch (urlError) {
        console.error('Error parsing image URL for deletion:', urlError);
      }

      const deleted = await storage.deleteImage(id);
      if (deleted) {
        res.json({ message: "Image deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete image" });
      }
    } catch (error) {
      console.error('Delete error:', error);
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
