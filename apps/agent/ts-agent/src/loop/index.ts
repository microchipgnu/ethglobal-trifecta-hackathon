import { Anthropic } from '@anthropic-ai/sdk';
import type { Message, MessageContent } from '@anthropic-ai/sdk';
import { streamText } from 'ai';
import axios from 'axios';
import { 
  ToolCollection,
  TOOL_GROUPS_BY_VERSION,
} from '../tools';
import type { ToolResult, ToolVersion } from '../tools';

// Define API providers
export enum APIProvider {
  ANTHROPIC = 'anthropic',
  BEDROCK = 'bedrock',
  VERTEX = 'vertex'
}

// Default model names for different providers
export const PROVIDER_TO_DEFAULT_MODEL_NAME: Record<string, string> = {
  [APIProvider.ANTHROPIC]: 'claude-3-7-sonnet-20250219',
  [APIProvider.BEDROCK]: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  [APIProvider.VERTEX]: 'claude-3-5-sonnet-v2@20241022',
};

// System prompt optimized for Docker environment
const SYSTEM_PROMPT = `<SYSTEM_CAPABILITY>
* You are utilising an Ubuntu virtual machine with internet access.
* You can feel free to install Ubuntu applications with your bash tool. Use curl instead of wget.
* To open firefox, please just click on the firefox icon.  Note, firefox-esr is what is installed on your system.
* Using bash tool you can start GUI applications, but you need to set export DISPLAY=:1 and use a subshell. For example "(DISPLAY=:1 xterm &)". GUI apps run with bash tool will appear within your desktop environment, but they may take some time to appear. Take a screenshot to confirm it did.
* When using your bash tool with commands that are expected to output very large quantities of text, redirect into a tmp file and use str_replace_editor or \`grep -n -B <lines before> -A <lines after> <query> <filename>\` to confirm output.
* When viewing a page it can be helpful to zoom out so that you can see everything on the page.  Either that, or make sure you scroll down to see everything before deciding something isn't available.
* When using your computer function calls, they take a while to run and send back to you.  Where possible/feasible, try to chain multiple of these calls all into one function calls request.
* The current date is ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}.
</SYSTEM_CAPABILITY>

<IMPORTANT>
* When using Firefox, if a startup wizard appears, IGNORE IT.  Do not even click "skip this step".  Instead, click on the address bar where it says "Search or enter address", and enter the appropriate search term or URL there.
* If the item you are looking at is a pdf, if after taking a single screenshot of the pdf it seems that you want to read the entire document instead of trying to continue to read the pdf from your screenshots + navigation, determine the URL, use curl to download the pdf, install and use pdftotext to convert it to a text file, and then read that text file directly with your StrReplaceEditTool.
</IMPORTANT>`;

// Prompt caching beta flag
const PROMPT_CACHING_BETA_FLAG = 'prompt-caching-2024-07-31';

/**
 * Update agent status
 */
export async function updateAgentStatus(key: string, value: any): Promise<boolean> {
  try {
    // Convert complex objects to JSON-serializable format
    const serializedValue = typeof value !== 'string' && value !== null 
      ? JSON.stringify(value)
      : value;
      
    const response = await axios.post(
      'http://internal-api:3030/api/data',
      { key, value: serializedValue },
      { timeout: 10000 }
    );
    
    return response.status === 200;
  } catch (error: any) {
    console.error(`Failed to update agent status: ${error.message}`);
    return false;
  }
}

/**
 * Update used tools tracking
 */
export async function updateUsedTools(
  toolName: string, 
  toolId: string, 
  maxTools: number = 20
): Promise<boolean> {
  try {
    const toolData = {
      name: toolName,
      id: toolId,
      timestamp: new Date().toISOString()
    };
    
    const response = await axios.post(
      'http://internal-api:3030/api/data/agent_last_used_tools/append',
      {
        value: toolData,
        maxItems: maxTools
      },
      { timeout: 10000 }
    );
    
    return response.status === 200;
  } catch (error: any) {
    console.error(`Failed to update used tools list: ${error.message}`);
    return false;
  }
}

