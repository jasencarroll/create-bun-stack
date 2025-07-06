import { env } from "../config/env";
import { requireAdmin } from "./middleware/auth";
import { applyCorsHeaders, handleCorsPreflightRequest } from "./middleware/cors";
import { applyCsrfProtection } from "./middleware/csrf";
import { applySecurityHeaders } from "./middleware/security-headers";
import * as routes from "./routes";

const PORT = Number(env.PORT);

// For development, we'll serve the React app dynamically
const isDevelopment = env.NODE_ENV !== "production" || process.env.DEV_MODE === "true";

// Track server start time for development hot reload detection
const serverStartTime = Date.now();

const appServer = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    const origin = req.headers.get("Origin");

    // Helper to apply all security middleware
    const wrapResponse = (response: Response): Response => {
      let finalResponse = response;

      // Apply CORS headers for API routes
      if (path.startsWith("/api")) {
        finalResponse = applyCorsHeaders(finalResponse, origin);
      }

      // In development, add server start time header for hot reload detection
      if (isDevelopment && path.startsWith("/api")) {
        finalResponse = new Response(finalResponse.body, {
          status: finalResponse.status,
          statusText: finalResponse.statusText,
          headers: new Headers(finalResponse.headers),
        });
        finalResponse.headers.set("X-Server-Start-Time", serverStartTime.toString());
      }

      // Apply security headers to all responses
      return applySecurityHeaders(finalResponse, req);
    };

    // Handle CORS preflight requests for API routes
    if (path.startsWith("/api")) {
      const preflightResponse = handleCorsPreflightRequest(req);
      if (preflightResponse) return wrapResponse(preflightResponse);

      // Apply CSRF protection
      const csrfError = applyCsrfProtection(req);
      if (csrfError) return wrapResponse(csrfError);
    }

    // Serve static files
    if (path === "/" || !path.startsWith("/api")) {
      if (isDevelopment) {
        // In development, serve from public directory
        if (path === "/") {
          // Serve index.html
          const htmlFile = Bun.file("./index.html");
          if (await htmlFile.exists()) {
            let html = await htmlFile.text();
            // Inject HMR client script in development
            const hmrScript = `
              <script>
                // HMR Client
                let lastTimestamp = null;
                async function checkForUpdates() {
                  try {
                    const file = await fetch('/.hmr-timestamp');
                    const timestamp = await file.text();
                    if (lastTimestamp && lastTimestamp !== timestamp) {
                      console.log('🔄 Reloading due to changes...');
                      window.location.reload();
                    }
                    lastTimestamp = timestamp;
                  } catch (e) {
                    // Ignore errors
                  }
                }
                setInterval(checkForUpdates, 100);
                checkForUpdates();
              </script>
            `;
            html = html.replace("</body>", `${hmrScript}</body>`);
            return wrapResponse(
              new Response(html, {
                headers: { "Content-Type": "text/html" },
              })
            );
          }
        }

        // Serve HMR timestamp file
        if (path === "/.hmr-timestamp") {
          const timestampFile = Bun.file("./.hmr-timestamp");
          if (await timestampFile.exists()) {
            return wrapResponse(
              new Response(timestampFile, {
                headers: {
                  "Content-Type": "text/plain",
                  "Cache-Control": "no-cache, no-store, must-revalidate",
                },
              })
            );
          }
        }

        // Serve from public directory
        const publicPath = `./public${path}`;
        const file = Bun.file(publicPath);
        if (await file.exists()) {
          // Determine content type based on file extension
          let contentType = "text/plain";
          const filePath = path === "/" ? "/index.html" : path;
          if (filePath.endsWith(".html")) contentType = "text/html";
          else if (filePath.endsWith(".js")) contentType = "application/javascript";
          else if (filePath.endsWith(".css")) contentType = "text/css";
          else if (filePath.endsWith(".json")) contentType = "application/json";
          else if (filePath.endsWith(".ico")) contentType = "image/x-icon";
          else if (filePath.endsWith(".png")) contentType = "image/png";
          else if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) contentType = "image/jpeg";
          else if (filePath.endsWith(".svg")) contentType = "image/svg+xml";

          return wrapResponse(
            new Response(file, {
              headers: { "Content-Type": contentType },
            })
          );
        }
      } else {
        // In production, serve from public directory
        const publicPath = `./public${path === "/" ? "/index.html" : path}`;
        const file = Bun.file(publicPath);

        if (await file.exists()) {
          // Determine content type based on file extension
          let contentType = "text/plain";
          const filePath = path === "/" ? "/index.html" : path;
          if (filePath.endsWith(".html")) contentType = "text/html";
          else if (filePath.endsWith(".js")) contentType = "application/javascript";
          else if (filePath.endsWith(".css")) contentType = "text/css";
          else if (filePath.endsWith(".json")) contentType = "application/json";
          else if (filePath.endsWith(".ico")) contentType = "image/x-icon";
          else if (filePath.endsWith(".png")) contentType = "image/png";
          else if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) contentType = "image/jpeg";
          else if (filePath.endsWith(".svg")) contentType = "image/svg+xml";

          return wrapResponse(
            new Response(file, {
              headers: { "Content-Type": contentType },
            })
          );
        }
      }
    }

    // API Routes
    if (path === "/api/health") {
      let dbStatus = "unknown";
      let dbResponseTime = 0;

      try {
        const start = Date.now();
        // Simple query to check database connectivity
        const { executeSimpleQuery } = await import("../db/client");
        await executeSimpleQuery("SELECT 1 as test");
        dbResponseTime = Date.now() - start;
        dbStatus = "connected";
      } catch (error) {
        dbStatus = "disconnected";
        console.error("Database health check failed:", error);
      }

      const response = Response.json({
        status: "ok",
        timestamp: new Date(),
        database: {
          status: dbStatus,
          responseTime: dbResponseTime,
        },
        version: process.env.npm_package_version || "unknown",
        environment: env.NODE_ENV,
      });
      return wrapResponse(response);
    }

    if (path.startsWith("/api/users")) {
      const handlers = routes.users;
      let response: Response | undefined;

      if (req.method === "GET" && path === "/api/users") {
        // Apply admin middleware for GET /api/users
        const adminCheck = requireAdmin(req);
        if (adminCheck) {
          response = adminCheck;
        } else {
          response = await handlers.GET(req);
        }
      }
      if (req.method === "POST" && path === "/api/users") {
        response = await handlers.POST(req);
      }
      const match = path.match(/^\/api\/users\/(.+)$/);
      if (match?.[1]) {
        const reqWithParams = Object.assign(req, {
          params: { id: match[1] },
        });

        if (req.method === "GET") {
          response = await handlers["/:id"].GET(reqWithParams);
        }
        if (req.method === "PUT") {
          // Apply admin middleware for user updates
          const adminCheck = requireAdmin(req);
          if (adminCheck) {
            response = adminCheck;
          } else {
            response = await handlers["/:id"].PUT(reqWithParams);
          }
        }
        if (req.method === "DELETE") {
          // Apply admin middleware for user deletion
          const adminCheck = requireAdmin(req);
          if (adminCheck) {
            response = adminCheck;
          } else {
            response = await handlers["/:id"].DELETE(reqWithParams);
          }
        }
      }

      if (response) {
        return wrapResponse(response);
      }
    }

    if (path.startsWith("/api/auth")) {
      const handlers = routes.auth;
      let response: Response | undefined;

      if (path === "/api/auth/login" && req.method === "POST") {
        response = await handlers["/login"].POST(req);
      }
      if (path === "/api/auth/register" && req.method === "POST") {
        response = await handlers["/register"].POST(req);
      }
      if (path === "/api/auth/logout" && req.method === "POST") {
        response = await handlers["/logout"].POST(req);
      }

      if (response) {
        return wrapResponse(response);
      }
    }

    // Catch-all for SPA - return index.html for client-side routing
    if (isDevelopment) {
      // In development, serve index.html from root
      const indexFile = Bun.file("./index.html");
      if (await indexFile.exists()) {
        let html = await indexFile.text();
        // Inject HMR client script
        const hmrScript = `
          <script>
            // HMR Client
            let lastTimestamp = null;
            async function checkForUpdates() {
              try {
                const file = await fetch('/.hmr-timestamp');
                const timestamp = await file.text();
                if (lastTimestamp && lastTimestamp !== timestamp) {
                  console.log('🔄 Reloading due to changes...');
                  window.location.reload();
                }
                lastTimestamp = timestamp;
              } catch (e) {
                // Ignore errors
              }
            }
            setInterval(checkForUpdates, 100);
            checkForUpdates();
          </script>
        `;
        html = html.replace("</body>", `${hmrScript}</body>`);
        return wrapResponse(
          new Response(html, {
            headers: { "Content-Type": "text/html" },
          })
        );
      }
    } else {
      // In production, serve from public
      const publicFile = Bun.file("./public/index.html");
      if (await publicFile.exists()) {
        const html = await publicFile.text();
        return wrapResponse(
          new Response(html, {
            headers: { "Content-Type": "text/html" },
          })
        );
      }
    }

    // If nothing matched, return 404
    return wrapResponse(new Response("Not Found", { status: 404 }));
  },
  error(error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  },
});

console.log(`🚀 Server running at http://localhost:${PORT}`);
console.log(`🔄 Server started at: ${new Date().toISOString()}`);
if (isDevelopment) {
  console.log("💡 Development mode with hot module replacement enabled");
}

export { appServer as server };
