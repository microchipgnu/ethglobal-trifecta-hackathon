import client, { connect, ping } from '@/lib/mongodb';
import { AgentService } from '@/lib/services/agent.service';
import { ChatService } from '@/lib/services/chat.service';
import { MessageService } from '@/lib/services/message.service';
import { UserService } from '@/lib/services/user.service';

// Initialize services once and share them across the application
let _agentService: AgentService;
let _chatService: ChatService;
let _messageService: MessageService;
let _userService: UserService;
let _initialized = false;

/**
 * Initialize MongoDB connection and services
 * This is the single source of truth for both DB connection and service initialization
 */
export const initializeServices = async () => {
  if (_initialized) {
    return;
  }

  try {
    // Ensure MongoDB is connected before initializing services
    await connect();

    // Verify connection with a ping
    const isConnected = await ping();
    if (!isConnected) {
      throw new Error('MongoDB connection check failed');
    }

    _agentService = new AgentService(client);
    _chatService = new ChatService(client);
    _messageService = new MessageService(client);
    _userService = new UserService(client);

    _initialized = true;
    console.log('Database services initialized');
  } catch (error) {
    console.error('Failed to initialize database services:', error);
    throw error;
  }
};

export const getAllServices = async () => {
  // Ensure services are initialized
  if (!_initialized) {
    await initializeServices();
  }

  return {
    agentService: _agentService,
    chatService: _chatService,
    messageService: _messageService,
    userService: _userService,
  };
};

// For backwards compatibility and direct access
export const getAgentService = async () =>
  (await getAllServices()).agentService;
export const getChatService = async () => (await getAllServices()).chatService;
export const getMessageService = async () =>
  (await getAllServices()).messageService;
export const getUserService = async () => (await getAllServices()).userService;
