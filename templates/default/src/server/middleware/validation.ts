import { z } from "zod";

export async function validateRequest<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<T | Response> {
  try {
    const body = await req.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ errors: error.errors }, { status: 400 });
    }
    return new Response("Invalid request", { status: 400 });
  }
}
