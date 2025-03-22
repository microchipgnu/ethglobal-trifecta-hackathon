import { IAppMessage } from '@/models/AppMessage';
import { formatDistanceToNow } from 'date-fns';

interface ChatMessageProps {
  message: IAppMessage;
  isCurrentUser: boolean;
}

export default function ChatMessage({
  message,
  isCurrentUser,
}: ChatMessageProps) {
  // Truncate the sender address for display
  const displayAddress = `${message.sender.substring(0, 6)}...${message.sender.substring(message.sender.length - 4)}`;

  // Format the timestamp
  const timeAgo = formatDistanceToNow(new Date(message.timestamp), {
    addSuffix: true,
  });

  return (
    <div
      className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}
    >
      <div
        className={`max-w-[80%] p-3 rounded-lg ${
          isCurrentUser
            ? 'bg-blue-100 text-blue-900 rounded-tr-none'
            : 'bg-gray-100 text-gray-900 rounded-tl-none'
        }`}
      >
        <p className="text-sm">{message.content}</p>
      </div>

      <div className="flex items-center mt-1 text-xs text-gray-500">
        <span className="font-medium">{displayAddress}</span>
        <span className="mx-1">•</span>
        <time>{timeAgo}</time>
      </div>
    </div>
  );
}
