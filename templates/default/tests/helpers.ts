import type { User } from "@/lib/types";

// Mock request helper
export function createMockRequest(
  url: string = "http://localhost:3000",
  options: RequestInit = {}
): Request {
  return new Request(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });
}

// Test data factories
export const createTestUser = (overrides: Partial<User> = {}): User => ({
  id: "test-user-1",
  name: "Test User",
  email: "test@example.com",
  password: "hashed_password",
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// Response helpers
export async function parseJsonResponse<T = unknown>(response: Response): Promise<T> {
  const text = await response.text();
  return JSON.parse(text) as T;
}

// Mock repository for testing
export class MockUserRepository {
  private users: User[] = [];
  
  async findAll(): Promise<User[]> {
    return [...this.users];
  }
  
  async findById(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }
  
  async create(data: Partial<User>): Promise<User> {
    const user: User = {
      id: `user-${this.users.length + 1}`,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }
  
  async update(id: string, data: Partial<User>): Promise<User | null> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    this.users[index] = {
      ...this.users[index],
      ...data,
      updatedAt: new Date(),
    };
    return this.users[index];
  }
  
  async delete(id: string): Promise<boolean> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return false;
    
    this.users.splice(index, 1);
    return true;
  }
  
  reset() {
    this.users = [];
  }
  
  seed(users: User[]) {
    this.users = [...users];
  }
}
