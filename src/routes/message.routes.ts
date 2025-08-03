import { Router } from 'express';
import { MessageController } from '../controllers/message.controller.js';
import {
  authenticateJWT,
  authorizeRoles,
} from '../middlewares/auth.middleware.js';
import upload from '../config/multer.js';

const router = Router();

// All message routes require authentication
router.use(authenticateJWT);

// User routes - accessible by clients and craftsmen
router.post('/chats', MessageController.createChat);
router.get('/chats', MessageController.getUserChats);
router.get('/chats/:chatId', MessageController.getChatDetails);
router.get('/chats/:chatId/messages', MessageController.getChatMessages);
router.post('/chats/:chatId/messages', MessageController.sendMessage);
router.post(
  '/chats/:chatId/upload-image',
  upload.single('image'),
  MessageController.uploadImageMessage
);
router.patch('/chats/:chatId/read', MessageController.markMessagesAsRead);
router.delete('/messages/:messageId', MessageController.deleteMessage);

// Admin routes - only accessible by admins
router.get(
  '/admin/chats',
  authorizeRoles('admin'),
  MessageController.getAllChats
);
router.get(
  '/admin/chats/:chatId/messages',
  authorizeRoles('admin'),
  MessageController.getChatMessagesForAdmin
);
router.get(
  '/admin/socket-debug',
  authorizeRoles('admin'),
  MessageController.getSocketDebugInfo
);

export default router;
