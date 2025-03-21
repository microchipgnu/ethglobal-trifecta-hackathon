import express from 'express';
import { z } from 'zod';
import dotenv from 'dotenv';
import { Anthropic } from '@anthropic-ai/sdk';
import { APIProvider, PROVIDER_TO_DEFAULT_MODEL_NAME, samplingLoop } from '../loop';
import { ToolResult } from '../tools';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
app.use(express.json());

// Enable CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Define request validation schemas
const MessageSchema = z.object({
  role: z.string(),
  content: z.union([
    z.string(),
    z.array(z.record(z.any()))
  ])
});

const PromptRequestSchema = z.object({
  messages: z.array(MessageSchema),
  model: z.string().optional(),
  provider: z.string().optional(),
  tool_version: z.string().optional(),
  max_tokens: z.number().optional(),
  system_prompt_suffix: z.string().optional(),
  only_n_most_recent_images: z.number().optional(),
  thinking_budget: z.number().optional(),
  token_efficient_tools_beta: z.boolean().optional(),
  maintain_conversation: z.boolean().optional()
});

// Define response schemas
interface ToolResultResponse {
  type: string;
  output: any;
  tool_id: string;
}

interface PromptResponse {
  response: any[];
  tool_results: ToolResultResponse[];
  messages: any[];
}

// Store conversations per client
const conversations = new Map<string, any[]>();

// Track responses and tool results
let collectedResponses: any[] = [];
let collectedToolResults: Record<string, ToolResult> = {};

// Callbacks
function outputCallback(block: any): void {
  collectedResponses.push(block);
}

function toolOutputCallback(toolOutput: ToolResult, toolId: string): void {
  collectedToolResults[toolId] = toolOutput;
}

function apiResponseCallback(request: any, response: any, error: Error | null): void {
  if (error) {
    console.error(`API Error: ${error.message}`);
  }
}

// Get API key based on provider
async function getApiKey(provider: string = APIProvider.ANTHROPIC): Promise<string> {
  if (provider === APIProvider.ANTHROPIC) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable not set');
    }
    return apiKey;
  } else if (provider === APIProvider.BEDROCK) {
    throw new Error('Bedrock provider not implemented in TypeScript version yet');
  } else if (provider === APIProvider.VERTEX) {
    throw new Error('Vertex provider not implemented in TypeScript version yet');
  } else {
    throw new Error(`Unknown provider: ${provider}`);
  }
}

// Define routes
app.post('/api/prompt', async (req, res) => {
  try {
    // Validate request
    const validation = PromptRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Invalid request format', details: validation.error });
    }

    const {
      messages,
      model = PROVIDER_TO_DEFAULT_MODEL_NAME[APIProvider.ANTHROPIC],
      provider = APIProvider.ANTHROPIC,
      tool_version = 'computer_use_agentkit_20250124',
      max_tokens = 4096,
      system_prompt_suffix = '',
      only_n_most_recent_images = 3,
      thinking_budget = null,
      token_efficient_tools_beta = false,
      maintain_conversation = false
    } = req.body;

    // Get unique conversation ID from client (or use default)
    const clientId = req.headers['x-client-id'] as string || 'default';
    
    // Get previous conversation if maintain_conversation is true
    let conversationMessages = messages;
    if (maintain_conversation && conversations.has(clientId)) {
      conversationMessages = conversations.get(clientId) || [];
      // Add the latest user message
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage && lastUserMessage.role === 'user') {
        conversationMessages.push(lastUserMessage);
      }
    }

    // Reset tracking collections
    collectedResponses = [];
    collectedToolResults = {};

    // Get API key
    const apiKey = await getApiKey(provider);

    // Run the agent
    const result = await samplingLoop({
      model,
      provider: provider as APIProvider,
      systemPromptSuffix: system_prompt_suffix,
      messages: conversationMessages,
      outputCallback,
      toolOutputCallback,
      apiResponseCallback,
      apiKey,
      onlyNMostRecentImages: only_n_most_recent_images,
      maxTokens: max_tokens,
      toolVersion: tool_version as any,
      thinkingBudget: thinking_budget,
      tokenEfficientToolsBeta: token_efficient_tools_beta
    });

    // Update stored conversation if maintain_conversation is true
    if (maintain_conversation) {
      conversations.set(clientId, result);
    }

    // Format tool results for response
    const toolResultsResponse = Object.entries(collectedToolResults).map(([toolId, result]) => ({
      type: 'tool_result',
      output: result.output || result.error || '',
      tool_id: toolId
    }));

    // Prepare the response
    const response: PromptResponse = {
      response: collectedResponses,
      tool_results: toolResultsResponse,
      messages: result
    };

    return res.json(response);
  } catch (error: any) {
    console.error(`Error processing request: ${error.message}`);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

// Start server function
export function startApiServer(port: number = 8000): void {
  app.listen(port, '0.0.0.0', () => {
    console.log(`TS Agent API server running on http://0.0.0.0:${port}`);
    console.log(`API documentation available at http://0.0.0.0:${port}/docs`);
  });
}

export default app; 