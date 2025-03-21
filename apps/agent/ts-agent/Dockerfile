FROM oven/bun:1.2.1 as builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
RUN bun build src/index.ts --outdir dist --target bun

# Final image
FROM oven/bun:1.2.1-slim

WORKDIR /app

# Copy built app
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8000

# Expose the port
EXPOSE 8000

# Start the application
CMD ["bun", "dist/index.js"]
 