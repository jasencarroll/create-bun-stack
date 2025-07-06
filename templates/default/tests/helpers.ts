import type { User } from "@/lib/types";

// Get test server URL from environment or use default
export const TEST_PORT = "3001"; // Dedicated test server port
export const TEST_BASE_URL = `http://localhost:${TEST_PORT}`;

// Mock request helper
export function createMockRequest(url: string = TEST_BASE_URL, options: RequestInit = {}): Request {
  return new Request(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });
}

// Mock request with params helper
export function createMockRequestWithParams<T extends Record<string, string>>(
  url: string,
  params: T,
  options: RequestInit = {}
): Request & { params: T } {
  const request = createMockRequest(url, options) as Request & { params: T };
  request.params = params;
  return request;
}

// Test data factories
export const createTestUser = (overrides: Partial<User> = {}): User => ({
  id: "test-user-1",
  name: "Test User",
  email: "test@example.com",
  password: "hashed_password",
  role: "user",
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
    return this.users.find((u) => u.id === id) || null;
  }

  async create(data: Partial<User>): Promise<User> {
    const user: User = {
      id: data.id || `user-${this.users.length + 1}`,
      name: data.name || "Test User",
      email: data.email || `test${this.users.length + 1}@example.com`,
      password: data.password || null,
      role: data.role || "user",
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    };
    this.users.push(user);
    return user;
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return null;

    this.users[index] = {
      ...this.users[index],
      ...data,
      updatedAt: new Date(),
    };
    return this.users[index];
  }

  async delete(id: string): Promise<boolean> {
    const index = this.users.findIndex((u) => u.id === id);
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
