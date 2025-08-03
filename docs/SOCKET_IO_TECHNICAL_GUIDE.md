# 🔧 **Socket.IO Technical Implementation Guide**

## 🏗️ **Socket.IO Architecture Overview**

### **Room Strategy**

```
User Connection → Auto-join to:
├── user:${userId} (Personal notifications)
└── chat:${chatId} (All user's active chats)

Message Flow:
Send Message → Emit to:
├── chat:${chatId} → 'new-message' (Real-time chat display)
└── user:${userId} → 'chat-updated' (Chat list updates)
```

---

## ⚡ **Event Flow Diagrams**

### **1. User Connection Flow**

```
Client Connects with JWT
        ↓
Socket Authentication Middleware
        ↓
User Added to Connected Users Map
        ↓
Auto-join Personal Room: user:${userId}
        ↓
Auto-join All User's Chat Rooms: chat:${chatId}
        ↓
Setup Event Listeners
        ↓
Ready for Real-time Communication
```

### **2. Message Sending Flow**

```
User Sends Message
        ↓
Validate: User is Chat Participant
        ↓
Save Message to Database
        ↓
Update Chat: lastMessage, lastMessageAt, unreadCount
        ↓
Emit 'new-message' → chat:${chatId} (All participants)
        ↓
Emit 'chat-updated' → user:${userId} (Individual notifications)
        ↓
Send 'message-sent' → Sender (Confirmation)
```

### **3. Chat Creation Flow**

```
Client Creates Chat (HTTP)
        ↓
Validate: Client role, Craftsman exists
        ↓
Create Chat in Database
        ↓
Send Initial Message (if provided)
        ↓
Emit 'new-chat-notification' → Both Users
        ↓
Emit 'chat-updated' → Both Users
        ↓
Auto-join Both Users to chat:${chatId} (if online)
```

---

## 🔌 **Socket.IO Event Specifications**

### **Client → Server Events**

#### **join-chat**

```typescript
socket.emit('join-chat', chatId: string)

// Server Response:
socket.emit('chat-joined', {
  chatId: string,
  success: boolean,
  roomMembersCount: number
})
```

#### **send-message**

```typescript
socket.emit('send-message', {
  chatId: string,
  messageType: 'text' | 'image',
  content: string
})

// Server Response:
socket.emit('message-sent', {
  success: boolean,
  messageId: string,
  timestamp: Date,
  chatId: string
})
```

#### **typing-start / typing-stop**

```typescript
socket.emit('typing-start', chatId: string)
socket.emit('typing-stop', chatId: string)

// No direct response, but other users receive:
// 'user-typing' event
```

#### **mark-messages-read**

```typescript
socket.emit('mark-messages-read', chatId: string)

// Server processes and emits to other participants:
// 'message-read' event
```

### **Server → Client Events**

#### **new-message** (Real-time Chat Display)

```typescript
socket.on('new-message', (message: IMessageWithSender) => {
  // Structure:
  {
    _id: string,
    chatId: string,
    senderId: {
      _id: string,
      fullName: string,
      role: string,
      profilePicture?: string
    },
    messageType: 'text' | 'image',
    content: string,
    timestamp: Date,
    isRead: boolean
  }
})

// Use Case: Update active chat UI immediately
if (message.chatId === currentChatId) {
  appendMessageToChat(message);
  scrollToBottom();
  markAsRead();
}
```

#### **chat-updated** (Chat List Updates)

```typescript
socket.on('chat-updated', (chat: IChatWithDetails) => {
  // Structure:
  {
    _id: string,
    participants: Array<{_id, fullName, role, profilePicture}>,
    jobId?: {_id, title},
    lastMessage?: string,
    lastMessageAt?: Date,
    lastMessageSenderId?: string,
    unreadCount: {[userId]: number},
    isActive: boolean
  }
})

// Use Case: Update chat list, show unread badges
updateChatInList(chat);
if (chat._id !== currentChatId) {
  showUnreadBadge(chat._id, chat.unreadCount[currentUserId]);
}
```

#### **new-chat-notification** (New Chat Alert)

```typescript
socket.on('new-chat-notification', (data) => {
  // Structure:
  {
    chatId: string,
    message: string
  }
})

// Use Case: Show notification, refresh chat list
showNotification('New chat conversation started!');
refreshChatList();
```

#### **user-typing** (Typing Indicators)

```typescript
socket.on('user-typing', (data) => {
  // Structure:
  {
    chatId: string,
    userId: string,
    isTyping: boolean
  }
})

// Use Case: Show/hide typing indicator
if (data.chatId === currentChatId) {
  if (data.isTyping) {
    showTypingIndicator(data.userId);
  } else {
    hideTypingIndicator(data.userId);
  }
}
```

#### **error** (Error Handling)

```typescript
socket.on('error', (error) => {
  // Structure:
  {
    message: string,
    code?: string
  }
})

// Error Codes:
// - INVALID_INPUT: Missing or invalid data
// - UNAUTHORIZED: Not authorized for action
// - SEND_MESSAGE_ERROR: Failed to send message
```

---

## 🛡️ **Authentication & Security**

### **JWT Authentication Middleware**

```typescript
// Socket.IO Auth Middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const decoded = jwt.verify(token, jwtSecret);

    socket.data.user = {
      userId: decoded.userId,
      role: decoded.role
    };

    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});
```

