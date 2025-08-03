# 💬 **Craftworks Chat System - Complete Guide**

## 🎯 **System Overview**

The Craftworks chat system enables **clients** to communicate with **craftsmen** about job opportunities. The system enforces role-based restrictions where **only clients can initiate chats with craftsmen**.

---

## 🏗️ **Architecture & Key Features**

### **Role-Based Chat Creation**

- ✅ **Clients** can create chats with **craftsmen**
- ❌ **Craftsmen cannot** initiate chats (they can only respond)
- ✅ Both can send messages once chat is created
- ✅ Both see chats in their chat lists

### **Real-time Messaging**

- 🔄 **new-message**: Real-time message delivery to active chat participants
- 📱 **chat-updated**: Chat list updates (last message, unread counts)
- ⚡ **Instant delivery** when users are online
- 📢 **Notifications** when users come back online

---

## 📋 **API Endpoints**

### **1. Create Chat (Client → Craftsman)**

```http
POST /api/messages/chats
Authorization: Bearer CLIENT_JWT_TOKEN
Content-Type: application/json

{
  "craftsmanId": "craftsman_user_id",
  "jobId": "optional_job_id",
  "message": "Optional initial message"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "_id": "chat_id",
    "participants": [
      {
        "_id": "client_id",
        "fullName": "John Doe",
        "role": "client"
      },
      {
        "_id": "craftsman_id",
        "fullName": "Mike Smith",
        "role": "craftsman"
      }
    ],
    "jobId": "job_reference",
    "lastMessage": "Hey, interested in my bathroom project?",
    "lastMessageAt": "2025-08-03T10:30:00Z",
    "isActive": true,
    "unreadCount": {
      "client_id": 0,
      "craftsman_id": 1
    }
  }
}
```

### **2. Get User's Chats**

```http
GET /api/messages/chats?page=1&limit=20
Authorization: Bearer USER_JWT_TOKEN
```

**Response:**

```json
{
  "success": true,
  "data": {
    "chats": [...],
    "totalCount": 15,
    "totalPages": 1,
    "currentPage": 1
  }
}
```

### **3. Get Chat Messages**

```http
GET /api/messages/chats/:chatId/messages?page=1&limit=50
Authorization: Bearer USER_JWT_TOKEN
```

### **4. Send Message (HTTP backup)**

```http
POST /api/messages/chats/:chatId/messages
Authorization: Bearer USER_JWT_TOKEN

{
  "messageType": "text",
  "content": "Hello, when can you start?"
}
```

---

## ⚡ **Socket.IO Real-time Events**

### **Connection Setup**

```javascript
// Frontend connection
const socket = io('http://localhost:3001', {
  auth: {
    token: 'your-jwt-token'
  }
});

socket.on('connect', () => {
  console.log('Connected! Auto-joined all my chats.');
});
```

### **Client → Server Events**

#### **1. Join Chat Room**

```javascript
socket.emit('join-chat', chatId);

// Response
socket.on('chat-joined', (data) => {
  console.log('Joined chat:', data);
  // { chatId, success: true, roomMembersCount: 2 }
});
```

#### **2. Send Message**

```javascript
socket.emit('send-message', {
  chatId: 'chat_id',
  messageType: 'text', // or 'image'
  content: 'Hello there!'
});

// Confirmation
socket.on('message-sent', (data) => {
  console.log('Message sent:', data);
  // { success: true, messageId, timestamp, chatId }
});
```

#### **3. Typing Indicators**

```javascript
// Start typing
socket.emit('typing-start', chatId);

// Stop typing
socket.emit('typing-stop', chatId);
```

#### **4. Mark Messages as Read**

```javascript
socket.emit('mark-messages-read', chatId);
```

### **Server → Client Events**

#### **1. New Message (Real-time Chat)**

```javascript
socket.on('new-message', (message) => {
  console.log('New message received:', message);

  // Message structure:
  // {
  //   _id: 'message_id',
  //   chatId: 'chat_id',
  //   senderId: { _id, fullName, role },
  //   messageType: 'text',
  //   content: 'Hello there!',
  //   timestamp: '2025-08-03T10:30:00Z',
  //   isRead: false
  // }

  // Update your chat UI immediately
  if (message.chatId === currentChatId) {
    appendMessageToChat(message);
    scrollToBottom();
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
  }
});
```

#### **3. New Chat Notification**

```javascript
socket.on('new-chat-notification', (data) => {
  console.log('New chat created:', data);
  // { chatId, message: 'You have a new chat conversation' }

  // Refresh chat list to show new chat
  refreshChatList();
  showNotification('New chat started!');
});
```

#### **4. Typing Indicators**

```javascript
socket.on('user-typing', (data) => {
  // { chatId, userId, isTyping: true/false }
  if (data.chatId === currentChatId) {
    if (data.isTyping) {
      showTypingIndicator(data.userId);
    } else {
      hideTypingIndicator(data.userId);
    }
  }
});
```

#### **5. Error Handling**

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
  // { message: 'Error description', code: 'ERROR_CODE' }

  showErrorToUser(error.message);
});
```

---

## 🔄 **Complete Frontend Implementation Example**

### **Chat Creation (Client Only)**

```javascript
// Client creates chat with craftsman
async function createChatWithCraftsman(craftsmanId, jobId, initialMessage) {
  try {
    const response = await fetch('/api/messages/chats', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${clientJWT}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        craftsmanId,
        jobId,
        message: initialMessage
      })
    });

    const result = await response.json();

    if (result.success) {
      // Chat created successfully
      const chatId = result.data._id;

      // Join the chat room for real-time messages
      socket.emit('join-chat', chatId);

      // Navigate to chat interface
      openChatInterface(chatId);

      return result.data;
    }
  } catch (error) {
    console.error('Failed to create chat:', error);
  }
}
```

### **Chat Interface Setup**

```javascript
class ChatInterface {
  constructor(chatId) {
    this.chatId = chatId;
    this.messages = [];
    this.setupSocketListeners();
    this.joinChat();
    this.loadMessages();
  }

