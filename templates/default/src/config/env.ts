import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("3000"),
  DATABASE_URL: z.string().default(""),
  SQLITE_PATH: z.string().default("./db/app.db"),
  JWT_SECRET: z.string().default("development-secret"),
});

export const env = envSchema.parse(process.env);