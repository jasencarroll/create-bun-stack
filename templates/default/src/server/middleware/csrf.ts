import { randomBytes } from "node:crypto";

// Store for CSRF tokens - in production, use Redis or database
const csrfTokenStore = new Map<string, { token: string; expires: number }>();

// Generate a secure CSRF token
export function generateCsrfToken(): { token: string; cookie: string } {
  const token = randomBytes(32).toString("hex");
  const cookie = randomBytes(32).toString("hex");

  // Store with 24 hour expiry
  csrfTokenStore.set(cookie, {
    token,
    expires: Date.now() + 24 * 60 * 60 * 1000,
  });

  // Clean up old tokens periodically
  cleanupExpiredTokens();

  return { token, cookie };
}

// Validate CSRF token
export function validateCsrfToken(cookie: string | null, token: string | null): boolean {
  if (!cookie || !token) return false;

  const stored = csrfTokenStore.get(cookie);
  if (!stored) return false;

  // Check if expired
  if (stored.expires < Date.now()) {
    csrfTokenStore.delete(cookie);
    return false;
  }

  return stored.token === token;
}

// Clear CSRF token (for logout)
export function clearCsrfToken(cookie: string): void {
  csrfTokenStore.delete(cookie);
}

// Clean up expired tokens
function cleanupExpiredTokens(): void {
  const now = Date.now();
  for (const [cookie, data] of csrfTokenStore.entries()) {
    if (data.expires < now) {
      csrfTokenStore.delete(cookie);
    }
  }
}

// Check if request needs CSRF protection
export function requiresCsrfProtection(req: Request): boolean {
  const url = new URL(req.url);
  const path = url.pathname;

  // Skip CSRF for:
  // - GET, HEAD, OPTIONS requests
  // - Auth endpoints (login/register)
  // - Health check
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return false;
  if (path === "/api/auth/login" || path === "/api/auth/register") return false;
  if (path === "/api/health") return false;

  // All other state-changing requests need CSRF protection
  return true;
}

// Apply CSRF protection to a request
export function applyCsrfProtection(req: Request): Response | null {
  if (!requiresCsrfProtection(req)) return null;

  // Get CSRF cookie and token
  const cookies = parseCookies(req.headers.get("Cookie") || "");
  const csrfCookie = cookies["csrf-token"] || null;
  const csrfToken = req.headers.get("X-CSRF-Token");

  // Validate
  if (!validateCsrfToken(csrfCookie, csrfToken)) {
    return Response.json({ error: "CSRF token validation failed" }, { status: 403 });
  }

  return null;
}

// Helper to parse cookies
function parseCookies(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const cookie of cookieString.split(";")) {
    const [name, value] = cookie.trim().split("=");
    if (name && value) cookies[name] = value;
  }
  return cookies;
}

// Add CSRF token to response
export async function addCsrfTokenToResponse(
  response: Response,
  _token: string,
  cookie: string
): Promise<Response> {
  const headers = new Headers(response.headers);

  // Set CSRF cookie
  headers.append(
    "Set-Cookie",
    `csrf-token=${cookie}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`
  );

  // If response already has csrfToken in body, just add the cookie
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
