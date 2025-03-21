import axios from 'axios';
import { BaseAnthropicTool, CLIResult } from './base';
import type { ToolResult } from './base';

/**
 * Tool for interacting with blockchain via AgentKit
 */
export class AgentKitTool extends BaseAnthropicTool {
  name = 'agentkit';
  description = 'Interact with blockchain networks using AgentKit capabilities';

  async call(params: {
    action: string;
    network?: string;
    contract_address?: string;
    abi?: string;
    function_name?: string;
    args?: any[];
    value?: string;
    to?: string;
    data?: string;
    private_key?: string;
  }): Promise<ToolResult> {
    const { action } = params;

    try {
      switch (action) {
        case 'get_balance':
          return await this.getBalance(params);
        case 'get_networks':
          return await this.getNetworks();
        case 'get_transactions':
          return await this.getTransactions(params);
        case 'send_transaction':
          return await this.sendTransaction(params);
        case 'call_contract':
          return await this.callContract(params);
        default:
          return new CLIResult(undefined, `Unknown action: ${action}`);
      }
    } catch (error: any) {
      return new CLIResult(undefined, `Error in agentkit tool: ${error.message}`);
    }
  }

  getParameters() {
    return {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: 'Action to perform: get_balance, get_networks, get_transactions, send_transaction, call_contract',
          enum: ['get_balance', 'get_networks', 'get_transactions', 'send_transaction', 'call_contract']
        },
        network: {
          type: 'string',
          description: 'Blockchain network to interact with (e.g., "ethereum", "polygon", "arbitrum")'
        },
        contract_address: {
          type: 'string',
          description: 'Address of the smart contract to interact with'
        },
        abi: {
          type: 'string',
          description: 'ABI of the smart contract function'
        },
        function_name: {
          type: 'string',
          description: 'Name of the function to call on the smart contract'
        },
        args: {
          type: 'array',
          description: 'Arguments to pass to the contract function'
        },
        value: {
          type: 'string',
          description: 'Amount of native currency to send with the transaction (in wei)'
        },
        to: {
          type: 'string',
          description: 'Recipient address for transactions'
        },
        data: {
          type: 'string',
          description: 'Raw transaction data'
        },
        private_key: {
          type: 'string',
          description: 'Private key to sign transactions (optional, falls back to environment config)'
        }
      },
      required: ['action']
    };
  }

  private async getBalance(params: { network?: string; to?: string }): Promise<ToolResult> {
    try {
      const { network, to } = params;
      
      if (!network) {
        return new CLIResult(undefined, 'Network is required for get_balance action');
      }
      
      if (!to) {
        return new CLIResult(undefined, 'Address (to) is required for get_balance action');
      }

      const response = await axios.post('http://internal-api:3030/api/blockchain/balance', {
        network,
        address: to
      });

      return new CLIResult(JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      return new CLIResult(undefined, `Failed to get balance: ${error.message}`);
    }
  }

  private async getNetworks(): Promise<ToolResult> {
    try {
      const response = await axios.get('http://internal-api:3030/api/blockchain/networks');
      return new CLIResult(JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      return new CLIResult(undefined, `Failed to get networks: ${error.message}`);
    }
  }

  private async getTransactions(params: { network?: string; to?: string }): Promise<ToolResult> {
    try {
      const { network, to } = params;
      
      if (!network) {
        return new CLIResult(undefined, 'Network is required for get_transactions action');
      }
      
      if (!to) {
        return new CLIResult(undefined, 'Address (to) is required for get_transactions action');
      }

      const response = await axios.post('http://internal-api:3030/api/blockchain/transactions', {
        network,
        address: to
      });

      return new CLIResult(JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      return new CLIResult(undefined, `Failed to get transactions: ${error.message}`);
    }
  }

  private async sendTransaction(params: {
    network?: string;
    to?: string;
    value?: string;
    data?: string;
    private_key?: string;
  }): Promise<ToolResult> {
    try {
      const { network, to, value, data, private_key } = params;
      
      if (!network) {
        return new CLIResult(undefined, 'Network is required for send_transaction action');
      }
      
      if (!to) {
        return new CLIResult(undefined, 'Recipient address (to) is required for send_transaction action');
      }

      const response = await axios.post('http://internal-api:3030/api/blockchain/transaction', {
        network,
        to,
        value: value || '0',
        data: data || '0x',
        private_key
      });

      return new CLIResult(JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      return new CLIResult(undefined, `Failed to send transaction: ${error.message}`);
    }
  }

  private async callContract(params: {
    network?: string;
    contract_address?: string;
    abi?: string;
    function_name?: string;
    args?: any[];
    value?: string;
    private_key?: string;
  }): Promise<ToolResult> {
    try {
      const { network, contract_address, abi, function_name, args, value, private_key } = params;
      
      if (!network) {
        return new CLIResult(undefined, 'Network is required for call_contract action');
      }
      
      if (!contract_address) {
        return new CLIResult(undefined, 'Contract address is required for call_contract action');
      }
      
      if (!abi) {
        return new CLIResult(undefined, 'Contract ABI is required for call_contract action');
      }
      
      if (!function_name) {
        return new CLIResult(undefined, 'Function name is required for call_contract action');
      }

      const response = await axios.post('http://internal-api:3030/api/blockchain/contract', {
        network,
        address: contract_address,
        abi,
        functionName: function_name,
        args: args || [],
        value: value || '0',
        private_key
      });

      return new CLIResult(JSON.stringify(response.data, null, 2));
    } catch (error: any) {
      return new CLIResult(undefined, `Failed to call contract: ${error.message}`);
    }
  }
}

/**
 * Create different versions of the AgentKit tool if needed
 */
export class AgentKitTool20241022 extends AgentKitTool {}
export class AgentKitTool20250124 extends AgentKitTool {} 