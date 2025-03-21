#!/usr/bin/env python3
"""
Test the AgentKit integration with the Computer Use Demo.
This script directly tests the AgentKitTool functionality.
"""

import os
import json
from tools.agentkit_tool import AgentKitTool

def main():
    """Test the AgentKit integration."""
    # Check wallet configuration
    has_cdp = os.environ.get("CDP_API_KEY_NAME") and os.environ.get("CDP_API_KEY_PRIVATE")
    has_private_key = os.environ.get("PRIVATE_KEY") and os.environ.get("PRIVATE_KEY").startswith("0x")
    
    if not (has_cdp or has_private_key):
        print("Error: No wallet configuration found.")
        print("Please set either CDP API keys or a private key in your .env file.")
        print("  For CDP wallet: CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE")
        print("  For private key: PRIVATE_KEY (must start with 0x)")
        return
    
    # Initialize the AgentKit tool
    print("Initializing AgentKit tool...")
    if has_private_key:
        print("Using private key wallet provider.")
    else:
        print("Using CDP wallet provider.")
    
    agentkit = AgentKitTool()
    
    # Test get_wallet_address
    print("\nTesting get_wallet_address...")
    wallet_address_result = await_result(agentkit.get_wallet_address({}))
    print(f"Wallet address: {wallet_address_result.output if wallet_address_result.output else wallet_address_result.error}")
    
    # Test get_wallet_balance
    print("\nTesting get_wallet_balance...")
    balance_result = await_result(agentkit.get_wallet_balance({}))
    print(f"Wallet balance: {balance_result.output if balance_result.output else balance_result.error}")
    
    # Test list_blockchain_actions
    print("\nTesting list_blockchain_actions...")
    actions_result = await_result(agentkit.list_blockchain_actions({}))
    if actions_result.output:
        print("Available actions:")
        print(actions_result.output)
    else:
        print(f"Error: {actions_result.error}")
    
    # Test execute_blockchain_action
    print("\nTesting execute_blockchain_action with fetch_price...")
    price_result = await_result(agentkit.execute_blockchain_action({
        "action_name": "fetch_price",
        "args": {"symbol": "ETH"}
    }))
    print(f"ETH price: {price_result.output if price_result.output else price_result.error}")

def await_result(coroutine):
    """Helper function to run coroutines synchronously."""
    import asyncio
    try:
        return asyncio.run(coroutine)
    except RuntimeError:
        # If already in an event loop, use a new one
        loop = asyncio.new_event_loop()
        result = loop.run_until_complete(coroutine)
        loop.close()
        return result

if __name__ == "__main__":
    # Load environment variables
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(env_path):
        print("Loading environment variables from .env file")
        with open(env_path) as f:
            for line in f:
                if line.strip() and not line.startswith("#"):
                    key, value = line.strip().split("=", 1)
                    os.environ[key] = value
    
    main() 