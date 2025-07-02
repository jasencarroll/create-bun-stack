import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { pgTable, text as pgText, timestamp, uuid } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

// Define tables for both SQLite and PostgreSQL
// The app will use the appropriate one based on the database type

// SQLite schema
export const usersSqlite = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(
    () => new Date(),
  ),
});

// PostgreSQL schema  
export const usersPg = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: pgText("name").notNull(),
  email: pgText("email").notNull().unique(),
  password: pgText("password"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Export the appropriate schema based on runtime detection
export const users = process.env.DATABASE_URL?.startsWith("postgres")
  ? usersPg
  : usersSqlite;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
