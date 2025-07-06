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

# Create a startup script that handles missing environment variables
RUN echo '#!/bin/sh\n\
if [ -z "$JWT_SECRET" ]; then\n\
  echo "⚠️  JWT_SECRET not set. Generating a random one..."\n\
  export JWT_SECRET=$(openssl rand -hex 32)\n\
  echo "Generated JWT_SECRET (save this for subsequent deployments): $JWT_SECRET"\n\
fi\n\
\n\
exec bun run start' > /app/docker-entrypoint.sh && \
chmod +x /app/docker-entrypoint.sh

# Start the server
CMD ["/app/docker-entrypoint.sh"]