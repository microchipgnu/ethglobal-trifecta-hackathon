FROM oven/bun:1.0

# Install required system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    imagemagick \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install dependencies
COPY ./apps/agent/package.json .
COPY ./apps/agent/tsconfig.json .
RUN bun install

# Copy source code
COPY ./apps/agent/src ./src

# Start the application
CMD ["bun", "src/index.ts"] 