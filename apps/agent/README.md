# Agent

TypeScript implementation of a Computer Use Agent using Bun and the Vercel AI SDK.

## Overview

This agent provides a powerful interface for using Claude models to interact with a computer through a set of tools:

- **Bash Tool**: Execute shell commands in the Linux environment
- **Computer Tool**: Control the computer (screenshots, mouse clicks, typing)
- **Edit Tool**: Edit files or view their contents
- **AgentKit Tool**: Interact with blockchain networks (optional)

The agent is designed to work with a Docker container that provides a virtual desktop environment.

## Implementation

The agent is implemented in TypeScript, using:

- **Bun**: Fast JavaScript/TypeScript runtime
- **Vercel AI SDK**: For AI model integration
- **Express**: For the API server
- **Anthropic SDK**: For Claude model integration

## Directory Structure

- `ts-agent/`: TypeScript implementation of the Computer Use Agent
- `image/`: Docker image configuration for the virtual desktop environment

## Getting Started

1. Set up environment variables:
   ```bash
   cd ts-agent
   cp .env.example .env
   # Edit .env with your API keys
   ```

2. Install dependencies:
   ```bash
   cd ts-agent
   bun install
   ```

3. Run the development server:
   ```bash
   bun dev
   ```

See the README in each subdirectory for more specific instructions.