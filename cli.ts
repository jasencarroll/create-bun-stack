#!/usr/bin/env bun

import { chmodSync, existsSync, lstatSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline/promises";
import { copyTemplateDirectory, getExcludePatterns } from "./utils/template";

// Parse command line arguments
export function parseArgs(argv?: string[]) {
  const args = argv ?? process.argv.slice(2);
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
      case "-n": {
        const value = args[i + 1];
        if (!value || value.startsWith("-")) {
          console.error("❌ --name requires a value");
          process.exit(1);
        }
        options.name = value;
        i++;
        break;
      }
      case "--db":
      case "-d": {
        const value = args[i + 1];
        if (!value || value.startsWith("-")) {
          console.error("❌ --db requires a value (postgres, sqlite, or auto)");
          process.exit(1);
        }
        options.db = value;
        i++;
        break;
      }
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
      default:
        if (arg.startsWith("-")) {
          console.error(`❌ Unknown option: ${arg}`);
          console.error("   Run with --help to see available options");
          process.exit(1);
        }
    }
  }

  return options;
}

// Validate project name and return error message, or null if valid
export function validateProjectName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return "Project name is required";
  }

  // Allow single-character names (letters or digits only)
  if (name.length === 1) {
    if (!/^[a-z0-9]$/i.test(name)) {
      return "Single-character project name must be a letter or number";
    }
  } else {
    const validProjectName = /^[a-z0-9][a-z0-9-]*[a-z0-9]$/i;
    if (!validProjectName.test(name)) {
      return "Project name must contain only letters, numbers, and hyphens.\n   It must start and end with a letter or number.\n   Example: my-awesome-app";
    }
  }

  const reservedNames = ["node_modules", "test", "tests", "src", "dist", "build", "public"];
  if (reservedNames.includes(name.toLowerCase())) {
    return `"${name}" is a reserved name. Please choose a different name.`;
  }

  return null;
}

async function main() {
  const cliOptions = parseArgs();
  const isNonInteractive = cliOptions.name !== undefined;

  // Only create readline for interactive mode
  const rl = isNonInteractive ? null : readline.createInterface({ input, output });

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

  let sigintHandler: (() => void) | null = null;

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
      projectName = await rl!.question("📝 Project name: ");
    }

    const nameError = validateProjectName(projectName);
    if (nameError) {
      console.error(`❌ ${nameError}`);
      process.exit(1);
    }

    const projectPath = join(process.cwd(), projectName);

    // Atomically create the project directory (prevents TOCTOU race conditions)
    try {
      mkdirSync(projectPath);
    } catch (err: unknown) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code === "EEXIST") {
        console.error(`❌ Directory ${projectName} already exists`);
      } else if (code === "EACCES" || code === "EPERM") {
        console.error(`❌ Permission denied: cannot create directory ${projectName}`);
      } else {
        console.error(`❌ Failed to create directory: ${(err as Error).message}`);
      }
      process.exit(1);
    }

    // Verify the path is not a symlink (defense against symlink attacks)
    if (lstatSync(projectPath).isSymbolicLink()) {
      rmSync(projectPath);
      console.error("❌ Project path is a symbolic link. Aborting for safety.");
      process.exit(1);
    }

    // Clean up on Ctrl+C
    sigintHandler = () => {
      console.log("\n\n⚠️  Cancelled. Cleaning up...");
      rl?.close();
      if (existsSync(projectPath)) {
        rmSync(projectPath, { recursive: true, force: true });
        console.log("   Removed partial project directory.");
      }
      process.exit(130);
    };
    process.on("SIGINT", sigintHandler);

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

      const dbChoice = (await rl!.question("\nChoose database option (1-3) [default: 3]: ")) || "3";

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

    if (!existsSync(templateDir)) {
      console.error("❌ Template directory not found. Your create-bun-stack installation may be corrupted.");
      console.error("   Try reinstalling: bun install -g create-bun-stack");
      process.exit(1);
    }
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

    // Create .gitignore if it doesn't exist
    const gitignorePath = join(projectPath, ".gitignore");
    try {
      await Bun.file(gitignorePath).text();
    } catch {
      // .gitignore doesn't exist, create it automatically
      const gitignoreContent = `node_modules
.DS_Store
*.log
.env
.env.local
dist/
db/*.sqlite
db/*.sqlite-journal
db/*.db
db/*.db-journal
db/test.db
db/test.db-journal
drizzle/

# Build output
public/styles.css
public/main.js
public/main.js.map

# HMR
.hmr-timestamp

# Production build
dist/
`;
      await Bun.write(gitignorePath, gitignoreContent);
      if (!cliOptions.quiet) {
        console.log("✅ Created .gitignore file");
      }
    }

    // Prompt for git init
    let shouldInitGit = false;
    if (!isNonInteractive) {
      const gitInitAnswer = await rl!.question("\n🐙 Initialize git repository? (Y/n): ");
      shouldInitGit = gitInitAnswer.toLowerCase() !== "n";
    }

    if (shouldInitGit) {
      const gitInitProc = Bun.spawn(["git", "init"], {
        stdout: cliOptions.quiet ? "ignore" : "inherit",
        stderr: cliOptions.quiet ? "ignore" : "inherit",
      });
      await gitInitProc.exited;

      if (gitInitProc.exitCode === 0) {
        if (!cliOptions.quiet) {
          console.log("✅ Initialized git repository");
        }
      } else {
        if (!cliOptions.quiet) {
          console.log("⚠️  Failed to initialize git repository");
        }
      }
    }

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

    // Copy .env.example to .env with restrictive permissions
    const envExamplePath = join(projectPath, ".env.example");
    const envPath = join(projectPath, ".env");
    if (existsSync(envExamplePath)) {
      try {
        const envContent = await Bun.file(envExamplePath).text();
        await Bun.write(envPath, envContent);
        chmodSync(envPath, 0o600); // Owner read/write only — .env contains secrets
      } catch {
        if (!cliOptions.quiet) {
          console.log("⚠️  Could not copy .env.example to .env - you can do this manually");
        }
      }
    }

    // Setup database
    let shouldSetupDb = false;
    if (!cliOptions.skipDbSetup) {
      if (isNonInteractive) {
        shouldSetupDb = true;
      } else {
        const dbSetupAnswer = await rl!.question("\n🗄️  Setup database now? (Y/n): ");
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
          const shouldSeed = await rl!.question("\n🌱 Seed database with sample data? (y/N): ");
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
    if (sigintHandler) {
      process.removeListener("SIGINT", sigintHandler);
    }
    rl?.close();
  }
}

// Run the CLI
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
