from typing import Any, Dict, Literal, Optional
import os
from coinbase_agentkit import (
    AgentKit, 
    AgentKitConfig, 
    CdpWalletProvider, 
    CdpWalletProviderConfig,
    EthAccountWalletProvider,
    EthAccountWalletProviderConfig
)
from eth_account import Account
from anthropic.types.beta import BetaToolUnionParam

from .base import BaseAnthropicTool, ToolResult


class BaseAgentKitTool:
    """Base tool for blockchain interactions using Coinbase AgentKit."""

    name: Literal["agentkit"] = "agentkit"

    def __init__(self):
        print("Initializing AgentKitTool...")
        self._validate_environment()
        self.agent_kit = self._initialize_agent_kit()
        if not self.agent_kit:
            print("WARNING: agent_kit initialization failed!")
        self.available_actions = self._get_available_actions() if self.agent_kit else []
        print(f"Found {len(self.available_actions)} available actions")

    def _validate_environment(self):
        """Validate that necessary environment variables are set."""
        private_key_vars = ["PRIVATE_KEY"]
        cdp_vars = ["CDP_API_KEY_NAME", "CDP_API_KEY_PRIVATE"]
        
        private_key_status = bool(os.environ.get("PRIVATE_KEY"))
        cdp_status = all(bool(os.environ.get(var)) for var in cdp_vars)
        
        if not (private_key_status or cdp_status):
            print("WARNING: Neither private key nor CDP environment variables are set.")
            print(f"Private key: {bool(os.environ.get('PRIVATE_KEY'))}")
            print(f"CDP keys: {[f'{var}={bool(os.environ.get(var))}' for var in cdp_vars]}")
            return False
        return True

    def _initialize_agent_kit(self) -> Optional[AgentKit]:
        """Initialize the AgentKit instance with either CDP wallet or private key."""
        # Check if private key is available - prefer private key if present
        private_key = os.environ.get("PRIVATE_KEY")
        
        print(f"Initializing AgentKit with private_key available: {bool(private_key)}")
        
        if private_key and private_key.startswith("0x"):
            return self._initialize_with_private_key(private_key)
        else:
            print("Falling back to CDP initialization")
            return self._initialize_with_cdp()
    
    def _initialize_with_private_key(self, private_key: str) -> Optional[AgentKit]:
        """Initialize AgentKit with a private key using EthAccountWalletProvider."""
        try:
            # Get account from private key
            account = Account.from_key(private_key)
            print(f"Using account with address: {account.address}")
            
            # Get chain_id or rpc_url from environment
            chain_id = os.environ.get("CHAIN_ID")
            rpc_url = os.environ.get("RPC_URL")
            
            if not (chain_id or rpc_url):
                print("Warning: Neither CHAIN_ID nor RPC_URL specified. Defaulting to Base Sepolia (84532).")
                chain_id = "84532"  # Base Sepolia by default
            
            # Configure the wallet provider
            wallet_config = EthAccountWalletProviderConfig(
                account=account,
                chain_id=chain_id,
                rpc_url=rpc_url
            )
            
            # Add gas configuration if provided
            gas_limit_multiplier = os.environ.get("GAS_LIMIT_MULTIPLIER")
            fee_per_gas_multiplier = os.environ.get("FEE_PER_GAS_MULTIPLIER")
            
            if gas_limit_multiplier or fee_per_gas_multiplier:
                wallet_config.gas = {
                    "gas_limit_multiplier": float(gas_limit_multiplier) if gas_limit_multiplier else 1.0,
                    "fee_per_gas_multiplier": float(fee_per_gas_multiplier) if fee_per_gas_multiplier else 1.0
                }
            
            wallet_provider = EthAccountWalletProvider(wallet_config)
            
            return AgentKit(AgentKitConfig(
                wallet_provider=wallet_provider
            ))
        except Exception as e:
            print(f"Error initializing AgentKit with private key: {e}")
            return None
    
    def _initialize_with_cdp(self) -> Optional[AgentKit]:
        """Initialize AgentKit with CDP wallet provider."""
        api_key_name = os.environ.get("CDP_API_KEY_NAME")
        api_key_private = os.environ.get("CDP_API_KEY_PRIVATE")
        
        if not api_key_name or not api_key_private:
            print("Warning: CDP API keys not found in environment. Some AgentKit features may not work.")
            return None
        
        network_id = os.environ.get("NETWORK_ID", "base-sepolia")
        
        try:
            wallet_provider = CdpWalletProvider(CdpWalletProviderConfig(
                api_key_name=api_key_name,
                api_key_private=api_key_private,
                network_id=network_id
            ))
            
            return AgentKit(AgentKitConfig(
                wallet_provider=wallet_provider
            ))
        except Exception as e:
            print(f"Error initializing AgentKit with CDP: {e}")
            return None

    def _get_available_actions(self) -> list[Dict[str, Any]]:
        """Get list of available blockchain actions."""
        if not self.agent_kit:
            return []
            
        actions = []
        for provider in self.agent_kit.action_providers:
            for action in provider.actions:
                actions.append({
                    "name": action.name,
                    "description": action.description,
                    "provider": provider.name,
                    "schema": action.schema.model_json_schema() if action.schema else None
                })
        return actions

    async def get_wallet_address(self, args: Dict[str, Any]) -> ToolResult:
        """Get the wallet address for blockchain interactions."""
        if not self.agent_kit:
            return ToolResult(error="AgentKit not initialized. Check wallet configuration.")
        
        try:
            return ToolResult(output=self.agent_kit.wallet_provider.address)
        except Exception as e:
            return ToolResult(error=f"Error getting wallet address: {str(e)}")

    async def get_wallet_balance(self, args: Dict[str, Any]) -> ToolResult:
        """Get the wallet's native token balance."""
        if not self.agent_kit:
            return ToolResult(error="AgentKit not initialized. Check wallet configuration.")
        
        try:
            result = self.agent_kit.execute_action("get_balance", {})
            return ToolResult(output=f"Balance: {result}")
        except Exception as e:
            return ToolResult(error=f"Error getting balance: {str(e)}")

    async def list_blockchain_actions(self, args: Dict[str, Any]) -> ToolResult:
        """List all available blockchain actions with descriptions."""
        if not self.agent_kit:
            return ToolResult(error="AgentKit not initialized. Check wallet configuration.")
        
        if not self.available_actions:
            return ToolResult(output="No blockchain actions available.")
        
        output = "Available blockchain actions:\n\n"
        for action in self.available_actions:
            output += f"• {action['name']}: {action['description']}\n"
        
        return ToolResult(output=output)

    async def execute_blockchain_action(self, args: Dict[str, Any]) -> ToolResult:
        """Execute a blockchain action using AgentKit."""
        if not self.agent_kit:
            return ToolResult(error="AgentKit not initialized. Check wallet configuration.")
        
        action_name = args.get("action_name")
        action_args = args.get("args", {})
        
        if not action_name:
            return ToolResult(error="Missing action_name parameter")
        
        try:
            result = self.agent_kit.execute_action(action_name, action_args)
            return ToolResult(output=f"Action '{action_name}' result: {result}")
        except Exception as e:
            return ToolResult(error=f"Error executing action {action_name}: {str(e)}")


