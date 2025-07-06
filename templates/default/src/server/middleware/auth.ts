import { verifyToken } from "@/lib/crypto";
import type { AuthUser } from "@/lib/types";

// Extend the Request type to include user
declare global {
  interface Request {
    user?: AuthUser;
  }
}

// Middleware to verify JWT token and add user to request
export function requireAuth(req: Request): Response | null {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = authHeader.substring(7);
  const payload = verifyToken(token);

  if (!payload || !payload.userId) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Add user info to request
  req.user = {
    id: payload.userId as string,
    email: payload.email as string,
    name: payload.name as string,
    role: payload.role as "user" | "admin",
  };

  return null; // Continue to next middleware/handler
}

// Middleware to require admin role
export function requireAdmin(req: Request): Response | null {
  // First check authentication
  const authResponse = requireAuth(req);
  if (authResponse) return authResponse;

  // Then check admin role
  if (req.user?.role !== "admin") {
    return new Response(JSON.stringify({ error: "Forbidden - Admin access required" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return null; // Continue to next middleware/handler
}
