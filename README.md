# create-bun-stack

<div align="center">
  <pre>
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║        ██████╗ ██╗   ██╗███╗   ██╗                            ║
║        ██╔══██╗██║   ██║████╗  ██║                            ║
║        ██████╔╝██║   ██║██╔██╗ ██║                            ║
║        ██╔══██╗██║   ██║██║╚██╗██║                            ║
║        ██████╔╝╚██████╔╝██║ ╚████║                            ║
║        ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝                            ║
║                                                               ║
║        ███████╗████████╗ █████╗  ██████╗██╗  ██╗              ║
║        ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝              ║
║        ███████╗   ██║   ███████║██║     █████╔╝               ║
║        ╚════██║   ██║   ██╔══██║██║     ██╔═██╗               ║
║        ███████║   ██║   ██║  ██║╚██████╗██║  ██╗              ║
║        ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  </pre>
  
  <h3>🚀 The Rails of the JavaScript world, powered by Bun</h3>
  
  <p>
    <a href="https://bun.sh"><img src="https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white" alt="Bun"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"></a>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind"></a>
  </p>
</div>

<div align="center">
  <p><strong>Build production-ready fullstack apps in seconds, not hours.</strong></p>
  <p>Created by Jasen Carroll with Claude Code • Inspired by Rails & Bun</p>
</div>

---

## 🎯 Quick Start

```bash
# Using bun create 
bun create bun-stack my-app

# Or using bunx/npx directly
bunx create-bun-stack my-app

# Or from GitHub directly
bun create jasencarroll/create-bun-stack my-app
```

**That's it!** Your fullstack app is running at `http://localhost:3000` 🎉

## 🤔 Why create-bun-stack?

**Missing that Rails feeling in modern JavaScript?** We were too. So we built the generator that brings Rails-like productivity to the Bun ecosystem.

### ⚡ Bun + Rails Philosophy = Developer Happiness

- **Convention over Configuration** - Stop bikeshedding, start shipping
- **Batteries Included** - Auth, database, testing, styling - it's all there
- **Zero Config** - Works out of the box with sensible defaults
- **Type Safety** - Full TypeScript with proper types everywhere
- **Lightning Fast** - Powered by Bun's blazing fast runtime

## 📊 How It Compares

| Feature         | create-bun-stack | create-react-app | Next.js       | Vite             |
| --------------- | ---------------- | ---------------- | ------------- | ---------------- |
| **Fullstack**   | ✅ Built-in      | ❌ Frontend only | ✅ API routes | ❌ Frontend only |
| **Database**    | ✅ Configured    | ❌ DIY           | ❌ DIY        | ❌ DIY           |
| **Auth**        | ✅ JWT ready     | ❌ DIY           | ❌ DIY        | ❌ DIY           |
| **Testing**     | ✅ Integrated    | ✅ Jest          | ✅ Jest       | ✅ Vitest        |
| **Type Safety** | ✅ End-to-end    | ⚠️ Frontend only | ✅ Good       | ✅ Good          |
| **Performance** | 🚀 Bun speed     | 🐌 Webpack       | 🏃 Fast       | 🏃 Fast          |
| **Setup Time**  | ⚡ < 30s         | 😴 2-3 min       | 😴 1-2 min    | ⚡ < 1 min       |

## ✨ Features

### 🏗️ Fullstack Architecture

```typescript
// API endpoint with type safety
export const users = {
  "/:id": {
    GET: async (req: Request & { params: { id: string } }) => {
      const user = await db.users.findById(req.params.id);
      return Response.json(user);
    }
  }
};

// React component with data fetching
function UserProfile({ id }: { id: string }) {
  const { data: user } = useQuery({
    queryKey: ['user', id],
    queryFn: () => fetch(`/api/users/${id}`).then(r => r.json())
  });

  return <div>Welcome, {user?.name}!</div>;
}
```

### 🔐 Authentication Built-in

