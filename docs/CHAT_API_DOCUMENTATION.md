# 📡 **Craftworks Chat API - Complete Documentation**

## 📋 **Table of Contents**

1. [Authentication](#authentication)
2. [HTTP REST API Endpoints](#http-rest-api-endpoints)
3. [Socket.IO Real-time Events](#socketio-real-time-events)
4. [Data Models & Types](#data-models--types)
5. [Request/Response Examples](#requestresponse-examples)
6. [Error Handling](#error-handling)
7. [Authorization Rules](#authorization-rules)
8. [Testing Guide](#testing-guide)

---

## 🔐 **Authentication**

All API endpoints and Socket.IO connections require JWT authentication.

### **HTTP Headers**

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

### **Socket.IO Authentication**

```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### **JWT Payload Structure**

```typescript
interface IJWTPayload {
  userId: string;
  role: 'client' | 'craftsman' | 'admin';
  iat: number;
  exp: number;
}
```

---

## 🌐 **HTTP REST API Endpoints**

### **Base URL**: `http://localhost:5000/api/messages`

---

### **1. Create Chat**

`POST /chats`

**Authorization**: Client only (role: 'client')

**Request Body**:

```typescript
{
  "craftsmanId": string,      // Required: ID of craftsman user
  "jobId"?: string,           // Optional: Associated job ID
  "message"?: string          // Optional: Initial message
}
```

**Success Response** (201):

```typescript
{
  "success": true,
  "data": {
    "_id": "674d8e9a123456789abcdef0",
    "participants": [
      {
        "_id": "674d8e9a123456789abcdef1",
        "fullName": "John Doe",
        "role": "client",
        "profilePicture": "https://example.com/profile.jpg"
      },
      {
        "_id": "674d8e9a123456789abcdef2",
        "fullName": "Mike Smith",
        "role": "craftsman",
        "profilePicture": "https://example.com/profile2.jpg"
      }
    ],
    "jobId": {
      "_id": "674d8e9a123456789abcdef3",
      "title": "Bathroom Renovation"
    },
    "lastMessage": "Hi, interested in my project!",
    "lastMessageAt": "2025-08-03T17:30:00.000Z",
    "lastMessageSenderId": "674d8e9a123456789abcdef1",
    "unreadCount": {
      "674d8e9a123456789abcdef1": 0,
      "674d8e9a123456789abcdef2": 1
    },
    "isActive": true,
    "createdAt": "2025-08-03T17:30:00.000Z",
    "updatedAt": "2025-08-03T17:30:00.000Z"
  },
  "message": "Chat created successfully"
}
```

**Error Responses**:

- `400 Bad Request`: Missing required fields
- `403 Forbidden`: Non-client trying to create chat
- `404 Not Found`: Craftsman not found
- `409 Conflict`: Chat already exists

---

### **2. Get User's Chats**

`GET /chats?page=1&limit=20`

**Authorization**: Any authenticated user

**Query Parameters**:

```typescript
{
  page?: number,    // Default: 1
  limit?: number    // Default: 20, Max: 100
}
```

**Success Response** (200):

```typescript
{
  "success": true,
  "data": {
    "chats": [
      {
        "_id": "674d8e9a123456789abcdef0",
        "participants": [...],
        "jobId": {...},
        "lastMessage": "Hello there!",
        "lastMessageAt": "2025-08-03T17:30:00.000Z",
        "lastMessageSenderId": "674d8e9a123456789abcdef1",
        "unreadCount": {
          "674d8e9a123456789abcdef1": 0,
          "674d8e9a123456789abcdef2": 3
        },
        "isActive": true,
        "createdAt": "2025-08-03T17:30:00.000Z",
        "updatedAt": "2025-08-03T17:30:00.000Z"
      }
    ],
    "totalCount": 15,
    "totalPages": 1,
    "currentPage": 1
  },
  "message": "Chats retrieved successfully"
}
```

---

### **3. Get Chat Details**

`GET /chats/:chatId`

**Authorization**: Chat participant only

**Success Response** (200):

```typescript
{
  "success": true,
  "data": {
    "_id": "674d8e9a123456789abcdef0",
    "participants": [...],
    "jobId": {...},
    "lastMessage": "Hello there!",
    "lastMessageAt": "2025-08-03T17:30:00.000Z",
    "lastMessageSenderId": "674d8e9a123456789abcdef1",
    "unreadCount": {...},
    "isActive": true,
    "createdAt": "2025-08-03T17:30:00.000Z",
    "updatedAt": "2025-08-03T17:30:00.000Z"
  },
  "message": "Chat details retrieved successfully"
}
```

**Error Responses**:

- `400 Bad Request`: Invalid chat ID
- `403 Forbidden`: User not participant
- `404 Not Found`: Chat not found

---

### **4. Get Chat Messages**

`GET /chats/:chatId/messages?page=1&limit=50`

**Authorization**: Chat participant only

**Query Parameters**:

```typescript
{
  page?: number,    // Default: 1
  limit?: number    // Default: 50, Max: 100
}
```

**Success Response** (200):

```typescript
{
  "success": true,
  "data": {
    "messages": [
      {
        "_id": "674d8e9a123456789abcdef4",
        "chatId": "674d8e9a123456789abcdef0",
        "senderId": {
          "_id": "674d8e9a123456789abcdef1",
          "fullName": "John Doe",
          "role": "client",
          "profilePicture": "https://example.com/profile.jpg"
        },
        "messageType": "text",
        "content": "Hello, when can you start?",
        "timestamp": "2025-08-03T17:30:00.000Z",
        "isRead": false,
        "createdAt": "2025-08-03T17:30:00.000Z"
      }
    ],
    "totalCount": 25,
    "totalPages": 1,
    "currentPage": 1
  },
  "message": "Messages retrieved successfully"
}
```

---

### **5. Upload Image Message**

`POST /chats/:chatId/upload-image`

**Authorization**: Chat participant only

**Content-Type**: `multipart/form-data`

**Request Body**:

```typescript
// Form data with file upload
{
  "image": File    // Required: Image file (JPEG, PNG, WebP, etc.)
}
```

**File Requirements**:

- **Max file size**: 5MB
- **Supported formats**: JPEG, PNG, WebP, GIF, BMP
- **Auto-optimization**: Images are converted to WebP format for better performance

**Success Response** (201):

```typescript
{
  "success": true,
  "data": {
    "_id": "674d8e9a123456789abcdef4",
    "chatId": "674d8e9a123456789abcdef0",
    "senderId": {
      "_id": "674d8e9a123456789abcdef1",
      "fullName": "John Doe",
      "role": "client",
      "profilePicture": "https://example.com/profile.jpg"
    },
    "messageType": "image",
    "content": "https://res.cloudinary.com/craftworks/image/upload/v1234567890/craftworks/chat-images/chat-1725384234567-photo.webp",
    "timestamp": "2025-08-03T17:30:00.000Z",
    "isRead": false,
    "createdAt": "2025-08-03T17:30:00.000Z"
  },
  "message": "Image message sent successfully"
}
```

**Error Responses**:

- `400 Bad Request`: No image file provided or invalid file format
- `403 Forbidden`: User not participant in chat
- `413 Payload Too Large`: File size exceeds 5MB limit
- `500 Internal Server Error`: Image upload failed

**Example Usage**:

```javascript
// Using FormData for image upload
const formData = new FormData();
formData.append('image', imageFile);

const response = await fetch('/api/messages/chats/CHAT_ID/upload-image', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`
    // Don't set Content-Type - let browser set it with boundary
  },
  body: formData
});
```

---

### **6. Send Message (HTTP Backup)**

`POST /chats/:chatId/messages`

**Authorization**: Chat participant only

**Request Body**:

```typescript
{
  "messageType": "text" | "image",    // Required
  "content": string                   // Required: Text content or image URL
}
```

**Success Response** (201):

```typescript
{
  "success": true,
  "data": {
    "_id": "674d8e9a123456789abcdef4",
    "chatId": "674d8e9a123456789abcdef0",
    "senderId": {
      "_id": "674d8e9a123456789abcdef1",
      "fullName": "John Doe",
      "role": "client",
      "profilePicture": "https://example.com/profile.jpg"
    },
    "messageType": "text",
    "content": "Hello, when can you start?",
    "timestamp": "2025-08-03T17:30:00.000Z",
    "isRead": false,
    "createdAt": "2025-08-03T17:30:00.000Z"
  },
  "message": "Message sent successfully"
}
```

---

### **7. Mark Messages as Read**

`PUT /chats/:chatId/messages/read`

**Authorization**: Chat participant only

**Success Response** (200):

```typescript
{
  "success": true,
  "data": {
    "chatId": "674d8e9a123456789abcdef0",
    "updatedCount": 5,
    "newUnreadCount": 0
  },
  "message": "Messages marked as read"
}
```

---

## ⚡ **Socket.IO Real-time Events**

### **Connection Setup**

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  auth: {
    token: localStorage.getItem('authToken')
  }
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to chat server');
  // User automatically joins all their chats
});

socket.on('disconnect', () => {
  console.log('Disconnected from chat server');
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
  // { message: string, code?: string }
});
```

---

### **Client → Server Events**

#### **1. Join Chat Room**

```javascript
socket.emit('join-chat', chatId);

// Server Response
socket.on('chat-joined', (data) => {
  console.log('Joined chat:', data);
  // {
  //   success: true,
  //   chatId: string,
  //   roomMembersCount: number
  // }
});
```

#### **2. Send Message (Primary Method)**

```javascript
// Text message
socket.emit('send-message', {
  chatId: 'chat_id',
  messageType: 'text',
  content: 'Hello there!'
});

// Image message (with URL from previous upload)
socket.emit('send-message', {
  chatId: 'chat_id',
  messageType: 'image',
  content: 'https://res.cloudinary.com/craftworks/image/upload/v1234567890/craftworks/chat-images/chat-image.webp'
});

// Confirmation
socket.on('message-sent', (data) => {
  console.log('Message sent:', data);
  // {
  //   success: true,
  //   messageId: string,
  //   timestamp: string,
  //   chatId: string
  // }
});
```

**Note**: For file uploads, use the HTTP endpoint `/chats/:chatId/upload-image` to upload the image to Cloudinary first, then optionally use Socket.IO to send the resulting URL.

#### **3. Leave Chat Room**

```javascript
socket.emit('leave-chat', chatId);
```

#### **4. Typing Indicators**

```javascript
// Start typing
socket.emit('typing-start', chatId);

// Stop typing
socket.emit('typing-stop', chatId);
```

#### **5. Mark Messages as Read**

```javascript
socket.emit('mark-messages-read', chatId);
```

---

### **Server → Client Events**

#### **1. New Message (Real-time Chat)**

```javascript
socket.on('new-message', (message) => {
  console.log('New message received:', message);

  // Message Structure:
  // {
  //   _id: string,
  //   chatId: string,
  //   senderId: {
  //     _id: string,
  //     fullName: string,
  //     role: string,
  //     profilePicture?: string
  //   },
  //   messageType: 'text' | 'image',
  //   content: string,
  //   timestamp: string,
  //   isRead: boolean,
  //   createdAt: string
  // }

  // Update chat UI
  if (message.chatId === currentChatId) {
    appendMessageToChat(message);
    scrollToBottom();
    markChatAsRead(message.chatId);
  }
});
```

#### **2. Chat Updated (Chat List Updates)**

```javascript
socket.on('chat-updated', (chat) => {
  console.log('Chat updated:', chat);

  // Update chat list with new last message, unread counts
  updateChatInList(chat);

  // Show notification if not in active chat
  if (chat._id !== currentChatId) {
    showNotificationBadge(chat._id);
    playNotificationSound();
  }
});
```

#### **3. New Chat Notification**

```javascript
socket.on('new-chat-notification', (data) => {
  console.log('New chat created:', data);
  // {
  //   chatId: string,
  //   message: 'You have a new chat conversation'
  // }

  // Refresh chat list to show new chat
  refreshChatList();
  showSystemNotification('New chat started!');
});
```

#### **4. Typing Indicators**

```javascript
socket.on('user-typing', (data) => {
  // {
  //   chatId: string,
  //   userId: string,
  //   isTyping: boolean
  // }

  if (data.chatId === currentChatId && data.userId !== currentUserId) {
    if (data.isTyping) {
      showTypingIndicator(data.userId);
    } else {
      hideTypingIndicator(data.userId);
    }
  }
});
```

#### **5. Message Read Confirmation**

```javascript
socket.on('message-read', (data) => {
  // {
  //   chatId: string,
  //   readBy: string
  // }

  if (data.chatId === currentChatId) {
    markMessagesAsReadBy(data.readBy);
  }
});
```

---

## 📊 **Data Models & Types**

### **Chat Model**

```typescript
interface IChat {
  _id: string;
  participants: string[]; // Array of user IDs
  jobId?: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  lastMessageSenderId?: string;
  unreadCount: Map<string, number>; // userId -> count
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### **Message Model**

```typescript
interface IMessage {
  _id: string;
  chatId: string;
  senderId: string;
  messageType: 'text' | 'image';
  content: string;
  timestamp: Date;
  isRead: boolean;
  createdAt: Date;
}
```

### **Chat with Details (Populated)**

```typescript
interface IChatWithDetails {
  _id: string;
  participants: Array<{
    _id: string;
    fullName: string;
    role: 'client' | 'craftsman';
    profilePicture?: string;
  }>;
  jobId?: {
    _id: string;
    title: string;
  };
  lastMessage?: string;
  lastMessageAt?: Date;
  lastMessageSenderId?: string;
  unreadCount: Record<string, number>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### **Message with Sender (Populated)**

```typescript
interface IMessageWithSender {
  _id: string;
  chatId: string;
  senderId: {
    _id: string;
    fullName: string;
    role: 'client' | 'craftsman';
    profilePicture?: string;
  };
  messageType: 'text' | 'image';
  content: string;
  timestamp: Date;
  isRead: boolean;
  createdAt: Date;
}
```

---

## ❌ **Error Handling**

### **HTTP Error Responses**

```typescript
// Standard Error Format
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE", // Optional
  "details": {} // Optional additional info
}
```

### **Common HTTP Status Codes**

- `400 Bad Request`: Invalid input data
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User lacks permission for action
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `500 Internal Server Error`: Server error

### **Socket.IO Error Events**

```javascript
socket.on('error', (error) => {
  // {
  //   message: string,
  //   code?: 'UNAUTHORIZED' | 'INVALID_INPUT' | 'CHAT_NOT_FOUND'
  // }

  switch(error.code) {
    case 'UNAUTHORIZED':
      // Redirect to login
      break;
    case 'INVALID_INPUT':
      // Show validation error
      break;
    default:
      // Show generic error
      break;
  }
});
```

---

## 🔒 **Authorization Rules**

### **Chat Creation**

- ✅ **Clients** can create chats with **craftsmen**
- ❌ **Craftsmen** cannot initiate chats
- ❌ **Clients** cannot create chats with other **clients**
- ❌ **Craftsmen** cannot create chats with other **craftsmen**

### **Messaging**

- ✅ **Both participants** can send messages once chat exists
- ❌ **Non-participants** cannot access chat or send messages

### **Chat Access**

- ✅ **Chat participants** can view chat details and messages
- ✅ **Chat participants** can mark messages as read
- ❌ **Non-participants** cannot access any chat data

---

## 🧪 **Testing Guide**

### **1. Test Chat Creation**

```bash
# ✅ Client creates chat with craftsman (Should succeed)
curl -X POST http://localhost:5000/api/messages/chats \
  -H "Authorization: Bearer CLIENT_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "craftsmanId": "674d8e9a123456789abcdef2",
    "message": "Hi, interested in my project!"
  }'

# ❌ Craftsman tries to create chat (Should fail with 403)
curl -X POST http://localhost:5000/api/messages/chats \
  -H "Authorization: Bearer CRAFTSMAN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "craftsmanId": "674d8e9a123456789abcdef3"
  }'
```

### **2. Test Socket.IO Connection**

```javascript
// Test script for Socket.IO events
const io = require('socket.io-client');

const socket = io('http://localhost:5000', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});

socket.on('connect', () => {
  console.log('✅ Connected to server');

  // Test joining a chat
  socket.emit('join-chat', 'CHAT_ID');

  // Test sending a message
  socket.emit('send-message', {
    chatId: 'CHAT_ID',
    messageType: 'text',
    content: 'Test message'
  });
});

socket.on('new-message', (message) => {
  console.log('📨 Received message:', message);
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});
```

### **3. Test Image Upload**

```bash
# Upload image file to chat
curl -X POST http://localhost:5000/api/messages/chats/CHAT_ID/upload-image \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "image=@/path/to/your/image.jpg"
```

```javascript
// Frontend image upload example
async function uploadImageMessage(chatId, imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);

  try {
    const response = await fetch(`/api/messages/chats/${chatId}/upload-image`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });

    const result = await response.json();
    console.log('Image uploaded:', result);
    return result;
  } catch (error) {
    console.error('Upload failed:', error);
  }
}

// React/HTML file input example
const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (file) {
    await uploadImageMessage(currentChatId, file);
  }
};

// HTML
// <input type="file" accept="image/*" onChange={handleImageUpload} />
```

### **4. Test Authorization**

```bash
# Test with invalid token (Should fail with 401)
curl -X GET http://localhost:5000/api/messages/chats \
  -H "Authorization: Bearer INVALID_TOKEN"

# Test accessing other user's chat (Should fail with 403)
curl -X GET http://localhost:5000/api/messages/chats/OTHER_USER_CHAT_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📈 **Performance & Best Practices**

### **Rate Limiting**

- **Message sending**: 60 messages per minute per user
- **Chat creation**: 10 chats per hour per user
- **API requests**: 1000 requests per hour per user

### **Pagination**

- **Default page size**: 20 items
- **Maximum page size**: 100 items
- **Recommended page size**: 20-50 items

### **Real-time Events**

- **Auto-reconnection**: Enabled with exponential backoff
- **Event queuing**: Messages queued during disconnection
- **Room management**: Automatic join/leave on connect/disconnect

### **Data Optimization**

- **Message content**: Max 2000 characters
- **Image messages**: Store URLs, not binary data
- **Chat previews**: Last message truncated to 100 characters
- **Unread counts**: Efficiently stored as MongoDB Map

---

## 🔧 **Development Setup**

### **Environment Variables**

```env
# Database
MONGODB_URI=mongodb://localhost:27017/craftworks

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Socket.IO
SOCKET_CORS_ORIGIN=http://localhost:3000
```

### **Testing Commands**

```bash
# Run tests
npm test

# Run development server
npm run dev

# Run Socket.IO test script
node scripts/test-socket.js
```

---

## 🚀 **Deployment Considerations**

### **Production Settings**

- Enable **CORS** for production frontend URL
- Use **Redis adapter** for Socket.IO scaling
- Implement **message encryption** for sensitive data
- Set up **monitoring** for Socket.IO connections
- Configure **load balancing** for multiple server instances

### **Scaling**

- **Horizontal scaling**: Use Redis for Socket.IO room synchronization
- **Database scaling**: Consider read replicas for message history
- **CDN**: Use CDN for image message delivery
- **Caching**: Implement Redis caching for frequent chat queries

---

This documentation provides everything needed to integrate with the Craftworks chat system! 🎉
