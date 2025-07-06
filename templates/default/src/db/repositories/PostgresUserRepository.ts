import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { NewUser, User } from "../schema";
import { usersPg } from "../schema";
import type { UserRepository } from "./types";

export class PostgresUserRepository implements UserRepository {
  constructor(private db: PostgresJsDatabase<typeof import("../schema")>) {}

  async findAll(): Promise<User[]> {
    return await this.db.select().from(usersPg);
  }

  async findById(id: string): Promise<User | null> {
    const result = await this.db.select().from(usersPg).where(eq(usersPg.id, id)).limit(1);
    return result[0] || null;
  }

  async create(data: NewUser): Promise<User> {
    const result = await this.db.insert(usersPg).values(data).returning();

    if (!result[0]) {
      throw new Error("Failed to create user");
    }

    return result[0];
  }

  async update(id: string, data: Partial<NewUser>): Promise<User | null> {
    const result = await this.db.update(usersPg).set(data).where(eq(usersPg.id, id)).returning();
    return result[0] || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(usersPg).where(eq(usersPg.id, id)).returning();
    return result.length > 0;
  }
}
