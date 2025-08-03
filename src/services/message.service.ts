import Chat from '../models/chat.model.js';
import Message from '../models/message.model.js';
import { User } from '../models/user.model.js';
import { Job } from '../models/job.model.js';
import {
  IChatWithDetails,
  IMessageWithSender,
  ICreateChatRequest,
  ISendMessageRequest,
} from '../types/message.types.js';
import logger from './logger.js';

export class MessageService {
  /**
   * Create a new chat between client and craftsman
   * Only clients can initiate chats with craftsmen
   */
  static async createChat(
    clientId: string,
    data: ICreateChatRequest
  ): Promise<IChatWithDetails> {
    try {
      // Validate users exist and get their roles
      const [client, craftsman] = await Promise.all([
        User.findById(clientId),
        User.findById(data.craftsmanId),
      ]);

      if (!client || !craftsman) {
        throw new Error('One or both users not found');
      }

      // Enforce role restrictions: only client can create chat with craftsman
      if (client.role !== 'client') {
        throw new Error('Only clients can initiate chats');
      }

      if (craftsman.role !== 'craftsman') {
        throw new Error('Can only create chats with craftsmen');
      }

      // Check if chat already exists between these users
      const existingChat = await Chat.findOne({
        participants: { $all: [clientId, data.craftsmanId] },
      });

      if (existingChat)
        return this.getChatWithDetails(existingChat._id.toString());

      // Validate job if provided
      if (data.jobId) {
        const job = await Job.findById(data.jobId);
        if (!job) throw new Error('Job not found');

        // Ensure the client owns the job
        if (job.client.toString() !== clientId)
          throw new Error('Can only create chat for your own jobs');
      }

      // Create new chat
      const chat = new Chat({
        participants: [clientId, data.craftsmanId],
        jobId: data.jobId,
        unreadCount: new Map([
          [clientId, 0],
          [data.craftsmanId, 0],
        ]),
      });

      await chat.save();

      logger.info('Chat created by client', {
        chatId: chat._id,
        clientId,
        craftsmanId: data.craftsmanId,
        jobId: data.jobId,
      });

      // Send initial message if provided
      if (data.message && data.message.trim())
        await this.sendMessage(clientId, {
          chatId: chat._id.toString(),
          messageType: 'text',
          content: data.message.trim(),
        });

      return this.getChatWithDetails(chat._id.toString());
    } catch (error) {
      logger.error('Error creating chat', { error, clientId, data });
      throw error;
    }
  }

  /**
   * Get a chat with populated details
   */
  static async getChatWithDetails(chatId: string): Promise<IChatWithDetails> {
    try {
      const chat = await Chat.findById(chatId)
        .populate('participants', 'fullName profilePicture role')
        .populate('jobId', 'title')
        .lean();

      if (!chat) throw new Error('Chat not found');

      return chat as unknown as IChatWithDetails;
    } catch (error) {
      logger.error('Error getting chat details', { error, chatId });
      throw error;
    }
  }