  setupSocketListeners() {
    // Listen for new messages in this chat
    socket.on('new-message', (message) => {
      if (message.chatId === this.chatId) {
        this.addMessageToUI(message);
        this.markAsRead();
      }
    });

    // Listen for typing indicators
    socket.on('user-typing', (data) => {
      if (data.chatId === this.chatId) {
        this.updateTypingIndicator(data);
      }
    });
  }

  joinChat() {
    socket.emit('join-chat', this.chatId);
  }

  sendMessage(content) {
    if (!content.trim()) return;

    // Send via Socket.IO for real-time delivery
    socket.emit('send-message', {
      chatId: this.chatId,
      messageType: 'text',
      content: content.trim()
    });

    // Clear input
    this.messageInput.value = '';
  }

  addMessageToUI(message) {
    const messageElement = this.createMessageElement(message);
    this.messagesContainer.appendChild(messageElement);
    this.scrollToBottom();
  }

  markAsRead() {
    socket.emit('mark-messages-read', this.chatId);
  }
}
```

### **Chat List Management**

```javascript
class ChatListManager {
  constructor() {
    this.chats = [];
    this.setupSocketListeners();
    this.loadChats();
  }

  setupSocketListeners() {
    // Listen for chat updates (new messages, unread counts)
    socket.on('chat-updated', (chat) => {
      this.updateChatInList(chat);
    });

    // Listen for new chat notifications
    socket.on('new-chat-notification', (data) => {
      this.handleNewChatNotification(data);
    });
  }

  updateChatInList(updatedChat) {
    const existingIndex = this.chats.findIndex(c => c._id === updatedChat._id);

    if (existingIndex >= 0) {
      // Update existing chat
      this.chats[existingIndex] = updatedChat;
    } else {
      // Add new chat
      this.chats.unshift(updatedChat);
    }

    // Re-sort by last message time
    this.chats.sort((a, b) =>
      new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
    );

    this.renderChatList();
  }

  handleNewChatNotification(data) {
    // Show notification
    this.showNotification('New chat conversation started!');

    // Refresh chat list
    this.loadChats();
  }
}
```

---

## 🛡️ **Security & Authorization**

### **Role-Based Access Control**

- **JWT Authentication**: Required for all chat operations
- **Role Validation**: Only clients can create chats
- **Participant Verification**: Only chat participants can send/receive messages
- **Socket Authentication**: JWT token required for Socket.IO connection

### **Data Validation**

- **Message Content**: Cannot be empty, max 2000 characters
- **User Roles**: Validated against database
- **Chat Participation**: Verified before any operation

---

## 🧪 **Testing the System**

### **1. Test Chat Creation**

```bash
# Client creates chat with craftsman
curl -X POST http://localhost:3001/api/messages/chats \
  -H "Authorization: Bearer CLIENT_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "craftsmanId": "craftsman_id",
    "message": "Hi, interested in my project!"
  }'
```

### **2. Test Role Restrictions**

```bash
# This should fail - craftsman trying to create chat
curl -X POST http://localhost:3001/api/messages/chats \
  -H "Authorization: Bearer CRAFTSMAN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "craftsmanId": "another_craftsman_id"
  }'

# Expected: 403 Forbidden - "Only clients can initiate chats"
```

### **3. Test Socket.IO Events**

Use the test script: `node scripts/test-socket.js`

---

## 📊 **Monitoring & Debugging**

### **Debug Endpoint (Admin Only)**

```http
GET /api/messages/admin/socket-debug
Authorization: Bearer ADMIN_JWT
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalConnections": 5,
    "totalRooms": 8,
    "rooms": [
      {
        "roomName": "chat:abc123",
        "socketCount": 2,
        "userIds": ["client_id", "craftsman_id"]
      },
      {
        "roomName": "user:client_id",
        "socketCount": 1,
        "userIds": ["client_id"]
      }
    ]
  }
}
```

### **Server Logs to Monitor**

```
User connected to socket: { userId: 'xxx', role: 'client' }
Auto-joined user to all active chats: { userId: 'xxx', chatCount: 3 }
Chat created by client: { chatId: 'yyy', clientId: 'xxx', craftsmanId: 'zzz' }
Emitting new-message to chat room: { room: 'chat:yyy', messageId: 'aaa' }
Emitting chat-updated to user: { userId: 'xxx', lastMessage: 'Hello!' }
```

---

## 🎯 **Summary: How It All Works**

### **Step 1: Chat Creation**

1. **Client** posts a job or finds a craftsman
2. **Client** clicks "Start Chat" with craftsman
3. **Backend** validates roles and creates chat
4. **Both users** automatically added as participants
5. **Socket.IO** notifies both users of new chat

### **Step 2: Real-time Messaging**

1. **Users connect** → Auto-join all their chat rooms
2. **User sends message** → `send-message` via Socket.IO
3. **Backend processes** → Saves to database, updates chat
4. **Real-time delivery** → `new-message` to chat room
5. **Chat list updates** → `chat-updated` to user rooms

### **Step 3: User Experience**

- **Client**: Can create chats, send/receive messages, see all conversations
- **Craftsman**: Receives chat notifications, can respond, see all conversations
- **Both**: Real-time messaging, typing indicators, read receipts, unread counts

The system provides a seamless, WhatsApp-like experience while enforcing business rules that only clients can initiate conversations with craftsmen! 🚀
