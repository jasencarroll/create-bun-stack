import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join } from "node:path";

export interface TemplateVariables {
  projectName: string;
  dbProvider?: string;
  [key: string]: string | undefined;
}

/**
 * Process a template string by replacing placeholders
 */
export function processTemplate(content: string, variables: TemplateVariables): string {
  let processed = content;

  // Replace all {{variable}} placeholders
  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined) {
      const regex = new RegExp(`{{${key}}}`, "g");
      processed = processed.replace(regex, value);
    }
  }

  return processed;
}

/**
 * Copy a directory recursively, processing templates
 */
export async function copyTemplateDirectory(
  sourceDir: string,
  targetDir: string,
  variables: TemplateVariables,
  excludePatterns: string[] = []
): Promise<void> {
  // Create target directory if it doesn't exist
  mkdirSync(targetDir, { recursive: true });

  const items = readdirSync(sourceDir);

  for (const item of items) {
    // Skip excluded patterns
    if (excludePatterns.some((pattern) => item.includes(pattern))) {
      continue;
    }

    const sourcePath = join(sourceDir, item);
    const targetPath = join(targetDir, item);
    const stat = statSync(sourcePath);

    if (stat.isDirectory()) {
      // Recursively copy directory
      await copyTemplateDirectory(sourcePath, targetPath, variables, excludePatterns);
    } else {
      // Process and copy file
      await copyTemplateFile(sourcePath, targetPath, variables);
    }
  }
}

/**
 * Copy a single file, processing it as a template if it's a text file
 */
export async function copyTemplateFile(
  sourcePath: string,
  targetPath: string,
  variables: TemplateVariables
): Promise<void> {
  // Ensure target directory exists
  mkdirSync(dirname(targetPath), { recursive: true });

  // Determine if file should be processed as template
  const textExtensions = [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".json",
    ".md",
    ".txt",
    ".css",
    ".html",
    ".yml",
    ".yaml",
    ".toml",
    ".env",
    ".gitignore",
  ];

  const shouldProcess = textExtensions.some((ext) => sourcePath.endsWith(ext));

  if (shouldProcess) {
    // Read, process, and write template
    const content = readFileSync(sourcePath, "utf-8");
    const processed = processTemplate(content, variables);
    writeFileSync(targetPath, processed);
  } else {
    // Binary files - just copy
    copyFileSync(sourcePath, targetPath);
  }
}

/**
 * Get list of files to exclude when copying template
 */
export function getExcludePatterns(): string[] {
  return ["node_modules", "bun.lock", ".db", "dist", "build", ".env.local", ".DS_Store", "*.log"];
}
