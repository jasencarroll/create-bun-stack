#!/usr/bin/env bun

import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline/promises";
import { copyTemplateDirectory, getExcludePatterns } from "./utils/template";

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options: {
    name?: string;
    db?: string;
    skipDbSetup?: boolean;
    skipInstall?: boolean;
    quiet?: boolean;
  } = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--name":
      case "-n":
        options.name = args[++i];
        break;
      case "--db":
      case "-d":
        options.db = args[++i];
        break;
      case "--skip-db-setup":
        options.skipDbSetup = true;
        break;
      case "--skip-install":
        options.skipInstall = true;
        break;
      case "--quiet":
      case "-q":
        options.quiet = true;
        break;
      case "--help":
      case "-h":
        console.log(`
Usage: create-bun-stack [options]

Options:
  -n, --name <name>      Project name
  -d, --db <type>        Database type: postgres, sqlite, or auto (default: auto)
  --skip-db-setup        Skip database setup
  --skip-install         Skip dependency installation
  -q, --quiet            Suppress output
  -h, --help             Show help
`);
        process.exit(0);
    }
  }

  return options;
}

// Create readline interface
const rl = readline.createInterface({ input, output });

async function main() {
  const cliOptions = parseArgs();
  const isNonInteractive = cliOptions.name !== undefined;

  if (!cliOptions.quiet) {
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
✨ Using Bun - The all-in-one JavaScript runtime & toolkit
`);
  }

  try {
    // Check if Bun is installed
    const bunVersion = Bun.version;
    if (!cliOptions.quiet) {
      console.log(`✅ Using Bun ${bunVersion}\n`);
    }

    // Get project name
    let projectName: string;
    if (isNonInteractive) {
      projectName = cliOptions.name as string;
      if (!cliOptions.quiet) {
        console.log(`📝 Project name: ${projectName}`);
      }
    } else {
      projectName = await rl.question("📝 Project name: ");
    }

    if (!projectName || projectName.trim().length === 0) {
      console.error("❌ Project name is required");
      process.exit(1);
    }

    // Validate project name format
    const validProjectName = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/i;
    if (!validProjectName.test(projectName)) {
      console.error("❌ Project name must contain only letters, numbers, and hyphens");
      console.error("   It must start and end with a letter or number");
      console.error("   Example: my-awesome-app");
      process.exit(1);
    }

    // Check for common reserved names
    const reservedNames = ["node_modules", "test", "tests", "src", "dist", "build", "public"];
    if (reservedNames.includes(projectName.toLowerCase())) {
      console.error(`❌ "${projectName}" is a reserved name. Please choose a different name.`);
      process.exit(1);
    }

    const projectPath = join(process.cwd(), projectName);

    // Check if directory already exists
    if (existsSync(projectPath)) {
      console.error(`❌ Directory ${projectName} already exists`);
      process.exit(1);
    }

    // Database choice
    let dbProvider = "auto";
    let dbInstructions = "";

    if (isNonInteractive) {
      // Use CLI option for database
      const dbOption = cliOptions.db || "auto";

      // Validate database option
      const validDbOptions = ["postgres", "sqlite", "auto"];
      if (!validDbOptions.includes(dbOption)) {
        console.error(`❌ Invalid database option: ${dbOption}`);
        console.error(`   Valid options are: ${validDbOptions.join(", ")}`);
        process.exit(1);
      }

      switch (dbOption) {
        case "postgres":
          dbProvider = "postgres";
          dbInstructions = `
To use PostgreSQL:
1. Make sure PostgreSQL is installed and running
2. Create a database: createdb ${projectName}_dev
3. Set DATABASE_URL in your .env file:
   DATABASE_URL=postgres://username:password@localhost:5432/${projectName}_dev
`;
          break;
        case "sqlite":
          dbProvider = "sqlite";
          dbInstructions = "\nSQLite will be used (no additional setup required).";
          break;
        default:
          dbProvider = "auto";
          dbInstructions =
            "\nThe app will try PostgreSQL first, then fallback to SQLite if not available.";
      }
      if (!cliOptions.quiet) {
        console.log(`\n📊 Database: ${dbProvider}`);
      }
    } else {
      console.log("\n📊 Database Configuration:");
      console.log("1. PostgreSQL (recommended for production)");
      console.log("2. SQLite (perfect for development)");
      console.log("3. Auto-detect (PostgreSQL with SQLite fallback)");

      const dbChoice = (await rl.question("\nChoose database option (1-3) [default: 3]: ")) || "3";

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
          dbInstructions =
            "\nThe app will try PostgreSQL first, then fallback to SQLite if not available.";
      }
    }

    if (!cliOptions.quiet) {
      console.log("\n🔨 Creating your Bun Stack app...\n");
    }

    // Copy template files
    const templateDir = join(import.meta.dir, "templates", "default");
    const templateVariables = {
      projectName: projectName,
      dbProvider: dbProvider,
    };

    await copyTemplateDirectory(templateDir, projectPath, templateVariables, getExcludePatterns());

    if (!cliOptions.quiet) {
      console.log("✅ Project structure created");
    }

    // Change to project directory
    process.chdir(projectPath);

    // Create database directory
    mkdirSync("db", { recursive: true });

    // Install dependencies
    if (!cliOptions.skipInstall) {
      if (!cliOptions.quiet) {
        console.log("\n📦 Installing dependencies...");
      }
      const installProc = Bun.spawn(["bun", "install"], {
        stdout: cliOptions.quiet ? "ignore" : "inherit",
        stderr: cliOptions.quiet ? "ignore" : "inherit",
      });
      await installProc.exited;

      if (installProc.exitCode !== 0) {
        console.error("❌ Failed to install dependencies");
        process.exit(1);
      }

      if (!cliOptions.quiet) {
        console.log("✅ Dependencies installed");
      }
    }

    // Copy .env.example to .env
    const envProc = Bun.spawn(["cp", ".env.example", ".env"], {
      stdout: "inherit",
      stderr: "inherit",
    });
    await envProc.exited;

    // Setup database
    let shouldSetupDb = false;
    if (!cliOptions.skipDbSetup) {
      if (isNonInteractive) {
        shouldSetupDb = true;
      } else {
        const dbSetupAnswer = await rl.question("\n🗄️  Setup database now? (Y/n): ");
        shouldSetupDb = dbSetupAnswer.toLowerCase() !== "n";
      }
    }

    if (shouldSetupDb) {
      if (!cliOptions.quiet) {
        console.log("\n🔧 Setting up database...");
      }
      const dbProc = Bun.spawn(["bun", "run", "db:push"], {
        stdout: cliOptions.quiet ? "ignore" : "inherit",
        stderr: cliOptions.quiet ? "ignore" : "inherit",
      });
      await dbProc.exited;

      if (dbProc.exitCode === 0) {
        if (!cliOptions.quiet) {
          console.log("✅ Database setup complete");
        }

        // Offer to seed (skip in non-interactive mode)
        if (!isNonInteractive) {
          const shouldSeed = await rl.question("\n🌱 Seed database with sample data? (y/N): ");
          if (shouldSeed.toLowerCase() === "y") {
            const seedProc = Bun.spawn(["bun", "run", "db:seed"], {
              stdout: cliOptions.quiet ? "ignore" : "inherit",
              stderr: cliOptions.quiet ? "ignore" : "inherit",
            });
            await seedProc.exited;

            if (seedProc.exitCode === 0 && !cliOptions.quiet) {
              console.log("✅ Database seeded");
            }
          }
        }
      } else {
        if (!cliOptions.quiet) {
          console.log("⚠️  Database setup failed - you can run 'bun run db:push' later");
        }
      }
    }

    // Build CSS
    if (!cliOptions.quiet) {
      console.log("\n🎨 Building CSS...");
    }
    const cssProc = Bun.spawn(["bun", "run", "build:css"], {
      stdout: cliOptions.quiet ? "ignore" : "inherit",
      stderr: cliOptions.quiet ? "ignore" : "inherit",
    });
    await cssProc.exited;

    if (cssProc.exitCode === 0) {
      if (!cliOptions.quiet) {
        console.log("✅ CSS built successfully");
      }
    } else {
      if (!cliOptions.quiet) {
        console.log("⚠️  CSS build failed - you can run 'bun run build:css' later");
      }
    }

    // Success message
    if (!cliOptions.quiet) {
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
    }
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
