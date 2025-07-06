#!/usr/bin/env bun

import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { users } from "../db/schema";

async function makeAdmin(email: string) {
  if (!email) {
    console.error("❌ Please provide an email address");
    console.log("Usage: bun run make-admin user@example.com");
    process.exit(1);
  }

  try {
    // Find user by email
    const userList = await db.select().from(users).where(eq(users.email, email));

    if (userList.length === 0) {
      console.error(`❌ No user found with email: ${email}`);
      process.exit(1);
    }

    const user = userList[0];

    if (user.role === "admin") {
      console.log(`ℹ️  User ${email} is already an admin`);
      process.exit(0);
    }

    // Update user role to admin
    await db.update(users).set({ role: "admin" }).where(eq(users.email, email));

    console.log(`✅ Successfully promoted ${email} to admin`);
  } catch (error) {
    console.error("❌ Error updating user:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Get email from command line arguments
const email = process.argv[2];
makeAdmin(email);
