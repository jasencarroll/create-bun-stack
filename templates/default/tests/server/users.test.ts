import { test, expect, describe, beforeEach } from "bun:test";
import { users } from "@/server/routes/users";
import { createMockRequest, createTestUser, parseJsonResponse, MockUserRepository } from "../helpers";
import { userRepository } from "@/db/repositories";

// Mock the repository
const mockRepo = new MockUserRepository();
(userRepository as any).findAll = mockRepo.findAll.bind(mockRepo);
(userRepository as any).findById = mockRepo.findById.bind(mockRepo);
(userRepository as any).create = mockRepo.create.bind(mockRepo);
(userRepository as any).update = mockRepo.update.bind(mockRepo);
(userRepository as any).delete = mockRepo.delete.bind(mockRepo);

describe("User Routes", () => {
  beforeEach(() => {
    mockRepo.reset();
  });

  describe("GET /api/users", () => {
    test("returns empty array when no users", async () => {
      const request = createMockRequest("http://localhost:3000/api/users");
      const response = await users.GET(request);
      
      expect(response.status).toBe(200);
      const data = await parseJsonResponse(response);
      expect(data).toEqual([]);
    });

    test("returns all users", async () => {
      const testUsers = [
        createTestUser({ id: "1", name: "User 1" }),
        createTestUser({ id: "2", name: "User 2" }),
      ];
      mockRepo.seed(testUsers);

      const request = createMockRequest("http://localhost:3000/api/users");
      const response = await users.GET(request);
      
      expect(response.status).toBe(200);
      const data = await parseJsonResponse(response);
      expect(data).toHaveLength(2);
      expect(data[0].name).toBe("User 1");
      expect(data[1].name).toBe("User 2");
    });
  });

  describe("POST /api/users", () => {
    test("creates a new user with valid data", async () => {
      const newUser = {
        name: "New User",
        email: `new-${Date.now()}@example.com`,
        password: "password123",
      };

      const request = createMockRequest("http://localhost:3000/api/users", {
        method: "POST",
        body: JSON.stringify(newUser),
      });

      const response = await users.POST(request);
      
      expect(response.status).toBe(201);
      const data = await parseJsonResponse(response);
      expect(data.name).toBe(newUser.name);
      expect(data.email).toBe(newUser.email);
      expect(data.password).toContain("$"); // Should be hashed
      expect(data.id).toBeDefined();
    });

    test("returns 400 for invalid email", async () => {
      const request = createMockRequest("http://localhost:3000/api/users", {
        method: "POST",
        body: JSON.stringify({
          name: "Test",
          email: "invalid-email",
        }),
      });

      const response = await users.POST(request);
      expect(response.status).toBe(400);
    });

    test("returns 400 for missing name", async () => {
      const request = createMockRequest("http://localhost:3000/api/users", {
        method: "POST",
        body: JSON.stringify({
          email: "test@example.com",
        }),
      });

      const response = await users.POST(request);
      expect(response.status).toBe(400);
    });

    test("returns 400 for invalid JSON", async () => {
      const request = createMockRequest("http://localhost:3000/api/users", {
        method: "POST",
        body: "invalid json",
      });

      const response = await users.POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe("GET /api/users/:id", () => {
    test("returns user by id", async () => {
      const testUser = createTestUser({ id: "123" });
      mockRepo.seed([testUser]);

      const request = createMockRequest("http://localhost:3000/api/users/123") as any;
      request.params = { id: "123" };

      const response = await users["/:id"].GET(request);
      
      expect(response.status).toBe(200);
      const data = await parseJsonResponse(response);
      expect(data.id).toBe("123");
    });

    test("returns 404 for non-existent user", async () => {
      const request = createMockRequest("http://localhost:3000/api/users/999") as any;
      request.params = { id: "999" };

      const response = await users["/:id"].GET(request);
      expect(response.status).toBe(404);
    });
  });

  describe("PUT /api/users/:id", () => {
    test("updates existing user", async () => {
      const testUser = createTestUser({ id: "123" });
      mockRepo.seed([testUser]);

      const updates = { name: "Updated Name" };
      const request = createMockRequest("http://localhost:3000/api/users/123", {
        method: "PUT",
        body: JSON.stringify(updates),
      }) as any;
      request.params = { id: "123" };

      const response = await users["/:id"].PUT(request);
      
      expect(response.status).toBe(200);
      const data = await parseJsonResponse(response);
      expect(data.name).toBe("Updated Name");
      expect(data.id).toBe("123");
    });

    test("returns 404 for non-existent user", async () => {
      const request = createMockRequest("http://localhost:3000/api/users/999", {
        method: "PUT",
        body: JSON.stringify({ name: "Test" }),
      }) as any;
      request.params = { id: "999" };

      const response = await users["/:id"].PUT(request);
      expect(response.status).toBe(404);
    });

    test("hashes password when updating", async () => {
      const testUser = createTestUser({ id: "123" });
      mockRepo.seed([testUser]);

      const updates = { password: "newpassword123" };
      const request = createMockRequest("http://localhost:3000/api/users/123", {
        method: "PUT",
        body: JSON.stringify(updates),
      }) as any;
      request.params = { id: "123" };

      const response = await users["/:id"].PUT(request);
      
      expect(response.status).toBe(200);
      const data = await parseJsonResponse(response);
      expect(data.password).toContain("$"); // Should be hashed
      expect(data.password).not.toBe("newpassword123");
    });
  });

  describe("DELETE /api/users/:id", () => {
    test("deletes existing user", async () => {
      const testUser = createTestUser({ id: "123" });
      mockRepo.seed([testUser]);

      const request = createMockRequest("http://localhost:3000/api/users/123", {
        method: "DELETE",
      }) as any;
      request.params = { id: "123" };

      const response = await users["/:id"].DELETE(request);
      expect(response.status).toBe(204);
      
      // Verify user is deleted
      const checkUser = await mockRepo.findById("123");
      expect(checkUser).toBeNull();
    });

    test("returns 404 for non-existent user", async () => {
      const request = createMockRequest("http://localhost:3000/api/users/999", {
        method: "DELETE",
      }) as any;
      request.params = { id: "999" };

      const response = await users["/:id"].DELETE(request);
      expect(response.status).toBe(404);
    });
  });
});
