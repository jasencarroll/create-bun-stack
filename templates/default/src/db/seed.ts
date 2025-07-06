import { dbType } from "./client";
import { userRepository } from "./repositories";

async function seed() {
  console.log(`🌱 Seeding ${dbType} database...`);

  const users = [
    {
      name: "Alice Johnson",
      email: "alice@example.com",
      password: await Bun.password.hash("password123"),
      role: "admin" as const,
    },
    {
      name: "Bob Williams",
      email: "bob@example.com",
      password: await Bun.password.hash("password123"),
      role: "user" as const,
    },
    {
      name: "Charlie Brown",
      email: "charlie@example.com",
      password: await Bun.password.hash("password123"),
      role: "user" as const,
    },
  ];

  for (const user of users) {
    await userRepository.create(user);
  }

  console.log("✅ Database seeded!");
}

seed().catch(console.error);
