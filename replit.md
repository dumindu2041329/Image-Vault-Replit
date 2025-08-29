# ImageVault

## Overview

ImageVault is a modern full-stack image management platform built with React, TypeScript, Express, and PostgreSQL. The application allows users to upload, organize, and showcase visual content with a sleek, responsive interface featuring both light and dark themes. The project follows a monorepo structure with shared TypeScript schemas and clear separation between client and server concerns.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack React Query for server state and React Context for client state (theme)
- **Routing**: Wouter for lightweight client-side routing
- **File Uploads**: React-dropzone for drag-and-drop file handling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints with structured error handling
- **File Handling**: Multer middleware for multipart file uploads with validation
- **Development**: Hot reload with Vite integration in development mode

### Data Layer
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Data Validation**: Zod schemas for runtime type checking
- **Storage Strategy**: Dual approach with in-memory storage for development and PostgreSQL for production

### Authentication & Session Management
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **User Management**: Username/password authentication with secure password handling

### File Storage
- **Local Storage**: File system storage in `/uploads` directory
- **Static Serving**: Express static middleware for image serving
- **File Validation**: MIME type checking and size limits (10MB max)
- **Naming Strategy**: Timestamp-based unique filenames to prevent conflicts

### Development & Build
- **Build System**: Vite for client bundling, esbuild for server compilation
- **Development Setup**: Concurrent client/server development with proxy configuration
- **Type Safety**: Shared TypeScript schemas between client and server
- **Hot Reload**: Full-stack development with automatic reload capabilities

## External Dependencies

### Database & ORM
- **Neon Database**: Serverless PostgreSQL database provider
- **Drizzle ORM**: Type-safe SQL toolkit and query builder
- **connect-pg-simple**: PostgreSQL session store for Express

### UI & Styling
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library with consistent design
- **Class Variance Authority**: Type-safe variant styling utility

### Frontend Libraries
- **TanStack React Query**: Server state management and caching
- **React Hook Form**: Form handling with validation
- **Wouter**: Lightweight client-side routing
- **React Dropzone**: File upload with drag-and-drop interface

### Backend Libraries
- **Express.js**: Web application framework
- **Multer**: Middleware for handling multipart/form-data
- **Express Session**: Session middleware for user management

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking
- **ESBuild**: Fast JavaScript bundler for production builds
- **TSX**: TypeScript execution for development