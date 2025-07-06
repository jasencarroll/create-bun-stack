import { apiClient } from "@/app/lib/api";
import { useCallback, useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role?: string;
}

interface AuthResponse {
  token: string;
  user: User;
  csrfToken: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem("token");
    if (token) {
      // In a real app, you'd validate the token and fetch user data
      // For now, we'll just parse the basic info
      try {
        const parts = token.split(".");
        if (parts.length !== 3) throw new Error("Invalid token");
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp && payload.exp * 1000 > Date.now()) {
          setUser({
            id: payload.userId,
            email: payload.email,
            name: payload.name || payload.email.split("@")[0],
            role: payload.role || "user",
          });
        } else {
          // Token expired
          apiClient.clearTokens();
        }
      } catch (_e) {
        // Invalid token
        apiClient.clearTokens();
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await apiClient.post<AuthResponse>(
        "/api/auth/login",
        { email, password },
        false // Don't include auth header for login
      );

      localStorage.setItem("token", data.token);
      setUser(data.user);

      return { success: true, user: data.user };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Login failed",
      };
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const data = await apiClient.post<AuthResponse>(
        "/api/auth/register",
        { name, email, password },
        false // Don't include auth header for registration
      );

      localStorage.setItem("token", data.token);
      setUser(data.user);

      return { success: true, user: data.user };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Registration failed",
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post("/api/auth/logout", {});
    } catch (_e) {
      // Even if logout fails on server, clear local state
    }

    apiClient.clearTokens();
    setUser(null);
  }, []);

  return { user, loading, login, register, logout };
}
