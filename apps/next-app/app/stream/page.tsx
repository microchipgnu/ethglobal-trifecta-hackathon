'use client';

import { IAppMessage } from '@/models/AppMessage';
import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useRef, useState } from 'react';
import ChatMessage from './components/ChatMessage';
import StreamPlayer from './components/StreamPlayer';

export default function StreamPage() {
  const { user, ready, authenticated } = usePrivy();
  const [messages, setMessages] = useState<IAppMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Fetch messages when component mounts
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/messages');
        const data = await response.json();

        if (data.messages) {
          setMessages(data.messages);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      } finally {
        setLoading(false);
      }
    };

    if (authenticated) {
      fetchMessages();
    }
  }, [authenticated]);

  // Scroll to bottom of chat when messages change
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handle message submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !user?.wallet?.address) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          sender: user.wallet.address,
        }),
      });

      const data = await response.json();

      if (data.message) {
        setMessages([...messages, data.message]);
        setNewMessage('');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!ready) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <p className="text-lg mb-4">Please sign in to access the stream</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen p-4 gap-4">
      {/* Stream Player */}
      <div className="md:w-3/4 h-full">
        <StreamPlayer />
      </div>

      {/* Chat Section */}
      <div className="md:w-1/4 h-full flex flex-col border rounded-lg overflow-hidden">
        <div className="px-4 py-2 bg-gray-800 text-white font-semibold">
          Live Chat
        </div>

        {/* Messages */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <p>Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-full text-gray-500">
              <p>No messages yet. Be the first to chat!</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <ChatMessage
                key={`${message.timestamp.toString()}-${index}`}
                message={message}
                isCurrentUser={message.sender === user?.wallet?.address}
              />
            ))
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSubmit} className="p-2 border-t flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-l-lg px-4 py-2 border focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-r-lg font-medium hover:bg-blue-700 disabled:bg-blue-300"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