interface MessageBlock {
  type: string;
  source?: {
    type: string;
  };
  [key: string]: any;
}

/**
 * Filter to only keep the most recent N images
 */
function filterToNMostRecentImages(
  messages: Message[],
  n: number
): void {
  for (const message of messages) {
    if (Array.isArray(message.content)) {
      const imageBlocks = message.content.filter(block => 
        block.type === 'image' && typeof block.source === 'object' && block.source.type === 'base64'
      );
      
      if (imageBlocks.length > n) {
        // Sort by position in the array (assuming more recent images are later in the array)
        const imageIndices = message.content
          .map((block: MessageBlock, index: number) => ({ block, index }))
          .filter(item => 
            item.block.type === 'image' && 
            typeof item.block.source === 'object' && 
            item.block.source.type === 'base64'
          )
          .map(item => item.index)
          .sort((a: number, b: number) => a - b);
        
        // Keep only the most recent n images
        const indicesToRemove = imageIndices.slice(0, imageIndices.length - n);
        
        // Create a new content array without the removed images
        const newContent = message.content.filter((_: any, index: number) => !indicesToRemove.includes(index));
        message.content = newContent;
      }
    }
  }
}

/**
 * Add cache control to messages for prompt caching
 */
function injectPromptCaching(messages: Message[]): void {
  for (const message of messages) {
    if (Array.isArray(message.content)) {
      for (const block of message.content) {
        if (block.type === 'text' || block.type === 'image') {
          // @ts-ignore - the SDK types don't include cache_control yet
          block.cache_control = { type: 'ephemeral' };
        }
      }
    }
  }
}

/**
 * Main agent sampling loop
 */
