import { eq } from "drizzle-orm";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type { NewUser, User } from "../schema";
import { usersSqlite } from "../schema";
import type { UserRepository } from "./types";

export class SQLiteUserRepository implements UserRepository {
  constructor(private db: BunSQLiteDatabase<typeof import("../schema")>) {}

  async findAll(): Promise<User[]> {
    return await this.db.select().from(usersSqlite);
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.db.select().from(usersSqlite).where(eq(usersSqlite.id, id)).limit(1);
    return result[0] || null;
  }

  async create(data: NewUser): Promise<User> {
    const result = await this.db.insert(usersSqlite).values(data).returning();
    const user = result[0];
    if (!user) {
      throw new Error("Failed to create user");
    }
    return user;
  }

  async update(id: string, data: Partial<NewUser>): Promise<User | null> {
    const result = await this.db
      .update(usersSqlite)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(usersSqlite.id, id))
      .returning();
    return result[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(usersSqlite).where(eq(usersSqlite.id, id)).returning();
    return result.length > 0;
  }
}
