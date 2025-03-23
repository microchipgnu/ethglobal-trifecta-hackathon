import type { AgentDTO } from '@/lib/services/agent.service';
import type { SessionData } from '@/lib/telegram/types';
import {
  type CoreAssistantMessage,
  type CoreToolMessage,
  type ToolInvocation,
  type ToolSet,
  appendResponseMessages,
  generateId,
} from 'ai';

export const getResponseToolInvocations = (
  messages: (CoreAssistantMessage | CoreToolMessage)[]
) => {
  const convertedMessages = appendResponseMessages({
    messages: [
      {
        id: generateId(),
        role: 'user',
        content: 'You are a helpful assistant.',
      },
    ],
    responseMessages: messages.map((message) => ({
      id: generateId(),
      ...message,
    })),
  });

  const toolInvocations: (ToolInvocation & { state: 'result' })[] = [];

  for (const message of convertedMessages) {
    if (message.parts) {
      for (const part of message.parts) {
        if (
          part.type === 'tool-invocation' &&
          part.toolInvocation.state === 'result'
        ) {
          toolInvocations.push(part.toolInvocation);
        }
      }
    }
  }

  return toolInvocations;
};

const BASE_SYSTEM_PROMPT = `BASE SYSTEM PROMPT: You are one of the telegram bots for Midcurve.live $MCRV, a 24/7 livestreamed AI Agent that engages, researches, and trades based on live community inputs. Use either the tools, sessionContext, or previous messages to help the user with their questions. The sessionContext contains information about the user and the chat. When a user asks for their balance use the getUserBalance tool. When a user asks for their address, deposit status, or registration status use sessionContext.user information. When a user asks about buying $MCRV tokens, explain they need to connect their wallet to participate. When a user asks for YOUR address or balance, use the GOAT tools which refer to the Midcurve.live agent's wallet. Use the sendETHReward tool to send a random amount of ETH to users who participate actively in the Midcurve.live chat. (only available in the main Midcurve chat). Inform users they can influence Midcurve's decisions in real-time by participating in the community. Encourage users to watch the livestream at https://midcurve.live.

-- Respond briefly and concisely.
-- This is a telegram chat, do not spam with long responses.
-- Try to respond with one sentence when possible!!
-- If you are unsure about something, do not make up an answer, just say you do not know.
-- Responses should not exceed 100 words.

  ADDITIONAL PROMPT:
`;

export const getSystemPromptWithSessionContext = async ({
  session,
  agent,
}: {
  session?: SessionData;
  agent: AgentDTO;
}) => {
  const summarizedUser = {
    telegramId: session?.user?.telegramId,
    firstName: session?.user?.firstName,
    username: session?.user?.username,
    evmAddress: session?.user?.evmAddress,
    depositHash: session?.user?.depositHash,
    depositAmount: session?.user?.depositAmount,
    totalRewards: session?.user?.totalRewards,
  };

  const summarizedChat = {
    telegramChatId: session?.chat?.telegramChatId,
    title: session?.chat?.title,
    // summary: session?.chat?.summary,
    // userIds: session?.chat?.userIds,
  };

  return JSON.stringify({
    systemPrompt: `${BASE_SYSTEM_PROMPT}\n\n${agent.systemPrompt}`,
    sessionContext: {
      user: summarizedUser,
      chat: summarizedChat,
    },
  });
};

export const addToolExecutionEffect = <T extends ToolSet>({
  toolSet,
  toolName,
  action,
  position = 'after',
}: {
  toolSet: ToolSet;
  toolName: string;
  action: () => void;
  position: 'before' | 'after';
}) => {
  const updatedToolSet = { ...toolSet };

  updatedToolSet[toolName] = {
    ...toolSet[toolName],
    execute: async (args, options) => {
      if (position === 'before') {
        action();
      }
      const result = await toolSet[toolName].execute?.(args, options);

      if (position === 'after') {
        action();
      }

      return result;
    },
  };

  return updatedToolSet as T;
};
