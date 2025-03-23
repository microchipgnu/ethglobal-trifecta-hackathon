import { openai } from '@ai-sdk/openai';
import { type ToolSet, convertToCoreMessages, generateText } from 'ai';

import {
  customTools,
  getConnectLink,
  getUserBalance,
  sendETHReward,
} from '@/lib/ai/custom-tools';
import { getGoatTools } from '@/lib/ai/goat-tools';
import {
  getResponseToolInvocations,
  getSystemPromptWithSessionContext,
} from '@/lib/ai/utils';
import { getTools } from '@/lib/config';
import { agentService, chatService, messageService } from '@/lib/services';
import type { SessionData } from '@/lib/telegram/types';

const MIDCURVE_CHAT_ID = -1002596130117;

export const handleGenerateText = async ({
  chatId,
  agentId,
  session,
}: {
  chatId: number;
  agentId?: number;
  session?: SessionData;
}) => {
  console.log('HANDLE GENERATE TEXT', {
    chatId,
    agentId,
    session,
  });
  // Get chat from parameter or find it by chatId
  const chat =
    session?.chat ||
    (await (await chatService()).findChat({ telegramChatId: chatId }));

  if (!chat) {
    throw new Error(`Chat not found for chatId: ${chatId}`);
  }

  // Get agent from parameter or find it by agentId
  const agent =
    session?.agent ||
    (await (await agentService()).findAgent({ telegramBotId: agentId }));

  if (!agent) {
    console.error('Agent not found', agentId);
    throw new Error('Agent not found');
  }

  // Get message history for context - use session messages if available
  const chatMessages = session?.messages?.length
    ? session.messages
    : await (await messageService()).getMessagesByChatId(
        chat.telegramChatId,
        10
      );

  const thTools = await getTools();
  const goatTools = await getGoatTools();

  const combinedTools: ToolSet = {
    ...thTools,
    ...customTools,
    ...goatTools,
    getUserBalance,
    getConnectLink,
  };

  if (session?.chat?.telegramChatId === MIDCURVE_CHAT_ID) {
    combinedTools.sendETHReward = sendETHReward;
  }

  const coreMessages = convertToCoreMessages(chatMessages, {
    tools: combinedTools,
  });

  const result = await generateText({
    model: openai('gpt-4o'),
    system: await getSystemPromptWithSessionContext({
      session,
      agent,
    }),
    messages: coreMessages,
    maxSteps: 4,
    tools: combinedTools,
  });

  const toolInvocations = getResponseToolInvocations(result.response.messages);

  return {
    ...result,
    toolInvocations,
  };
};