class AgentKitTool20241022(BaseAgentKitTool, BaseAnthropicTool):
    """AgentKit tool implementation for 2024-10-22 API version."""
    
    api_type: Literal["agentkit_20241022"] = "agentkit_20241022"
    
    def to_params(self) -> BetaToolUnionParam:
        """Convert the tool to a param format for Anthropic."""
        return {"name": self.name, "type": self.api_type}
    
    async def __call__(self, **kwargs) -> ToolResult:
        """Execute a blockchain action using AgentKit."""
        action = kwargs.get("action", "")
        print(f"AgentKitTool20241022 called with action: {action}, kwargs: {kwargs}")
        
        if not action:
            return ToolResult(error="No action specified. Please provide an 'action' parameter.")
        
        if action == "get_wallet_address":
            return await self.get_wallet_address(kwargs)
        elif action == "get_wallet_balance":
            return await self.get_wallet_balance(kwargs)
        elif action == "list_blockchain_actions":
            return await self.list_blockchain_actions(kwargs)
        elif action == "execute_blockchain_action":
            return await self.execute_blockchain_action(kwargs)
        else:
            return ToolResult(error=f"Unknown action: {action}")


class AgentKitTool20250124(BaseAgentKitTool, BaseAnthropicTool):
    """AgentKit tool implementation for 2025-01-24 API version."""
    
    api_type: Literal["agentkit_20250124"] = "agentkit_20250124"
    
    def to_params(self) -> BetaToolUnionParam:
        """Convert the tool to a param format for Anthropic."""
        return {"name": self.name, "type": self.api_type}
    
    async def __call__(self, **kwargs) -> ToolResult:
        """Execute a blockchain action using AgentKit."""
        action = kwargs.get("action", "")
        print(f"AgentKitTool20250124 called with action: {action}, kwargs: {kwargs}")
        
        if not action:
            return ToolResult(error="No action specified. Please provide an 'action' parameter.")
        
        if action == "get_wallet_address":
            return await self.get_wallet_address(kwargs)
        elif action == "get_wallet_balance":
            return await self.get_wallet_balance(kwargs)
        elif action == "list_blockchain_actions":
            return await self.list_blockchain_actions(kwargs)
        elif action == "execute_blockchain_action":
            return await self.execute_blockchain_action(kwargs)
        else:
            return ToolResult(error=f"Unknown action: {action}") 