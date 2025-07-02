// Re-export database types for convenience
export type { User, NewUser } from "@/db/schema";

// Additional app types
export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}
