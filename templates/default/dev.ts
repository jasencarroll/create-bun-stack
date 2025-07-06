import { watch } from "node:fs";
import { join } from "node:path";
import { $ } from "bun";

const srcDir = join(import.meta.dir, "src/app");
const serverFile = join(import.meta.dir, "src/server/index.ts");

console.log("🚀 Starting development server with HMR...");

// Build initially
console.log("🔨 Building assets...");
await $`bunx tailwindcss -i ./src/app/index.css -o ./public/styles.css`;
await $`bun build src/app/main.tsx --outdir=public --outfile=main.js`;

// Start server with environment variable
const server = Bun.spawn(["bun", "--hot", serverFile], {
  stdio: ["inherit", "inherit", "inherit"],
  env: { ...process.env, DEV_MODE: "true" },
});

let rebuildTimeout: Timer | null = null;

// Watch for changes
const _watcher = watch(srcDir, { recursive: true }, async (_event, filename) => {
  if (!filename) return;

  // Clear existing timeout
  if (rebuildTimeout) {
    clearTimeout(rebuildTimeout);
  }

  // Debounce rebuilds
  rebuildTimeout = setTimeout(async () => {
    const ext = filename.substring(filename.lastIndexOf("."));

    if (ext === ".css") {
      console.log("🎨 Rebuilding CSS...");
      await $`bunx tailwindcss -i ./src/app/index.css -o ./public/styles.css`;
      // Update timestamp to trigger HMR
      await Bun.write(".hmr-timestamp", Date.now().toString());
    } else if ([".tsx", ".ts", ".jsx", ".js"].includes(ext)) {
      console.log("📝 Rebuilding JS...");
      await $`bun build src/app/main.tsx --outdir=public --outfile=main.js`;
      // Update timestamp to trigger HMR
      await Bun.write(".hmr-timestamp", Date.now().toString());
    }
  }, 100);
});

// Write initial timestamp
await Bun.write(".hmr-timestamp", Date.now().toString());

console.log("✨ Development server running at http://localhost:3000");
console.log("👀 Watching for changes in ./src/app");

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n👋 Shutting down...");
  server.kill();
  process.exit(0);
});
