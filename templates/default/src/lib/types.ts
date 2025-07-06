// Re-export database types for convenience
export type { NewUser, User } from "@/db/schema";

// Additional app types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
  csrfToken?: string;
}
