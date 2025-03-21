# TS Agent

A TypeScript implementation of the Computer Use Agent using Bun and the Vercel AI SDK.

## Features

- TypeScript implementation of the Computer Use Agent
- Tool implementations for bash, computer control, file editing, and blockchain interaction
- Integration with Anthropic's Claude models
- Support for different tool versions and configurations
- Compatible with existing Docker setup

## Prerequisites

- [Bun](https://bun.sh/) 1.0.0 or higher
- Anthropic API key

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd ts-agent

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys
```

## Usage

```bash
# Development mode
bun dev

# Build for production
bun build

# Start production server
bun start
```

## API Endpoints

- **POST /api/prompt**: Main endpoint for sending messages to the agent
- **GET /health**: Health check endpoint

## Configuration

Configuration is done through environment variables:

- `ANTHROPIC_API_KEY`: Your Anthropic API key (required)
- `PORT`: Port to run the server on (default: 8000)
- `PRIVATE_KEY`: Private key for blockchain interactions (optional)
- `CDP_API_KEY_NAME` and `CDP_API_KEY_PRIVATE`: CDP wallet configuration (optional)

## Docker

The agent is designed to work with the existing Docker setup. The TypeScript agent can be integrated into the existing setup by:

1. Building the TS agent
2. Using the existing Docker container for the computer environment
3. Configuring the agent to communicate with the Docker container

## Development

```bash
# Run tests
bun test

# Lint code
bun lint
```

## License

This project is licensed under the [MIT License](LICENSE).
