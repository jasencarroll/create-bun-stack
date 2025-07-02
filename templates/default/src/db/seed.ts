import { userRepository } from "./repositories";
import { dbType } from "./client";

async function seed() {
  console.log(`🌱 Seeding ${dbType} database...`);
  
  const users = [
    {
      name: "Alice Johnson",
      email: "alice@example.com",
      password: await Bun.password.hash("password123"),
    },
    {
      name: "Bob Williams",
      email: "bob@example.com",
      password: await Bun.password.hash("password123"),
    },
    {
      name: "Charlie Brown",
      email: "charlie@example.com",
      password: await Bun.password.hash("password123"),
    },
  ];
  
  for (const user of users) {
    await userRepository.create(user);
  }
  
  console.log("✅ Database seeded!");
}

seed().catch(console.error);