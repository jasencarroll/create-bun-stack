# CLAUDE.md - Complete Project Documentation

This document contains comprehensive documentation about the create-bun-stack project, including architecture decisions, implementation details, and guidelines for future development.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Design Decisions](#architecture--design-decisions)
3. [CLI Generator Implementation](#cli-generator-implementation)
4. [Testing Strategy](#testing-strategy)
5. [Security Implementation](#security-implementation)
6. [Database Architecture](#database-architecture)
7. [Build System](#build-system)
8. [Common Development Tasks](#common-development-tasks)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Performance Optimizations](#performance-optimizations)
11. [Deployment Considerations](#deployment-considerations)

## Project Overview

create-bun-stack is a Rails-inspired fullstack application generator for Bun. It generates a complete, production-ready application with:

- **Frontend**: React 18 with TypeScript, React Router, and Tailwind CSS
- **Backend**: Bun.serve() with file-based routing and middleware
- **Database**: Drizzle ORM with PostgreSQL primary and SQLite fallback
- **Authentication**: JWT-based auth with secure password hashing
- **Testing**: Integration tests using Bun's built-in test runner
- **Security**: CSRF protection, secure headers, input validation

### Key Philosophy

Following Rails' "Convention over Configuration" principle, we make opinionated choices that allow developers to be productive immediately while maintaining flexibility for customization.

## Architecture & Design Decisions

### 1. **Bun-First Approach**

We leverage Bun's built-in capabilities wherever possible:

```typescript
// Use Bun.serve() instead of Express
Bun.serve({
  port: 3000,
  fetch: router.fetch,
});

// Use Bun.password instead of bcrypt
const hash = await Bun.password.hash(password);

// Use Bun's built-in test runner
import { test, expect } from "bun:test";
```

### 2. **File-Based API Routing**

Similar to Next.js but simpler:

```typescript
// src/server/routes/users.ts
export const users = {
  "/": {
    GET: getAllUsers,
    POST: createUser,
  },
  "/:id": {
    GET: getUser,
    PUT: updateUser,
    DELETE: deleteUser,
  },
};
```

### 3. **Middleware Architecture**

Middleware runs in a specific order for security and functionality:

1. **CORS** - Handle cross-origin requests
2. **Security Headers** - Apply security headers
3. **CSRF Protection** - Validate CSRF tokens
4. **Authentication** - Verify JWT tokens
5. **Route Handler** - Process the request

```typescript
// Middleware composition
const handler = compose(
  corsMiddleware,
  securityHeadersMiddleware,
  csrfMiddleware,
  authMiddleware,
  routeHandler
);
```

### 4. **Dual Database Support**

PostgreSQL for production, SQLite for development:

```typescript
// Automatic detection and fallback
const DATABASE_URL = process.env.DATABASE_URL;
const isPostgres = DATABASE_URL?.startsWith("postgresql://");

export const db = isPostgres ? drizzle(postgres(DATABASE_URL)) : drizzle(new Database("./app.db"));
```

### 5. **Repository Pattern**

Database operations are abstracted into repositories:

```typescript
interface UserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}
```

## CLI Generator Implementation

### Template System

The CLI uses a single-file approach with template literals:

```typescript
const files: Record<string, string> = {
  "src/server/index.ts": `
import { serve } from "bun";
// ... template content
  `,
  // ... more files
};
```

### Template Literal Escaping

When generating files that contain template literals, we escape them:

```typescript
// In the template
const message = \`Hello \${name}\`;

// This prevents interpolation during generation
```

### Project Generation Flow

1. **Check Bun installation** - Prompt to install if missing
2. **Create project structure** - All directories and files
3. **Install dependencies** - Using `bun install`
4. **Setup database** - Run migrations and optional seed
5. **Build CSS** - Initial Tailwind compilation
6. **Start dev server** - Launch the application

## Testing Strategy

### Integration Testing Approach

We use real HTTP requests against a running server:

```typescript
test("creates a user", async () => {
  const response = await fetch("http://localhost:3000/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Test User" }),
  });

  expect(response.status).toBe(201);
});
```

### Test Isolation

Each test uses unique data to avoid conflicts:

```typescript
const timestamp = Date.now();
const testEmail = `test-${timestamp}@example.com`;
```

### Key Testing Decisions

1. **No mocking fetch** - We removed global fetch mocks that were causing test pollution
2. **Real server required** - Tests expect `bun run dev` to be running
3. **Database cleanup** - Tests clean up after themselves
4. **Parallel execution** - Tests can run concurrently

### Test Organization

```
tests/
├── app/              # Frontend component tests
├── server/           # API endpoint tests
├── db/               # Database layer tests
├── lib/              # Utility function tests
└── helpers.ts        # Shared test utilities
```

## Security Implementation

### CSRF Protection

Double-submit cookie pattern:

1. Server generates CSRF token on login/register
2. Token sent in response body AND as HttpOnly cookie
3. Client includes token in X-CSRF-Token header
4. Server validates token matches cookie

```typescript
// Generate token
const csrfToken = crypto.randomUUID();
const csrfCookie = await Bun.password.hash(csrfToken);

// Validate token
const isValid = await Bun.password.verify(headerToken, cookieToken);
```

### Security Headers

Applied based on content type:

```typescript
// HTML responses get full CSP
"Content-Security-Policy": isDev
  ? "default-src 'self' 'unsafe-inline' 'unsafe-eval';"
  : "default-src 'self'; script-src 'self' 'unsafe-inline';";

// API responses get basic security
"X-Content-Type-Options": "nosniff"
"X-Frame-Options": "DENY"
```

### Authentication Flow

1. **Registration** - Hash password, create user, generate JWT
2. **Login** - Verify password, generate JWT and CSRF token
3. **Protected Routes** - Validate JWT, check CSRF for mutations
4. **Logout** - Clear CSRF token (JWT remains valid until expiry)

## Database Architecture

### Schema Design

Using Drizzle ORM for type-safe queries:

```typescript
export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
```

### Migration Strategy

- **Development**: Use `drizzle-kit push` for rapid iteration
- **Production**: Use `drizzle-kit generate` for versioned migrations

### Dual Database Queries

Queries work identically for both databases:

```typescript
// Works for both PostgreSQL and SQLite
const users = await db.select().from(usersTable);
```

## Build System

### Development Build

Hot reload with Bun's built-in watcher:

```bash
bun --hot src/server/index.ts
```

### Production Build

1. **CSS Build**: Tailwind processes all styles
2. **Frontend Build**: Bun bundles React app
3. **Server**: Run directly with Bun (no build needed)

```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY . .
RUN bun install --frozen-lockfile
RUN bun run build:css
EXPOSE 3000
CMD ["bun", "src/server/index.ts"]
```

## Common Development Tasks

### Adding a New Model

1. **Define schema** in `src/db/schema.ts`:

```typescript
export const posts = sqliteTable("posts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  title: text("title").notNull(),
  content: text("content"),
  authorId: text("author_id").references(() => users.id),
});
```

2. **Create repository** in `src/db/repositories/`:

```typescript
export class PostRepository {
  async findAll() {
    return db.select().from(posts);
  }
  // ... other methods
}
```

3. **Add routes** in `src/server/routes/posts.ts`:

```typescript
export const posts = {
  "/": {
    GET: async () => {
      const posts = await postRepo.findAll();
      return Response.json(posts);
    },
  },
};
```

4. **Update router** in `src/server/router.ts`

### Adding Authentication to a Route

Use the `requireAuth` middleware:

```typescript
import { requireAuth } from "../middleware/auth";

export const protectedRoute = {
  "/": {
    GET: [
      requireAuth,
      async (req) => {
        const user = req.user; // Set by middleware
        return Response.json({ message: `Hello ${user.name}` });
      },
    ],
  },
};
```

### Adding a New Test

1. Create test file following the naming convention
2. Import test utilities
3. Write integration tests

```typescript
import { test, expect, describe } from "bun:test";

describe("Feature", () => {
  test("does something", async () => {
    const response = await fetch("http://localhost:3000/api/feature");
    expect(response.status).toBe(200);
  });
});
```

## Troubleshooting Guide

### Common Issues

#### 1. **Test Failures: "Cannot read properties of undefined"**

**Cause**: Global fetch was mocked and not restored
**Solution**: We removed fetch mocking from tests

#### 2. **Database Connection Errors**

**PostgreSQL**:

```bash
# Check if PostgreSQL is running
pg_isready

# Create database
createdb myapp_dev
```

**SQLite fallback**:

```bash
# Remove DATABASE_URL to use SQLite
unset DATABASE_URL
```

#### 3. **CSRF Token Mismatch**

**Causes**:

- Cookie not being sent (check SameSite settings)
- Token regenerated (multiple logins)
- Cross-origin request without proper CORS

#### 4. **Port Already in Use**

```bash
# Find process
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Debug Mode

Enable debug logging:

```typescript
// In server/index.ts
const DEBUG = process.env.DEBUG === "true";

if (DEBUG) {
  console.log(`[${req.method}] ${req.url}`);
}
```

## Performance Optimizations

### Bun-Specific Optimizations

1. **Use Bun.write() for file operations**:

```typescript
await Bun.write("file.txt", "content");
```

2. **Leverage Bun's speed**:

- Start time: ~10ms vs 100ms+ for Node.js
- Test execution: 2-3x faster
- Installation: 10x faster than npm

3. **Optimize imports**:

```typescript
// Bun resolves these at compile time
import config from "./config.json";
```

### Database Optimizations

1. **Connection pooling** (PostgreSQL):

```typescript
const sql = postgres(DATABASE_URL, {
  max: 10,
  idle_timeout: 20,
});
```

2. **Prepared statements**:

```typescript
const stmt = db
  .select()
  .from(users)
  .where(eq(users.id, sql.placeholder("id")))
  .prepare();
const user = await stmt.execute({ id: "123" });
```

3. **Indexes**:

```sql
CREATE INDEX idx_users_email ON users(email);
```

### Frontend Optimizations

1. **Code splitting**:

```typescript
const AdminPanel = lazy(() => import("./AdminPanel"));
```

2. **React Query caching**:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});
```

## Deployment Considerations

### Environment Variables

Required for production:

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=<random-string>
PORT=3000
```

### Database Migrations

Run before starting the app:

```bash
bun run db:push
```

### Health Checks

The `/api/health` endpoint returns:

- Server status
- Database connectivity
- Version information

### Monitoring

Recommended tools:

- **Logs**: stdout/stderr (works with any log aggregator)
- **Metrics**: Prometheus-compatible `/metrics` endpoint
- **Errors**: Sentry or similar error tracking

### Scaling Considerations

1. **Horizontal scaling**: App is stateless (except CSRF tokens)
2. **Database**: Consider read replicas for PostgreSQL
3. **Static assets**: Serve via CDN
4. **Sessions**: Move CSRF to Redis for multi-instance

## Bun-Specific Features and Patterns

### Using Bun's Built-in APIs

Always prefer Bun's native APIs over npm packages:

```typescript
// ❌ Don't use external packages
import bcrypt from "bcryptjs";
import { config } from "dotenv";

// ✅ Use Bun's built-ins
const hash = await Bun.password.hash(password);
// .env is loaded automatically
```

### Shell Commands

Use Bun's shell API:

```typescript
import { $ } from "bun";

// Run shell commands
const files = await $`ls -la`.text();

// With error handling
try {
  await $`git commit -m "Update"`;
} catch (error) {
  console.error("Commit failed:", error);
}
```

### WebSockets

Built-in WebSocket support:

```typescript
Bun.serve({
  fetch(req, server) {
    if (server.upgrade(req)) {
      return; // WebSocket upgrade successful
    }
    return new Response("Regular HTTP response");
  },
  websocket: {
    open(ws) {
      ws.send("Connected!");
    },
    message(ws, message) {
      ws.send(`Echo: ${message}`);
    },
  },
});
```

### File Handling

Bun's file API is much faster:

```typescript
// Read file
const file = Bun.file("./data.json");
const data = await file.json();

// Write file
await Bun.write("./output.txt", "Hello World");

// Stream large files
const stream = Bun.file("./large.csv").stream();
```

## Project Maintenance

### Updating Dependencies

```bash
# Check outdated
bunx npm-check-updates

# Update all
bun update

# Update specific
bun update react
```

### Code Quality

The project uses:

- **TypeScript** - Strict mode enabled
- **Biome** - Fast linter and formatter
- **Prettier** - Code formatting
- **Bun test** - Built-in test runner

Run all checks:

```bash
bun run check
```

### Contributing Guidelines

1. **Follow existing patterns** - Consistency is key
2. **Write tests** - All features need tests
3. **Update types** - Keep TypeScript happy
4. **Document changes** - Update relevant docs
5. **Performance matters** - Leverage Bun's speed

## Future Enhancements

Planned improvements:

1. **WebSocket support** - Real-time features
2. **GraphQL option** - Alternative to REST
3. **Service worker** - Offline support
4. **Admin panel** - Auto-generated CRUD UI
5. **More databases** - MySQL, MongoDB support
6. **Email service** - Transactional emails
7. **Job queue** - Background task processing
8. **File uploads** - S3/local storage
9. **API documentation** - OpenAPI/Swagger
10. **Monitoring** - Built-in observability

## Conclusion

create-bun-stack demonstrates how Bun's modern runtime can be combined with proven patterns from Rails to create a productive fullstack development experience. By leveraging Bun's built-in features and maintaining a focus on developer experience, we've created a tool that makes it easy to build production-ready applications quickly.

The key is balancing convention with flexibility - providing sensible defaults while allowing developers to customize when needed. This approach, combined with Bun's performance advantages, creates a compelling alternative to existing JavaScript frameworks.

# important-instruction-reminders

Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (\*.md) or README files. Only create documentation files if explicitly requested by the User.
