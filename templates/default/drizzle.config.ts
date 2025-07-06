import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL || "";
const isPostgres = databaseUrl.startsWith("postgres");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: isPostgres ? "postgresql" : "sqlite",
  dbCredentials: isPostgres
    ? { url: databaseUrl }
    : { url: process.env.SQLITE_PATH || "db/app.db" },
});
