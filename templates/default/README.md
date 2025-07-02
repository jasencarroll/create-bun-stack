# {{projectName}}

A modern fullstack application built with Bun, React, and Drizzle ORM.

## Features

- 🚀 **Bun Runtime** - Fast all-in-one JavaScript runtime
- ⚛️ **React 18** - Modern UI with React Router
- 🗄️ **Dual Database Support** - PostgreSQL primary with SQLite fallback
- 🔐 **Authentication** - JWT-based auth system
- 📦 **Drizzle ORM** - Type-safe database queries
- 🎨 **Tailwind CSS** - Utility-first styling
- 🧪 **Testing** - Bun test runner included

## Getting Started

1. Install dependencies:
   ```bash
   bun install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. Set up the database:
   ```bash
   bun run db:push      # For SQLite (default)
   # OR
   bun run db:push:pg   # For PostgreSQL
   ```

4. (Optional) Seed the database:
   ```bash
   bun run db:seed
   ```

5. Start the development server:
   ```bash
   bun run dev
   ```

## Database Configuration

This app supports both PostgreSQL and SQLite:

- **PostgreSQL** (recommended for production): Set `DATABASE_URL` in your 
  `.env` file
- **SQLite** (automatic fallback): Used when PostgreSQL is unavailable

The app will automatically detect and use the appropriate database.

## Project Structure

- `src/app/` - Frontend React SPA
- `src/server/` - Bun backend API
- `src/db/` - Database layer with Drizzle ORM
- `src/lib/` - Shared utilities and types
- `public/` - Static assets

## Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun test` - Run tests
- `bun run db:push` - Push database schema
- `bun run db:studio` - Open Drizzle Studio
- `bun run db:seed` - Seed database with sample data