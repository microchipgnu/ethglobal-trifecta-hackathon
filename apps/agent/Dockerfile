FROM oven/bun:1.0

WORKDIR /app

# Copy package files and install dependencies
COPY ./apps/agent/package.json .
COPY ./apps/agent/tsconfig.json .
RUN bun install

# Copy source code
COPY ./apps/agent/src ./src

# Start the application
CMD ["bun", "src/index.ts"] 