FROM oven/bun:1.0

WORKDIR /app

# Copy package files and install dependencies
COPY ./apps/agent/package.json .
COPY ./apps/agent/tsconfig.json .
RUN bun install

# Copy source code
COPY ./apps/agent/src ./src

# Expose the port
EXPOSE ${INTERNAL_API_PORT:-3030}

# Start the application
CMD ["bun", "src/index.ts"] 