FROM oven/bun:latest

WORKDIR /app

# Copy root package.json and workspace configs
COPY package.json .
COPY bun.lock .
COPY turbo.json .
COPY biome.json .
COPY tsconfig.json .

COPY apps/next-app /app/apps/next-app
COPY .env /app/apps/next-app/.env

# Install dependencies
RUN bun install

# Build the Next.js application
RUN bun run --cwd apps/next-app build

# Set env variables and expose the port
ENV HOST=0.0.0.0
ENV PORT=3069
EXPOSE 3069

# Run the application
CMD ["bun", "run", "--cwd", "apps/next-app", "start"]