### **Authorization Checks**

```typescript
// Before any chat operation:
const chat = await MessageService.getChatWithDetails(chatId);
const isParticipant = chat.participants.some(p => p._id === user.userId);

if (!isParticipant) {
  socket.emit('error', {
    message: 'Not authorized',
    code: 'UNAUTHORIZED'
  });
  return;
}
```

---

## 📊 **Room Management & Monitoring**

### **Room Naming Convention**

```
Personal Rooms: user:${userId}
- Used for: Notifications, chat list updates
- Members: Single user (may have multiple sockets)

Chat Rooms: chat:${chatId}
- Used for: Real-time message exchange
- Members: All chat participants
```

### **Connection Tracking**

```typescript
class SocketService {
  private connectedUsers: Map<string, ISocketUser>; // socketId -> user
  private userSockets: Map<string, Set<string>>;    // userId -> socketIds

  // Track multiple sockets per user (multiple tabs/devices)
}
```

### **Auto-Join Strategy**

```typescript
// When user connects:
socket.join(`user:${userId}`);                    // Personal room
const userChats = await getUserChats(userId);
userChats.forEach(chat => {
  socket.join(`chat:${chat._id}`);                 // All chat rooms
});
```

---

## 🔍 **Debugging & Monitoring**

### **Debug Endpoint**

```http
GET /api/messages/admin/socket-debug
Authorization: Bearer ADMIN_JWT

Response:
{
  "totalConnections": 10,
  "totalRooms": 25,
  "rooms": [
    {
      "roomName": "chat:abc123",
      "socketCount": 2,
      "socketIds": ["socket1", "socket2"],
      "userIds": ["user1", "user2"]
    }
  ]
}
```

### **Key Logs to Monitor**

```typescript
// Connection Events
'User connected to socket': { userId, socketId, role }
'Auto-joined user to all active chats': { userId, chatCount }

// Message Events
'Processing message send': { chatId, senderId, messageType }
'Message saved to database': { messageId, chatId }
'Emitting new-message to chat room': { room, messageId, roomMembersCount }
'Message sent successfully': { messageId, eventsEmitted }

// Error Events
'Error sending message via socket': { error, userId, data }
'Socket authentication error': { error }
```

### **Performance Monitoring**

```typescript
// Track room sizes
const roomSize = await io.in(`chat:${chatId}`).fetchSockets();
logger.info('Room stats', {
  chatId,
  connectedMembers: roomSize.length
});

// Track message throughput
logger.info('Message metrics', {
  messagesPerMinute: messageCount,
  activeChats: activeChatRooms.size,
  onlineUsers: connectedUsers.size
});
```

---

## 🧪 **Testing Socket.IO Events**

### **Frontend Test Implementation**

```javascript
// Test connection and auto-join
const socket = io('http://localhost:3001', {
  auth: { token: userJWT }
});

socket.on('connect', () => {
  console.log('✅ Connected, testing events...');

  // Test joining specific chat
  socket.emit('join-chat', 'test_chat_id');
});

socket.on('chat-joined', (data) => {
  console.log('✅ Joined chat:', data);

  // Test sending message
  socket.emit('send-message', {
    chatId: 'test_chat_id',
    messageType: 'text',
    content: 'Test message from Socket.IO'
  });
});

socket.on('new-message', (message) => {
  console.log('✅ Received new message:', message);
});

socket.on('message-sent', (confirmation) => {
  console.log('✅ Message sent confirmed:', confirmation);
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});
```

### **Backend Test Events**

```typescript
// Emit test events for debugging
socketService.getIO().to(`user:${userId}`).emit('test-event', {
  message: 'Testing user notification',
  timestamp: new Date()
});

socketService.getIO().to(`chat:${chatId}`).emit('test-message', {
  content: 'Testing chat room broadcast',
  chatId
});
```

---

## 🚀 **Performance Optimization**

### **Connection Limits**

```typescript
// Limit connections per user
const MAX_SOCKETS_PER_USER = 5;

if (userSockets.get(userId)?.size >= MAX_SOCKETS_PER_USER) {
  socket.disconnect();
  return;
}
```

### **Message Rate Limiting**

```typescript
// Prevent message spam
const messageRates = new Map(); // userId -> { count, lastReset }

socket.on('send-message', async (data) => {
  const now = Date.now();
  const userRate = messageRates.get(userId) || { count: 0, lastReset: now };

  if (now - userRate.lastReset > 60000) { // Reset every minute
    userRate.count = 0;
    userRate.lastReset = now;
  }

  if (userRate.count >= 30) { // Max 30 messages per minute
    socket.emit('error', {
      message: 'Rate limit exceeded',
      code: 'RATE_LIMIT'
    });
    return;
  }

  userRate.count++;
  messageRates.set(userId, userRate);

  // Process message...
});
```

### **Memory Management**

```typescript
// Clean up disconnected users
socket.on('disconnect', () => {
  connectedUsers.delete(socket.id);

  const userSocketSet = userSockets.get(userId);
  if (userSocketSet) {
    userSocketSet.delete(socket.id);
    if (userSocketSet.size === 0) {
      userSockets.delete(userId);
    }
  }
});
```

This technical implementation provides a robust, scalable real-time messaging system that enforces business rules while delivering excellent user experience! 🚀
