# {{projectName}}

A modern fullstack application built with Bun, React, and Drizzle ORM.

  <p>
    <a href="https://railway.com/deploy/create-bun-stack?referralCode=2oHJjn"><img src="https://railway.com/button.svg" alt="Deploy on Railway"></a>
  </p>

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

## Troubleshooting

### PWA/Service Worker Errors

If you see errors related to workbox, service workers, or PWA:

- These are likely from cached service workers from other projects
- Open Chrome DevTools > Application > Storage > Clear site data
- Or open the app in an Incognito window

Note: This template does not include PWA functionality. The manifest.json is only for basic web app metadata.

## 🚀 Deployment

### Railway

This project includes Railway deployment configuration:

1. **Push to GitHub** first
2. **Create a new Railway project** from [railway.app](https://railway.app)
3. **Connect your GitHub repo**
4. **Add environment variables** in Railway dashboard (REQUIRED):
   - `JWT_SECRET` - A secure random string (e.g., generate with `openssl rand -hex 32`)
   - `DATABASE_URL` - PostgreSQL connection string (optional, uses SQLite if not provided)
5. **Deploy** - Railway will automatically:
   - Build using the included Dockerfile
   - Detect the exposed port (3000)
   - Generate a public URL like `your-app.up.railway.app`
   - Show the URL in the deployment logs and settings

**Finding your URL:**
- Go to your service's Settings tab in Railway
- Look for the "Domains" section
- Click "Generate Domain" if not already created
- Your app will be available at the generated URL


### Docker

Build and run locally:

```bash
docker build -t {{projectName}} .
docker run -p 3000:3000 -e JWT_SECRET="your-secret-here" {{projectName}}
```

## 🔓 Open-Sourced Leverage

Bun Stack is more than a fullstack starter — it's everything you'd build if you had the time.

- ✅ Security defaults (CSRF, JWT, password hashing)
- ✅ End-to-end TypeScript
- ✅ Auth, routing, DB, CI/CD
- ✅ Docker + 1-click Railway deploy
- ✅ Convention-driven structure
No yak shaving. No config hell. No architecture debates.

Just code. Just ship.

---

### Built by [Jasen](https://jasenc.dev)  

Engineer. Systems thinker. MBA. ADHD-fueled DX evangelist.
I built Bun Stack to democratize the leverage that took me 15 years to earn.
Now it’s yours. Just ship.
