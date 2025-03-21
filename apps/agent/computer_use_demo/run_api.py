#!/usr/bin/env python3
"""
Run the Computer Use Demo API server.
"""

import os
import sys
from computer_use_demo.api import start_api_server

def load_env_file():
    """Load environment variables from .env file if it exists"""
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        print("Loading environment variables from .env file")
        with open(env_path) as f:
            for line in f:
                if line.strip() and not line.startswith("#"):
                    key, value = line.strip().split("=", 1)
                    os.environ[key] = value
    else:
        print("No .env file found. Please create one from .env.template")

if __name__ == "__main__":
    load_env_file()
    
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    print(f"Starting Computer Use Demo API server on port {port}...")
    print(f"API will be available at http://0.0.0.0:{port}/api/prompt")
    print(f"API documentation available at http://0.0.0.0:{port}/docs")
    
    # Check if AgentKit wallet configuration is available
    has_cdp = os.environ.get("CDP_API_KEY_NAME") and os.environ.get("CDP_API_KEY_PRIVATE")
    has_private_key = os.environ.get("PRIVATE_KEY") and os.environ.get("PRIVATE_KEY").startswith("0x")
    
    if not (has_cdp or has_private_key):
        print("Warning: Neither CDP API keys nor valid private key found in environment.")
        print("AgentKit blockchain features will be disabled.")
        print("Please configure either CDP API keys or a private key in your .env file.")
    elif has_private_key:
        print("Using private key for blockchain interactions.")
    else:
        print("Using CDP wallet for blockchain interactions.")
    
    start_api_server(host="0.0.0.0", port=port) 