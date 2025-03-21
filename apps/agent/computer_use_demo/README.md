# Computer Use Demo with AgentKit Integration

This project integrates AgentKit into the Computer Use Demo, allowing the AI agent to perform blockchain operations.

## Features

- Access to blockchain wallets through Coinbase Developer Platform (CDP) or direct private key
- Execute blockchain transactions
- Deploy smart contracts and tokens
- Query price data and chain information
- And more blockchain capabilities

## Setup

1. Copy the environment template and fill in your API keys:
   ```bash
   cp .env.template .env
   # Edit .env with your API keys
   ```

2. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the API server:
   ```bash
   python run_api.py
   ```

## Wallet Configuration Options

### Option 1: Using CDP Wallet Provider
This uses Coinbase Developer Platform for wallet management.

```
# In .env file
CDP_API_KEY_NAME=your_cdp_key_name
CDP_API_KEY_PRIVATE=your_cdp_key_private
NETWORK_ID=base-sepolia
```

### Option 2: Using a Direct Private Key
For more direct control, you can use your own private key.

```
# In .env file
PRIVATE_KEY=0xYourPrivateKeyHere
CHAIN_ID=84532  # Base Sepolia (default)
RPC_URL=https://sepolia.base.org  # Optional: Custom RPC URL

# Optional gas configuration
GAS_LIMIT_MULTIPLIER=1.2
FEE_PER_GAS_MULTIPLIER=1.2
```

## Testing the Integration

1. Test the AgentKit tool directly:
   ```bash
   python test_agentkit.py
   ```

2. Test the API with AgentKit integration:
   ```bash
   python test_api.py
   ```

3. Or send a custom prompt to the API:
   ```bash
   curl -X POST http://localhost:8000/api/prompt \
     -H "Content-Type: application/json" \
     -d '{
       "messages": [
         {
           "role": "user", 
           "content": "What is my blockchain wallet address and balance?"
         }
       ],
       "tool_version": "computer_use_agentkit"
     }'
   ```

## Available Blockchain Actions

The AgentKit integration provides the following blockchain capabilities:

- Get wallet address and balance
- List available blockchain actions
- Execute any blockchain action provided by AgentKit
- Transfer tokens and cryptocurrencies
- Deploy and interact with smart contracts
- Query cryptocurrency prices and blockchain data

## Obtaining API Keys and Private Keys

1. Coinbase Developer Platform (CDP) API keys (for Option 1):
   - Register at [Coinbase Developer Platform](https://docs.cdp.coinbase.com/)
   - Create API keys from your CDP dashboard
   - Set `CDP_API_KEY_NAME` and `CDP_API_KEY_PRIVATE` in your `.env` file

2. Private Key (for Option 2):
   - Generate a private key using web3.py or other Ethereum tools
   - Make sure to prefix with `0x`
   - **SECURITY WARNING**: Never share your private key or commit it to version control
   - Store in `.env` file which should be in `.gitignore`

3. Anthropic API key (for Claude):
   - Register at [Anthropic](https://console.anthropic.com/)
   - Create an API key and set `ANTHROPIC_API_KEY` in your `.env` file 