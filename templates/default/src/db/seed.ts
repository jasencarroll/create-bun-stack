import { dbType } from "./client";
import { userRepository } from "./repositories";

// Prevent seeding in production
if (process.env.NODE_ENV === "production") {
  console.error("❌ Seeding is disabled in production.");
  process.exit(1);
}

async function seed() {
  console.log(`🌱 Seeding ${dbType} database...`);

  // These credentials are for local development only
  const users = [
    {
      name: "Alice Johnson",
      email: "alice@example.com",
      password: await Bun.password.hash("Dev-Password-123!"),
      role: "admin" as const,
    },
    {
      name: "Bob Williams",
      email: "bob@example.com",
      password: await Bun.password.hash("Dev-Password-123!"),
      role: "user" as const,
    },
    {
      name: "Charlie Brown",
      email: "charlie@example.com",
      password: await Bun.password.hash("Dev-Password-123!"),
      role: "user" as const,
    },
  ];

  for (const user of users) {
    await userRepository.create(user);
  }

  console.log("✅ Database seeded!");
}

seed().catch(console.error);