  /**
   * Get user's chats with pagination
   */
  static async getUserChats(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    chats: IChatWithDetails[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [chats, totalCount] = await Promise.all([
        Chat.find({
          participants: userId,
          isActive: true,
        })
          .populate('participants', 'fullName profilePicture role')
          .populate('jobId', 'title')
          .sort({ lastMessageAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Chat.countDocuments({
          participants: userId,
          isActive: true,
        }),
      ]);

      return {
        chats: chats as unknown as IChatWithDetails[],
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    } catch (error) {
      logger.error('Error getting user chats', { error, userId });
      throw error;
    }
  }

  /**
   * Send a message in a chat
   */
  static async sendMessage(
    senderId: string,
    data: ISendMessageRequest
  ): Promise<IMessageWithSender> {
    try {
      // Validate chat exists and user is participant
      const chat = await Chat.findById(data.chatId);
      if (!chat) throw new Error('Chat not found');

      if (!chat.participants.includes(senderId))
        throw new Error('User is not a participant in this chat');

      // Validate message content
      if (!data.content || data.content.trim().length === 0)
        throw new Error('Message content cannot be empty');

      // Create message
      const message = new Message({
        chatId: data.chatId,
        senderId,
        messageType: data.messageType || 'text',
        content: data.content.trim(),
      });

      await message.save();

      // Update chat with last message info and increment unread count
      const messagePreview =
        data.messageType === 'text'
          ? data.content.substring(0, 100) // Shorter preview
          : `[${data.messageType.toUpperCase()}]`;

      // Find the other participant to increment their unread count
      const otherParticipant = chat.participants.find((p) => p !== senderId);

      const updateData: any = {
        lastMessage: messagePreview,
        lastMessageAt: new Date(),
        lastMessageSenderId: senderId,
      };

      // Increment unread count for the other participant
      if (otherParticipant) {
        const currentUnreadCount =
          chat.unreadCount instanceof Map
            ? chat.unreadCount.get(otherParticipant) || 0
            : chat.unreadCount[otherParticipant] || 0;

        updateData[`unreadCount.${otherParticipant}`] = currentUnreadCount + 1;
      }

      await Chat.findByIdAndUpdate(data.chatId, updateData);

      logger.info('Message sent and chat updated', {
        messageId: message._id,
        chatId: data.chatId,
        senderId,
        messageType: data.messageType,
        messagePreview,
        otherParticipant,
      });

      return this.getMessageWithSender(message._id.toString());
    } catch (error) {
      logger.error('Error sending message', { error, senderId, data });
      throw error;
    }
  }

  /**
   * Get messages in a chat with pagination
   */
  static async getChatMessages(
    chatId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    messages: IMessageWithSender[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      // Validate user is participant
      const chat = await Chat.findById(chatId);
      if (!chat) throw new Error('Chat not found');

      if (!chat.participants.includes(userId))
        throw new Error('User is not a participant in this chat');

      const skip = (page - 1) * limit;

      const [messages, totalCount] = await Promise.all([
        Message.find({
          chatId,
          isDeleted: false,
        })
          .populate('senderId', 'fullName profilePicture role')
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Message.countDocuments({
          chatId,
          isDeleted: false,
        }),
      ]);

      // Reverse to show oldest first
      messages.reverse();

      return {
        messages: messages as unknown as IMessageWithSender[],
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    } catch (error) {
      logger.error('Error getting chat messages', { error, chatId, userId });
      throw error;
    }
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(
    chatId: string,
    userId: string
  ): Promise<{ updatedCount: number }> {
    try {
      // Validate user is participant
      const chat = await Chat.findById(chatId);
      if (!chat) throw new Error('Chat not found');

      if (!chat.participants.includes(userId))
        throw new Error('User is not a participant in this chat');

      // Mark unread messages as read
      const result = await Message.updateMany(
        {
          chatId,
          senderId: { $ne: userId }, // Messages not sent by this user
          isRead: false,
        },
        {
          isRead: true,
          readAt: new Date(),
        }
      );

      // Reset unread count for this user
      await Chat.findByIdAndUpdate(chatId, {
        [`unreadCount.${userId}`]: 0,
      });

      logger.info('Messages marked as read', {
        chatId,
        userId,
        updatedCount: result.modifiedCount,
      });

      return { updatedCount: result.modifiedCount };
    } catch (error) {
      logger.error('Error marking messages as read', { error, chatId, userId });
      throw error;
    }
  }

  /**
   * Get message with sender details
   */
  static async getMessageWithSender(
    messageId: string
  ): Promise<IMessageWithSender> {
    try {
      const message = await Message.findById(messageId)
        .populate('senderId', 'fullName profilePicture role')
        .lean();

      if (!message) throw new Error('Message not found');

      return message as unknown as IMessageWithSender;
    } catch (error) {
      logger.error('Error getting message with sender', { error, messageId });
      throw error;
    }
  }

  /**
   * Delete a message (soft delete)
   */
  static async deleteMessage(
    messageId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const message = await Message.findById(messageId);
      if (!message) throw new Error('Message not found');

      if (message.senderId !== userId)
        throw new Error('Only message sender can delete the message');

      await Message.findByIdAndUpdate(messageId, {
        isDeleted: true,
        deletedAt: new Date(),
      });

      logger.info('Message deleted', { messageId, userId });
      return true;
    } catch (error) {
      logger.error('Error deleting message', { error, messageId, userId });
      throw error;
    }
  }

  /**
   * Get all chats for admin (with pagination)
   */
  static async getAllChatsForAdmin(
    page: number = 1,
    limit: number = 20
  ): Promise<{
    chats: IChatWithDetails[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [chats, totalCount] = await Promise.all([
        Chat.find({})
          .populate('participants', 'fullName profilePicture role email')
          .populate('jobId', 'title')
          .sort({ lastMessageAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Chat.countDocuments({}),
      ]);

      return {
        chats: chats as unknown as IChatWithDetails[],
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
      };
    } catch (error) {
      logger.error('Error getting all chats for admin', { error });
      throw error;
    }
  }

  /**
   * Get chat messages for admin
   */
  static async getChatMessagesForAdmin(
    chatId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{
    messages: IMessageWithSender[];
    totalCount: number;
    totalPages: number;
    currentPage: number;
    chat: IChatWithDetails;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [messages, totalCount, chat] = await Promise.all([
        Message.find({ chatId })
          .populate('senderId', 'fullName profilePicture role email')
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Message.countDocuments({ chatId }),
        this.getChatWithDetails(chatId),
      ]);

      // Reverse to show oldest first
      messages.reverse();

      return {
        messages: messages as unknown as IMessageWithSender[],
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        chat,
      };
    } catch (error) {
      logger.error('Error getting chat messages for admin', { error, chatId });
      throw error;
    }
  }
}
