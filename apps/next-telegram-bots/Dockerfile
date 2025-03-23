FROM oven/bun:latest

WORKDIR /app

# Copy root package.json and workspace configs
COPY package.json .
COPY bun.lock .
COPY turbo.json .
COPY biome.json .
COPY tsconfig.json .

COPY apps/next-telegram-bots /app/apps/next-telegram-bots
COPY .env /app/apps/next-telegram-bots/.env

# Install dependencies
RUN bun install

# Build the Next.js application
RUN bun run --cwd apps/next-telegram-bots build

# Set env variables and expose the port
ENV HOST="0.0.0.0"
ENV PORT="3420"
ENV NODE_ENV="development"

EXPOSE 3420

# Run the application
CMD ["bun", "run", "--cwd", "apps/next-telegram-bots", "start"]