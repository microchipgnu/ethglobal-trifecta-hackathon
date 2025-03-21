#!/usr/bin/env bun
/**
 * Main entry point for the TS Agent
 */
import dotenv from 'dotenv';
import { startApiServer } from './api';

// Load environment variables
dotenv.config();

// Default port
const DEFAULT_PORT = 8000;

/**
 * Main function to start the API server
 */
function main() {
  try {
    // Get port from environment or command line args
    const port = parseInt(process.env.PORT || process.argv[2] || DEFAULT_PORT.toString(), 10);
    
    console.log(`Starting TS Agent API server on port ${port}...`);
    
    // Check if required environment variables are set
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
    
    if (!hasAnthropicKey) {
      console.warn('Warning: ANTHROPIC_API_KEY environment variable not set.');
      console.warn('Please set this variable in a .env file or environment.');
    }
    
    // Check if AgentKit wallet configuration is available
    const hasCdp = !!process.env.CDP_API_KEY_NAME && !!process.env.CDP_API_KEY_PRIVATE;
    const hasPrivateKey = !!process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.startsWith('0x');
    
    if (!hasCdp && !hasPrivateKey) {
      console.warn('Warning: Neither CDP API keys nor valid private key found in environment.');
      console.warn('AgentKit blockchain features will be disabled.');
    } else if (hasPrivateKey) {
      console.log('Using private key for blockchain interactions.');
    } else {
      console.log('Using CDP wallet for blockchain interactions.');
    }
    
    // Start the API server
    startApiServer(port);
  } catch (error) {
    console.error('Failed to start TS Agent:', error);
    process.exit(1);
  }
}

// Run the main function
if (require.main === module) {
  main();
}

export default main; 