export async function samplingLoop({
  model,
  provider,
  systemPromptSuffix,
  messages,
  outputCallback,
  toolOutputCallback,
  apiResponseCallback,
  apiKey,
  onlyNMostRecentImages = null,
  maxTokens = 4096,
  toolVersion,
  thinkingBudget = null,
  tokenEfficientToolsBeta = false,
}: {
  model: string;
  provider: APIProvider;
  systemPromptSuffix: string;
  messages: Message[];
  outputCallback: (block: MessageContent) => void;
  toolOutputCallback: (toolOutput: ToolResult, toolId: string) => void;
  apiResponseCallback: (request: any, response: any, error: Error | null) => void;
  apiKey: string;
  onlyNMostRecentImages?: number | null;
  maxTokens?: number;
  toolVersion: ToolVersion;
  thinkingBudget?: number | null;
  tokenEfficientToolsBeta?: boolean;
}) {
  // Initialize agent status
  await updateAgentStatus('agent_status', {
    state: 'initializing',
    model,
    provider: provider.toString(),
    tool_version: toolVersion.toString(),
    timestamp: new Date().toISOString(),
    message_count: messages.length
  });
  
  // Get the tool group and create tool collection
  const toolGroup = TOOL_GROUPS_BY_VERSION[toolVersion];
  const toolCollection = new ToolCollection(
    toolGroup.tools.map(ToolClass => new ToolClass())
  );
  
  // Set up system prompt
  const system = {
    type: 'text',
    text: `${SYSTEM_PROMPT}${systemPromptSuffix ? ' ' + systemPromptSuffix : ''}`
  };
  
  // Main loop
  let iteration = 0;
  
  while (true) {
    iteration++;
    
    // Update status
    await updateAgentStatus('agent_status', {
      state: 'processing',
      iteration,
      timestamp: new Date().toISOString(),
      message_count: messages.length,
      image_count: onlyNMostRecentImages
    });
    
    // Initialize beta flags
    let betas = toolGroup.beta_flag ? [toolGroup.beta_flag] : [];
    let enablePromptCaching = false;
    
    // Configure token efficient tools beta if needed
    if (tokenEfficientToolsBeta) {
      betas.push('token-efficient-tools-2025-02-19');
    }
    
    // Set up client based on provider
    let client;
    if (provider === APIProvider.ANTHROPIC) {
      client = new Anthropic({ apiKey });
      enablePromptCaching = true;
    } else {
      throw new Error(`Provider ${provider} not implemented in TypeScript version yet`);
    }
    
    // Apply prompt caching if enabled
    if (enablePromptCaching) {
      betas.push(PROMPT_CACHING_BETA_FLAG);
      injectPromptCaching(messages);
      
      // Because cached reads are 10% of the price, we don't truncate images when caching
      onlyNMostRecentImages = 0;
      
      // Add cache control to system prompt
      // @ts-ignore - the SDK types don't include cache_control yet
      system.cache_control = { type: 'ephemeral' };
    }
    
    // Filter images if needed
    if (onlyNMostRecentImages && onlyNMostRecentImages > 0) {
      filterToNMostRecentImages(messages, onlyNMostRecentImages);
    }
    
    // Set up extra body for thinking budget if needed
    const extraBody: any = {};
    if (thinkingBudget) {
      extraBody.thinking = { type: 'enabled', budget_tokens: thinkingBudget };
    }
    
    // Update status for API call
    await updateAgentStatus('agent_status', {
      state: 'calling_api',
      model,
      provider: provider.toString(),
      max_tokens: maxTokens,
      timestamp: new Date().toISOString(),
      betas,
      thinking_budget: thinkingBudget
    });
    
    try {
      // Call the API
      const response = await client.messages.create({
        max_tokens: maxTokens,
        messages,
        model,
        system: system,
        tools: toolCollection.toParams(),
        betas,
        ...extraBody
      });
      
      // Process the response
      for (const contentBlock of response.content) {
        if (contentBlock.type === 'tool_use') {
          const toolName = contentBlock.name;
          const toolId = contentBlock.id;
          const toolParams = contentBlock.input;
          
          // Update status
          await updateAgentStatus('agent_status', {
            state: 'tool_execution',
            tool: toolName,
            tool_id: toolId,
            timestamp: new Date().toISOString()
          });
          
          // Track tool usage
          await updateUsedTools(toolName, toolId);
          
          try {
            // Call the tool
            const toolResult = await toolCollection.call(toolName, toolParams);
            
            // Process tool result
            if (toolOutputCallback) {
              toolOutputCallback(toolResult, toolId);
            }
            
            // Push tool result to messages
            messages.push({
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolId,
                  content: toolResult.output || toolResult.error || '',
                }
              ]
            });
            
            // Break out of this iteration to get the next response
            break;
          } catch (error: any) {
            // Handle tool execution error
            const errorMessage = error.message || 'Unknown error executing tool';
            console.error(`Tool execution error: ${errorMessage}`);
            
            messages.push({
              role: 'user',
              content: [
                {
                  type: 'tool_result',
                  tool_use_id: toolId,
                  content: `Error: ${errorMessage}`,
                }
              ]
            });
            
            // Break out of this iteration to get the next response
            break;
          }
        } else {
          // Regular content - send to callback
          if (outputCallback) {
            outputCallback(contentBlock);
          }
        }
      }
      
      // If we processed all content blocks without finding a tool_use, we're done
      if (!response.content.some(block => block.type === 'tool_use')) {
        // Update status to completed
        await updateAgentStatus('agent_status', {
          state: 'completed',
          timestamp: new Date().toISOString()
        });
        
        // Return the final messages
        return messages;
      }
    } catch (error: any) {
      // Handle API error
      await updateAgentStatus('agent_status', {
        state: 'error',
        error_type: error.name,
        error_message: error.message,
        timestamp: new Date().toISOString()
      });
      
      if (apiResponseCallback) {
        apiResponseCallback(null, null, error);
      }
      
      throw error;
    }
  }
} 