import { userRepository } from "@/db/repositories";
import { z } from "zod";
import { validateRequest } from "../middleware/validation";

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8).optional(),
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(["user", "admin"]).optional(),
});

export const users = {
  GET: async (_req: Request) => {
    const users = await userRepository.findAll();
    return Response.json(users);
  },

  POST: async (req: Request) => {
    const body = await validateRequest(req, createUserSchema);
    if (body instanceof Response) return body;

    // Hash password if provided
    if (body.password) {
      body.password = await Bun.password.hash(body.password);
    }

    const newUser = await userRepository.create(body);
    return Response.json(newUser, { status: 201 });
  },

  "/:id": {
    GET: async (req: Request & { params: { id: string } }) => {
      const user = await userRepository.findById(req.params.id);

      if (!user) {
        return new Response("User not found", { status: 404 });
      }

      return Response.json(user);
    },

    PUT: async (req: Request & { params: { id: string } }) => {
      const body = await validateRequest(req, updateUserSchema);
      if (body instanceof Response) return body;

      // Hash password if provided
      if (body.password) {
        body.password = await Bun.password.hash(body.password);
      }

      const updatedUser = await userRepository.update(req.params.id, body);

      if (!updatedUser) {
        return new Response("User not found", { status: 404 });
      }

      return Response.json(updatedUser);
    },

    DELETE: async (req: Request & { params: { id: string } }) => {
      const deleted = await userRepository.delete(req.params.id);

      if (!deleted) {
        return new Response("User not found", { status: 404 });
      }

      return new Response(null, { status: 204 });
    },
  },
};