```typescript
// Register a new user
const { token, user } = await auth.register({
  email: "user@example.com",
  password: "secure123",
});

// Protected routes just work
const protectedRoute = withAuth(async (req, user) => {
  return Response.json({ message: `Hello ${user.name}!` });
});
```

### 🗄️ Dual Database Support

```typescript
// Works with PostgreSQL in production
DATABASE_URL = "postgresql://...";

// Falls back to SQLite for local dev
// Just works - no config needed!
```

### 🧪 Testing That Actually Works

```typescript
// Real integration tests, no mocks needed
test("creates a user", async () => {
  const response = await fetch("http://localhost:3000/api/users", {
    method: "POST",
    body: JSON.stringify({ name: "Test User" }),
  });

  expect(response.status).toBe(201);
});
```

### 🛡️ Security First

- ✅ CSRF Protection
- ✅ Secure Headers (CSP, HSTS, etc.)
- ✅ Input Validation with Zod
- ✅ SQL Injection Protection via Drizzle ORM
- ✅ Bcrypt Password Hashing

### 🎨 Modern Frontend Stack

- **React 18** with Suspense & Error Boundaries
- **React Router** for client-side routing
- **Tailwind CSS** for styling
- **React Query** for server state
- **TypeScript** everywhere

### 🚀 Developer Experience

- **Hot Reload** - See changes instantly
- **Type Safety** - Catch errors at compile time
- **File-based Routing** - Intuitive API structure
- **Auto-imports** - Bun handles your imports
- **Built-in Formatter** - Prettier & Biome configured

## 📦 What's Included

```
my-app/
├── src/
│   ├── app/           # React frontend
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── main.tsx
│   ├── server/        # Bun backend
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── index.ts
│   ├── db/            # Database layer
│   │   ├── schema.ts
│   │   ├── seed.ts
│   │   └── repositories/
│   └── lib/           # Shared utilities
├── public/            # Static assets
├── tests/             # Test files
└── package.json       # One file to rule them all
```

## 🚦 Commands

```bash
bun run dev        # Start development server
bun test          # Run tests
bun run build     # Build for production
bun run db:push   # Sync database schema
bun run db:seed   # Seed database
bun run check     # Type check, lint, format
```

## 🌍 Deployment

Deploy anywhere Bun runs:

- **Railway** - One click deploy
- **Fly.io** - Edge deployments
- **Docker** - Containerize with Bun's official image
- **VPS** - Any Linux server with Bun installed

```dockerfile
FROM oven/bun:1
COPY . .
RUN bun install
EXPOSE 3000
CMD ["bun", "run", "src/server/index.ts"]
```

## 🤝 Contributing

We love contributions! Check out our [Contributing Guide](CONTRIBUTING.md) to get started.

```bash
# Fork and clone
git clone https://github.com/yourusername/create-bun-stack
cd create-bun-app

# Install dependencies
bun install

# Make your changes
bun run test

# Submit a PR!
```

## 📚 Documentation

- [CLAUDE.md](CLAUDE.md) - Implementation details

## 🐛 Troubleshooting

<details>
<summary><strong>Port 3000 already in use?</strong></summary>

```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 bun run dev
```

</details>

<details>
<summary><strong>Database connection issues?</strong></summary>

```bash
# For PostgreSQL issues
psql -U postgres -c "CREATE DATABASE myapp_dev;"

# Or just use SQLite (automatic fallback)
rm .env  # Remove DATABASE_URL
bun run dev
```

</details>

<details>
<summary><strong>Tests failing with "fetch undefined"?</strong></summary>

Make sure your server is running:

```bash
# In one terminal
bun run dev

# In another terminal
bun test
```

</details>


## 📄 License

MIT © Jasen Carroll

---

<div align="center">
  <p>Built with ❤️ by developers, for developers</p>
  <p>
    <a href="https://github.com/jasencarroll/create-bun-stack">Star on GitHub</a> •
    <a href="https://twitter.com/bunjavascript">Follow Bun</a> •
    <a href="https://bun.sh/discord">Join Discord</a>
  </p>
</div>
