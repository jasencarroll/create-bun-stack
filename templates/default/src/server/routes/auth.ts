import { z } from "zod";
import { validateRequest } from "../middleware/validation";
import { hashPassword, verifyPassword, generateToken } from "@/lib/crypto";
import { userRepository } from "@/db/repositories";
import { generateCsrfToken, addCsrfTokenToResponse, clearCsrfToken } from "../middleware/csrf";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export const auth = {
  "/login": {
    POST: async (req: Request) => {
      const body = await validateRequest(req, loginSchema);
      if (body instanceof Response) return body;
      
      // Find user by email
      const users = await userRepository.findAll();
      const user = users.find((u) => u.email === body.email);
      
      if (!user || !user.password) {
        return Response.json({ error: "Invalid credentials" }, { status: 401 });
      }
      
      // Verify password
      const isValid = await verifyPassword(body.password, user.password);
      if (!isValid) {
        return Response.json({ error: "Invalid credentials" }, { status: 401 });
      }
      
      // Generate JWT token
      const token = generateToken({ userId: user.id, email: user.email });
      
      // Generate CSRF token
      const csrf = generateCsrfToken();
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      const response = Response.json({ 
        token, 
        user: userWithoutPassword,
        csrfToken: csrf.token 
      });
      
      // Add CSRF cookie to response
      return await addCsrfTokenToResponse(response, csrf.token, csrf.cookie);
    }
  },
  
  "/register": {
    POST: async (req: Request) => {
      const body = await validateRequest(req, registerSchema);
      if (body instanceof Response) return body;
      
      // Check if user already exists
      const users = await userRepository.findAll();
      const existing = users.find((u) => u.email === body.email);
      
      if (existing) {
        return Response.json(
          { error: "User with this email already exists" },
          { status: 400 }
        );
      }
      
      // Hash password
      const hashedPassword = await hashPassword(body.password);
      
      // Create user
      const newUser = await userRepository.create({
        name: body.name,
        email: body.email,
        password: hashedPassword,
      });
      
      // Generate JWT token
      const token = generateToken({ userId: newUser.id, email: newUser.email });
      
      // Generate CSRF token
      const csrf = generateCsrfToken();
      
      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;
      
      const response = Response.json(
        { 
          token, 
          user: userWithoutPassword,
          csrfToken: csrf.token 
        },
        { status: 201 }
      );
      
      // Add CSRF cookie to response
      return await addCsrfTokenToResponse(response, csrf.token, csrf.cookie);
    }
  },
  
  "/logout": {
    POST: async (req: Request) => {
      // Get CSRF cookie to clear it
      const cookies = parseCookies(req.headers.get("Cookie") || "");
      const csrfCookie = cookies["csrf-token"];
      
      if (csrfCookie) {
        clearCsrfToken(csrfCookie);
      }
      
      // Clear CSRF cookie
      const headers = new Headers();
      headers.append("Set-Cookie", "csrf-token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0");
      
      return new Response(JSON.stringify({ message: "Logged out successfully" }), {
        status: 200,
        headers
      });
    }
  }
};

// Helper to parse cookies
function parseCookies(cookieString: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const cookie of cookieString.split(";")) {
    const [name, value] = cookie.trim().split("=");
    if (name && value) cookies[name] = value;
  }
  return cookies;
}