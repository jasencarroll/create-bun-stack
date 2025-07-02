import * as routes from "./routes";
import { applyCorsHeaders, handleCorsPreflightRequest } from "./middleware/cors";
import { applyCsrfProtection } from "./middleware/csrf";
import { applySecurityHeaders } from "./middleware/security-headers";

const PORT = process.env.PORT || 3000;

// For development, we'll serve the React app dynamically
const isDevelopment = process.env.NODE_ENV !== "production";

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

    // Serve React app files
    if (path === "/" || !path.startsWith("/api")) {
      if (path === "/" || path.endsWith(".html")) {
        // Serve index.html
        const html = await Bun.file("./public/index.html").text();
        // In development, update the script src to use the bundled version
        const modifiedHtml = isDevelopment 
          ? html.replace('/src/app/main.tsx', '/main.js')
          : html;
        return wrapResponse(new Response(modifiedHtml, {
          headers: { "Content-Type": "text/html" },
        }));
      }
      
      // Handle JavaScript bundle request
      if (path === "/main.js" && isDevelopment) {
        const result = await Bun.build({
          entrypoints: ["./src/app/main.tsx"],
          target: "browser",
          minify: false,
        });
        
        if (result.success && result.outputs.length > 0) {
          return wrapResponse(new Response(result.outputs[0], {
            headers: { "Content-Type": "application/javascript" },
          }));
        }
      }
      
      // Handle CSS
      if (path === "/styles.css") {
        // For now, just serve the CSS file directly
        // In production, you'd want to run Tailwind CSS build
        return wrapResponse(new Response(Bun.file("./public/styles.css"), {
          headers: { "Content-Type": "text/css" },
        }));
      }
      
      // Static files
      if (path === "/manifest.json") {
        return wrapResponse(new Response(Bun.file("./public/manifest.json"), {
          headers: { "Content-Type": "application/json" },
        }));
      }
      if (path === "/favicon.ico") {
        return wrapResponse(new Response(Bun.file("./public/favicon.ico")));
      }
    }

    // API Routes
    if (path === "/api/health") {
      const response = Response.json({ status: "ok", timestamp: new Date() });
      return wrapResponse(response);
    }

    if (path.startsWith("/api/users")) {
      const handlers = routes.users;
      let response: Response | undefined;
      
      if (req.method === "GET" && path === "/api/users") {
        response = await handlers.GET(req);
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
          response = await handlers["/:id"].PUT(reqWithParams);
        }
        if (req.method === "DELETE") {
          response = await handlers["/:id"].DELETE(reqWithParams);
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
    const html = await Bun.file("./public/index.html").text();
    const modifiedHtml = isDevelopment 
      ? html.replace('/src/app/main.tsx', '/main.js')
      : html;
    return wrapResponse(new Response(modifiedHtml, {
      headers: { "Content-Type": "text/html" },
    }));
  },
  error(error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
});

console.log(`🚀 Server running at http://localhost:${PORT}`);

export { appServer as server };