import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().default("3000"),
  DATABASE_URL: z.string().default(""),
  SQLITE_PATH: z.string().default("./db/app.db"),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
});

// Parse and validate environment variables
export const env = envSchema.parse(process.env);

// Additional validation for production
if (env.NODE_ENV === "production") {
  if (env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }
  if (env.JWT_SECRET === "your-secret-key-here-change-this-in-production") {
    throw new Error("Please change the default JWT_SECRET in production");
  }
}
