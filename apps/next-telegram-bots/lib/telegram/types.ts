import type { FileApiFlavor, FileFlavor } from '@grammyjs/files';
import type { Api, Bot, Context, LazySessionFlavor } from 'grammy';

import type { AgentDTO } from '@/lib/services/agent.service';
import type { ChatDTO } from '@/lib/services/chat.service';
import type { MessageDTO } from '@/lib/services/message.service';
import type { UserDTO } from '@/lib/services/user.service';
import type { Attachment } from 'ai';

export type SessionData = {
  user?: UserDTO;
  chat?: ChatDTO;
  agent?: AgentDTO;
  messages: MessageDTO[];
};

export type MyContext = LazySessionFlavor<SessionData> &
  FileFlavor<Context> & {
    attachments: Attachment[] | undefined;
  };

export type MyApi = FileApiFlavor<Api>;
export type MyBot = Bot<MyContext, MyApi>;
