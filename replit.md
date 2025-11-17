# Article CMS - Content Management System

## Overview

This is a full-stack article content management system built with React, Express, and PostgreSQL. The application provides a modern admin panel for managing articles, categories, comments, and user interactions. It features a rich text editor powered by TipTap, Firebase Storage integration for image uploads, and a comprehensive database schema for content organization.

The system is designed as a personal CMS similar to Sanity, with a focus on clean UI/UX inspired by Linear, Notion, and modern SaaS admin panels. The architecture supports article creation and editing, category management, commenting with nested replies, and social features like likes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- React Query (TanStack Query) for server state management and API caching

**UI Component System**
- Shadcn/ui component library with Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Custom design system following "New York" style variant
- Theme support with light/dark mode toggle
- Responsive layouts with mobile-first approach

**Rich Text Editing**
- TipTap editor with StarterKit extensions
- Support for images, links, and formatting
- Placeholder extension for better UX
- Custom toolbar for editor controls

**State Management**
- React Query for server state (articles, categories, comments)
- React Hook Form with Zod validation for form handling
- Local state with React hooks for UI state

**Key Architectural Decisions**
- Separation of concerns: UI components in `/components`, pages in `/pages`, utilities in `/lib`
- Centralized API client with error handling
- Type-safe schemas shared between frontend and backend via `/shared` directory
- Custom toast notifications for user feedback

### Backend Architecture

**Server Framework**
- Express.js with TypeScript
- HTTP server for production deployment
- Custom middleware for request logging and JSON parsing

**API Design**
- RESTful API endpoints organized by resource type
- Consistent error handling with appropriate HTTP status codes
- Request validation using Zod schemas
- Response logging for debugging

**Database Layer**
- Drizzle ORM for type-safe database operations
- PostgreSQL as the database (via Neon serverless)
- Schema-first design with migrations support
- Relational data modeling with foreign keys and cascading deletes

**Database Schema**
- Users: Optional authentication support with avatar URLs
- Categories: Unique category names for article organization
- Articles: Core content with title, cover image, rich content, timestamps, and relations
- Comments: Article comments with author attribution
- Replies: Nested comment replies
- Likes: User-article like tracking with unique constraints
- Firebase Settings: Storage configuration

**Key Architectural Decisions**
- ORM choice (Drizzle): Provides type safety and lightweight abstraction over SQL
- Optional user system: Allows future authentication without breaking existing features
- Cascade deletes: Ensures referential integrity (e.g., deleting article removes its comments)
- UUID primary keys: Better for distributed systems and security

### External Dependencies

**Firebase Storage**
- Used for image hosting (cover images and inline editor images)
- Configuration stored in database (firebase_settings table)
- Client-side upload with Firebase SDK
- Settings managed through admin panel

**Database Provider**
- Neon Serverless PostgreSQL
- WebSocket-based connection via `@neondatabase/serverless`
- Connection pooling for performance
- Environment-based configuration via `DATABASE_URL`

**Third-Party UI Libraries**
- Radix UI: Accessible component primitives
- Lucide React: Icon library
- date-fns: Date formatting utilities
- class-variance-authority: Component variant management
- cmdk: Command palette functionality

**Development Tools**
- TypeScript: Static typing across the stack
- ESBuild: Fast production builds for server code
- Drizzle Kit: Database schema management and migrations
- Replit plugins: Development tooling and error overlays

**Key Integration Points**
- Firebase initialization happens client-side based on settings from API
- Image uploads go directly from client to Firebase Storage
- URLs are stored in PostgreSQL (no binary data in database)
- Environment variables required: `DATABASE_URL` for database connection