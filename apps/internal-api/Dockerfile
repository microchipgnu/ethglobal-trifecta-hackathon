FROM oven/bun:1.0

WORKDIR /app

# Copy package files and install dependencies
COPY ./apps/internal-api/package.json .
COPY ./apps/internal-api/tsconfig.json .
RUN bun install

# Copy source code
COPY ./apps/internal-api/src ./src

# Expose the port
EXPOSE ${INTERNAL_API_PORT:-3000}

# Start the application
CMD ["bun", "src/index.ts"] 