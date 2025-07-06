# Use the official Bun image
FROM oven/bun:1.2.17-alpine

# Set working directory
WORKDIR /app

# Copy SPA package files
COPY ./package.json ./bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy SPA source files
COPY . .

# Build the application
RUN bun run build

# Verify build output
RUN ls -la public/
RUN echo "Contents of main.js (first 100 chars):" && head -c 100 public/main.js

# Expose port (Railway will override this)
EXPOSE 3000

# Set production environment
ENV NODE_ENV=production

# Start the server
CMD ["bun", "run", "start"]