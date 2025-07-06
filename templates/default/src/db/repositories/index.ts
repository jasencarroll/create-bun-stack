import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { db, dbType } from "../client";
import { PostgresUserRepository } from "./PostgresUserRepository";
import { SQLiteUserRepository } from "./SQLiteUserRepository";
import type { RepositoryContext } from "./types";

// Create the appropriate repository based on the database type
const createRepositories = (): RepositoryContext => {
  if (dbType === "postgres") {
    return {
      users: new PostgresUserRepository(
        db as unknown as PostgresJsDatabase<typeof import("../schema")>
      ),
    };
  }
  return {
    users: new SQLiteUserRepository(db as BunSQLiteDatabase<typeof import("../schema")>),
  };
};

// Export a singleton instance
export const repositories = createRepositories();
export const userRepository = repositories.users;
