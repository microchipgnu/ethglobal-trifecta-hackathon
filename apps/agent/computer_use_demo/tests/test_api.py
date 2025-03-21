#!/usr/bin/env python3
"""
Test the API with AgentKit integration by sending a simple prompt.
"""

import os
import sys
import json
import requests

def main():
    """Test the API with AgentKit integration."""
    # Check if the API is running
    api_url = "http://localhost:8000/api/prompt"
    try:
        # Simple prompt to test AgentKit integration
        test_prompt = {
            "messages": [
                {
                    "role": "user",
                    "content": "What is my blockchain wallet address and balance? List the available blockchain actions I can use."
                }
            ],
            "tool_version": "computer_use_agentkit"
        }
        
        print(f"Sending test prompt to {api_url}...")
        response = requests.post(api_url, json=test_prompt)
        
        if response.status_code != 200:
            print(f"Error: Received status code {response.status_code}")
            print(response.text)
            return
        
        # Parse the response
        result = response.json()
        
        # Print the model's response
        print("\nModel response:")
        for block in result.get("response", []):
            if block.get("type") == "text":
                print(block.get("text"))
        
        # Print tool results if any
        tool_results = result.get("tool_results", [])
        if tool_results:
            print("\nTool results:")
            for tool_result in tool_results:
                print(f"- {tool_result.get('tool_id')}: {tool_result.get('output')}")
        
    except requests.exceptions.ConnectionError:
        print(f"Error: Could not connect to {api_url}")
        print("Make sure the API server is running with: python run_api.py")
        return
    except Exception as e:
        print(f"Error: {e}")
        return

if __name__ == "__main__":
    main() 