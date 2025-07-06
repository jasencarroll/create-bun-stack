import type { NewUser, User } from "../schema";

export interface UserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  create(data: NewUser): Promise<User>;
  update(id: string, data: Partial<NewUser>): Promise<User | null>;
  delete(id: string): Promise<boolean>;
}

export interface RepositoryContext {
  users: UserRepository;
}
