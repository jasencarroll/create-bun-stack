// Security headers middleware

export function applySecurityHeaders(response: Response, req: Request): Response {
  const headers = new Headers(response.headers);
  const url = new URL(req.url);
  const contentType = response.headers.get("Content-Type") || "";

  // General security headers - apply to all responses
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("X-XSS-Protection", "1; mode=block");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

  // Remove server identification
  headers.delete("X-Powered-By");

  // Content Security Policy - only for HTML responses
  if (contentType.includes("text/html")) {
    const isDev = process.env.NODE_ENV !== "production";
    const cspDirectives = [
      "default-src 'self'",
      `script-src 'self' ${isDev ? "'unsafe-inline' 'unsafe-eval'" : ""}`,
      `style-src 'self' ${isDev ? "'unsafe-inline'" : ""}`,
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ];
    headers.set("Content-Security-Policy", cspDirectives.join("; "));
  }

  // HSTS - only in production
  if (process.env.NODE_ENV === "production") {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }

  // Cache control
  if (url.pathname.startsWith("/api/")) {
    // API responses should not be cached
    if (url.pathname.startsWith("/api/users") || url.pathname.startsWith("/api/admin")) {
      // Authenticated endpoints need private cache control
      headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    } else {
      headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    }
    headers.set("Pragma", "no-cache");
    headers.set("Expires", "0");
  } else if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    // Static assets can be cached
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
  } else if (url.pathname === "/manifest.json") {
    // Manifest can be cached but not forever
    headers.set("Cache-Control", "public, max-age=3600");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
