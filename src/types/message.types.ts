import { Document } from 'mongoose';

export interface IMessage extends Document {
  chatId: string;
  senderId: string;
  messageType: 'text' | 'image';
  content: string; // text content or image URL
  timestamp: Date;
  isRead: boolean;
  readAt?: Date;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

export interface IChat extends Document {
  participants: string[]; // Array of user IDs (client and craftsman)
  jobId?: string; // Reference to the job that initiated this chat
  lastMessage?: string;
  lastMessageAt?: Date;
  lastMessageSenderId?: string;
  unreadCount: {
    [userId: string]: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatWithDetails {
  _id: string;
  participants: {
    _id: string;
    fullName: string;
    profilePicture?: string;
    role: string;
  }[];
  jobId?: {
    _id: string;
    title: string;
  };
  lastMessage?: string;
  lastMessageAt?: Date;
  lastMessageSenderId?: string;
  unreadCount: {
    [userId: string]: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessageWithSender {
  _id: string;
  chatId: string;
  senderId: {
    _id: string;
    fullName: string;
    profilePicture?: string;
    role: string;
  };
  messageType: 'text' | 'image';
  content: string;
  timestamp: Date;
  isRead: boolean;
  readAt?: Date;
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
}

export interface ISendMessageRequest {
  chatId: string;
  messageType: 'text' | 'image';
  content: string;
}

export interface ICreateChatRequest {
  craftsmanId: string; // The craftsman's ID (client initiates chat with craftsman)
  jobId?: string; // Optional job reference
  message?: string; // Optional initial message
}

export interface ISocketUser {
  userId: string;
  socketId: string;
  role: string;
}

// Socket event types
export interface ISocketEvents {
  // Client to server events
  'join-chat': (chatId: string) => void;
  'leave-chat': (chatId: string) => void;
  'send-message': (data: ISendMessageRequest) => void;
  'typing-start': (chatId: string) => void;
  'typing-stop': (chatId: string) => void;
  'mark-messages-read': (chatId: string) => void;

  // Server to client events
  'new-message': (message: IMessageWithSender) => void;
  'message-read': (data: {
    chatId: string;
    messageIds: string[];
    readBy: string;
  }) => void;
  'user-typing': (data: {
    chatId: string;
    userId: string;
    isTyping: boolean;
  }) => void;
  'chat-updated': (chat: IChatWithDetails) => void;
  error: (error: { message: string; code?: string }) => void;
}
