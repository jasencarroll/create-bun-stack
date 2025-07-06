import { env } from "../../config/env";

// CORS configuration and middleware
const PORT = env.PORT;
const ALLOWED_ORIGINS =
  env.NODE_ENV === "production"
    ? ["https://yourdomain.com"] // Replace with your production domain
    : [
        `http://localhost:${PORT}`,
        `http://localhost:${Number(PORT) + 1}`,
        `http://127.0.0.1:${PORT}`,
      ];

const ALLOWED_METHODS = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];
const ALLOWED_HEADERS = ["Content-Type", "Authorization", "X-CSRF-Token"];

export function applyCorsHeaders(response: Response, origin: string | null): Response {
  const headers = new Headers(response.headers);

  // Check if origin is allowed
  if (origin && (ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV !== "production")) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
  }

  // Always set Vary header
  headers.set("Vary", "Origin");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function handleCorsPreflightRequest(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;

  const origin = req.headers.get("Origin");
  const headers = new Headers();

  // Check if origin is allowed
  if (origin && (ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV !== "production")) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
  }

  headers.set("Access-Control-Allow-Methods", ALLOWED_METHODS.join(", "));
  headers.set("Access-Control-Allow-Headers", ALLOWED_HEADERS.join(", "));
  headers.set("Access-Control-Max-Age", "86400"); // 24 hours
  headers.set("Vary", "Origin");

  return new Response(null, { status: 204, headers });
}
