FROM oven/bun:latest

WORKDIR /app

# Copy root package.json and workspace configs
COPY package.json .
COPY bun.lock .
COPY turbo.json .
COPY biome.json .
COPY tsconfig.json .

COPY apps/internal-app /app/apps/internal-app

# Install dependencies
RUN bun install

# Set env variables and expose the port
ENV HOST=0.0.0.0
ENV PORT=5173
ENV NODE_ENV=production
EXPOSE 5173

# Run the application
CMD ["bun", "run", "--cwd", "apps/internal-app", "dev", "--host"] 