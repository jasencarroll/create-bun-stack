#!/usr/bin/env bun

import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline/promises";
import { copyTemplateDirectory, getExcludePatterns } from "./utils/template";

// Create readline interface
const rl = readline.createInterface({ input, output });

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║        ██████╗ ██╗   ██╗███╗   ██╗                            ║
║        ██╔══██╗██║   ██║████╗  ██║                            ║
║        ██████╔╝██║   ██║██╔██╗ ██║                            ║
║        ██╔══██╗██║   ██║██║╚██╗██║                            ║
║        ██████╔╝╚██████╔╝██║ ╚████║                            ║
║        ╚═════╝  ╚═════╝ ╚═╝  ╚═══╝                            ║
║                                                               ║
║        ███████╗████████╗ █████╗  ██████╗██╗  ██╗              ║
║        ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝              ║
║        ███████╗   ██║   ███████║██║     █████╔╝               ║
║        ╚════██║   ██║   ██╔══██║██║     ██╔═██╗               ║
║        ███████║   ██║   ██║  ██║╚██████╗██║  ██╗              ║
║        ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝              ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝

🚀 Welcome to Create Bun Stack!
`);

  try {
    // Check if Bun is installed
    const bunVersion = Bun.version;
    console.log(`✅ Using Bun ${bunVersion}\n`);

    // Get project name
    const projectName = await rl.question("📝 Project name: ");
    if (!projectName || projectName.trim().length === 0) {
      console.error("❌ Project name is required");
      process.exit(1);
    }

    const projectPath = join(process.cwd(), projectName);

    // Check if directory already exists
    if (existsSync(projectPath)) {
      console.error(`❌ Directory ${projectName} already exists`);
      process.exit(1);
    }

    // Database choice
    console.log("\n📊 Database Configuration:");
    console.log("1. PostgreSQL (recommended for production)");
    console.log("2. SQLite (perfect for development)");
    console.log("3. Auto-detect (PostgreSQL with SQLite fallback)");
    
    const dbChoice = await rl.question("\nChoose database option (1-3) [default: 3]: ") || "3";
    
    let dbProvider = "auto";
    let dbInstructions = "";
    
    switch (dbChoice) {
      case "1":
        dbProvider = "postgres";
        dbInstructions = `
To use PostgreSQL:
1. Make sure PostgreSQL is installed and running
2. Create a database: createdb ${projectName}_dev
3. Set DATABASE_URL in your .env file:
   DATABASE_URL=postgres://username:password@localhost:5432/${projectName}_dev
`;
        break;
      case "2":
        dbProvider = "sqlite";
        dbInstructions = "\nSQLite will be used (no additional setup required).";
        break;
      default:
        dbProvider = "auto";
        dbInstructions = "\nThe app will try PostgreSQL first, then fallback to SQLite if not available.";
    }

    console.log("\n🔨 Creating your Bun Stack app...\n");

    // Copy template files
    const templateDir = join(import.meta.dir, "templates", "default");
    const templateVariables = {
      projectName: projectName,
      dbProvider: dbProvider
    };

    await copyTemplateDirectory(
      templateDir,
      projectPath,
      templateVariables,
      getExcludePatterns()
    );

    console.log("✅ Project structure created");

    // Change to project directory
    process.chdir(projectPath);

    // Create database directory
    mkdirSync("db", { recursive: true });

    // Install dependencies
    console.log("\n📦 Installing dependencies...");
    const installProc = Bun.spawn(["bun", "install"], {
      stdout: "inherit",
      stderr: "inherit",
    });
    await installProc.exited;

    if (installProc.exitCode !== 0) {
      console.error("❌ Failed to install dependencies");
      process.exit(1);
    }

    console.log("✅ Dependencies installed");

    // Copy .env.example to .env
    const envProc = Bun.spawn(["cp", ".env.example", ".env"], {
      stdout: "inherit",
      stderr: "inherit",
    });
    await envProc.exited;

    // Setup database
    const shouldSetupDb = await rl.question("\n🗄️  Setup database now? (Y/n): ");
    if (shouldSetupDb.toLowerCase() !== "n") {
      console.log("\n🔧 Setting up database...");
      const dbProc = Bun.spawn(["bun", "run", "db:push"], {
        stdout: "inherit",
        stderr: "inherit",
      });
      await dbProc.exited;

      if (dbProc.exitCode === 0) {
        console.log("✅ Database setup complete");

        // Offer to seed
        const shouldSeed = await rl.question("\n🌱 Seed database with sample data? (y/N): ");
        if (shouldSeed.toLowerCase() === "y") {
          const seedProc = Bun.spawn(["bun", "run", "db:seed"], {
            stdout: "inherit",
            stderr: "inherit",
          });
          await seedProc.exited;
          
          if (seedProc.exitCode === 0) {
            console.log("✅ Database seeded");
          }
        }
      } else {
        console.log("⚠️  Database setup failed - you can run 'bun run db:push' later");
      }
    }

    // Build CSS
    console.log("\n🎨 Building CSS...");
    const cssProc = Bun.spawn(["bun", "run", "build:css"], {
      stdout: "inherit", 
      stderr: "inherit",
    });
    await cssProc.exited;

    if (cssProc.exitCode === 0) {
      console.log("✅ CSS built successfully");
    } else {
      console.log("⚠️  CSS build failed - you can run 'bun run build:css' later");
    }

    // Success message
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                       🎉 SUCCESS! 🎉                           ║
╚═══════════════════════════════════════════════════════════════╝

Your Bun Stack app is ready!

📁 Project created at: ${projectPath}
${dbInstructions}

🚀 Get started:
   cd ${projectName}
   bun run dev

📚 Available commands:
   bun run dev         - Start development server
   bun test           - Run tests
   bun run db:studio  - Open database GUI
   bun run build      - Build for production

🔗 Resources:
   Documentation: https://github.com/jasencarroll/create-bun-stack
   Bun Docs: https://bun.sh

Happy coding! 🚀
`);

  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the CLI
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});