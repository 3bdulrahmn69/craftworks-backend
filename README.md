# Craftworks Backend TypeScript

A modern, scalable backend API for the Egyptian local craftsmen service marketplace built with TypeScript, Express.js, and MongoDB.

## 🚀 Features

- **Modern TypeScript**: Fully typed with strict TypeScript configuration
- **Express.js Framework**: Fast, unopinionated web framework
- **MongoDB with Mongoose**: Robust document database with elegant ODM
- **JWT Authentication**: Secure token-based authentication
- **Role-based Authorization**: Support for client, craftsman, admin, and moderator roles
- **Real-time Messaging**: Socket.IO powered real-time chat system between clients and craftsmen
- **Rate Limiting**: Protection against API abuse
- **Request Validation**: Comprehensive input validation
- **Error Handling**: Centralized error handling with proper logging
- **Security**: Helmet, CORS, and other security best practices
- **Action Logging**: Comprehensive audit trail with admin-only access
- **Logging**: Structured logging with Winston and action tracking
- **Notification System**: In-app notifications for all major user actions (quotes, invitations, job status, etc.)
- **Service Management**: Admin/moderator endpoints for managing available services
- **Recommendations**: Endpoint for job-based craftsman recommendations (AI-ready, currently category-based)
- **Testing Ready**: Jest configuration for unit and integration tests
- **ES6 Modules**: Modern import/export syntax throughout

## 📊 Latest Updates (v1.9.0)

**Enhanced Invitation System & Multilingual Services**

- **Invitation-to-Quote Integration**:

  - Craftsmen now submit price and notes when accepting invitations
  - Automatic quote creation upon invitation acceptance
  - Enhanced notification system with quote details
  - Streamlined craftsman response workflow

- **Multilingual Service System**:

  - Complete service model restructure with English/Arabic support
  - Service names and descriptions in both languages
  - Language-specific API queries (GET `/services?lang=en|ar`)
  - Image upload support replacing icons with Cloudinary integration
  - Soft delete system with `isActive` flag

- **Enhanced Service Management**:

  - File upload support for service images
  - Admin interfaces with multilingual form support
  - Automatic image optimization and standardization
  - Better service organization and categorization

- **Improved User Experience**:
  - Better invitation response flow with price validation
  - Language preference support for service listings
  - Enhanced error handling and validation messages
  - Consistent multilingual data structure

### Key Technical Enhancements:

- **Database Schema**: Complete service model restructure with translation objects
- **File Upload**: Multer + Cloudinary integration for service images
- **API Flexibility**: Language-specific responses and full multilingual support
- **Validation**: Enhanced multilingual validation and price requirement checks

## 📊 Previous Updates (v1.8.0)

**Major Job and Payment System Overhaul**

- **Job Creation Changes**:

  - All job fields now required except photos (title, description, service, address, location, jobDate, paymentType)
  - Removed jobPrice from job creation - only craftsmen set prices via quotes
  - Required jobDate field for scheduling
  - Enhanced address validation with all fields required

- **Payment System Updates**:

  - Restricted payment methods to only 'cash' and 'visa' (removed 'Escrow' and 'CashProtected')
  - Visa payments automatically credit craftsman wallet when job completed
  - Integrated wallet system with platform fee calculation (10% default)
  - Automatic payment processing on job completion

- **Verification Status Enhancement**:

  - Changed from `isVerified: boolean` to `verificationStatus: 'pending' | 'verified' | 'rejected' | 'none'`
  - Default verification status is now 'none' for new craftsmen
  - Updated all user transformation helpers and API responses

- **Wallet Integration**:
  - New wallet API endpoints: GET `/wallet/balance`, POST `/wallet/withdraw`
  - Automatic wallet crediting for visa payments on job completion
  - Platform fee deduction with detailed logging
  - Withdrawal request system (ready for payment processor integration)

### Key Technical Changes:

- **Job Model**: Required fields enforcement, updated payment type enum
- **User Model**: Enhanced verification status system with default 'none'
- **Payment Processing**: Automatic wallet crediting with notification system
- **API Consistency**: All endpoints updated to use new verificationStatus structure

## 📊 Previous Updates (v1.7.0)

**Enhanced Verification System with File Upload Support**

- **Verification Status in User Profiles**: GET `/users/:id` now includes `verificationStatus` field for craftsmen
- **Advanced File Upload**: Enhanced verification endpoint supports multiple file uploads with custom names
- **Document Organization**: Each uploaded document can have custom name and type classification
- **Cloudinary Integration**: Automatic file upload to Cloudinary with organized folder structure
- **Multiple File Types**: Support for images (jpg, jpeg, png, gif, webp) and PDF documents
- **Enhanced Security**: File type validation, size limits (10MB per file, 10 files max)
- **Flexible Document Types**: Send any verification document (ID cards, licenses, certificates) with custom names
- **Backward Compatibility**: All existing verification features continue to work

### Key Verification Enhancements:

- **File Upload API**: POST `/users/craftsman/verification` now accepts `multipart/form-data`
- **Custom Document Names**: Each file can have a descriptive name (e.g., "National ID Card - Front")
- **Document Type Classification**: Organize documents by type (e.g., "ID-Card", "Professional-License")
- **Automatic Cloudinary Upload**: Files stored securely with proper naming convention
- **Enhanced Validation**: Ensures file count matches names and types arrays

## 📊 Previous Updates (v1.6.0)

**Role-Based Real-time Chat System**

- **Client-Initiated Chats**: Only clients can create chats with craftsmen (enforced business rule)
- **Instant Availability**: Both participants immediately have access to the chat (no action required from craftsman)
- **Real-time Messaging**: Socket.IO powered instant message delivery with `new-message` events
- **Chat List Updates**: Automatic chat list updates with `chat-updated` events for last message and unread counts
- **Auto-Join System**: Users automatically join all their chats when connecting (seamless experience)
- **Message Types**: Support for text and image messages
- **Typing Indicators**: Real-time typing status updates
- **Read Receipts**: Message read status tracking
- **Comprehensive Logging**: Detailed event tracking for debugging and monitoring

### � Real-time Messaging System

- **Socket.IO Integration**: Full real-time communication between clients and craftsmen
- **Message Types**: Support for text and image messages
- **Real-time Features**: Typing indicators, read receipts, user presence tracking
- **Job-based Chat Initiation**: Automatic chat creation when client hires craftsman
- **Admin Moderation**: Admin access to all conversations for monitoring
- **Comprehensive API**: Both Socket.IO events and HTTP REST endpoints for flexibility
- **Frontend Ready**: Complete documentation and examples for frontend integration

### Previous Updates (v1.5.1)

### 📝 Enhanced Quote Management

- **Robust Form-Data Support**: Fixed all coordinate parsing issues for multipart/form-data requests
- **Multiple Format Support**: Handles various coordinate input formats seamlessly:
  - Simple comma-separated: `"31.2,30.1"` ✅ (recommended)
  - Array formats: `"[31.2,30.1]"`, `"[31.2, 30.1]"` ✅
  - Edge cases: `"[ '31.2,30.1' ]"` ✅ (automatic handling)
- **Enhanced Validation**: Comprehensive coordinate validation with clear error messages
- **Debugging Support**: Extensive logging for troubleshooting coordinate issues
- **Backward Compatibility**: All existing formats continue to work without changes

### 📁 Documentation Updates

- **Enhanced API Manual**: Updated MANUAL.md with comprehensive coordinate format examples
- **Troubleshooting Guide**: Added detailed troubleshooting section for coordinate issues
- **API Collection**: Updated Postman collection with coordinate format test examples
- **Format Guidelines**: Clear documentation of supported coordinate formats and best practices

## 📁 Project Structure

```
src/
├── config/          # Configuration files (env, db, etc.)
├── controllers/     # Route controllers
├── middlewares/     # Express middlewares (auth, error handling, etc.)
├── models/          # Mongoose models
├── routes/          # Express route definitions
├── services/        # Business logic and external integrations
├── types/           # TypeScript type definitions
├── utils/           # Utility/helper functions
├── logs/            # Log files
└── index.ts         # Main application entry point
```

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](./docs/) folder:

### **🔥 Primary Docs**

- **[📡 Chat API Documentation](./docs/CHAT_API_DOCUMENTATION.md)** - Complete API reference with request/response examples
- **[💬 Chat System Guide](./docs/CHAT_SYSTEM_COMPLETE_GUIDE.md)** - User-friendly implementation guide
- **[⚡ Socket.IO Technical Guide](./docs/SOCKET_IO_TECHNICAL_GUIDE.md)** - Real-time messaging technical details

### **📋 System Docs**

- **[📖 Manual](./docs/manual.md)** - System setup and operational procedures
- **[📝 Requirements](./docs/requirements.md)** - Project requirements and specifications
- **[📊 Logging](./docs/LOGGING.md)** - Logging system documentation

### **📚 Development History**

- **[🔄 Refactoring Summary](./docs/REFACTORING_COMPLETE_SUMMARY.md)** - Chat system evolution
- **[🧹 Cleanup Complete](./docs/CLEANUP_COMPLETE.md)** - Latest optimizations

**👉 Start with the [docs README](./docs/README.md) for a complete overview!**

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcryptjs
- **Validation**: Custom validation utilities
- **Logging**: Winston
- **Security**: Helmet, CORS, express-rate-limit
- **Testing**: Jest with ts-jest
- **Code Quality**: ESLint with TypeScript support

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd craftworks-backend-typescript
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:

   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/craftworks
   JWT_SECRET=your-super-secret-jwt-key-change-in-production-make-it-long-and-random
   JWT_EXPIRATION=7d
   RATE_LIMIT=100
   RATE_LIMIT_WINDOW=900000
   CORS_ORIGIN=*
   LOG_LEVEL=info
   ```

4. **Start the development server**

   > **Note:** This project uses Node.js's new `register()` loader API for TypeScript ESM support. You must have a `register-ts-node.mjs` file in your project root:
   >
   > ```js
   > // register-ts-node.mjs
   > import { register } from "node:module";
   > import { pathToFileURL } from "node:url";
   > register("ts-node/esm", pathToFileURL("./"));
   > ```
   >
   > Your `package.json` dev script should be:
   >
   > ```json
   > "dev": "nodemon --watch src --ext ts --exec \"node --import ./register-ts-node.mjs src/index.ts\""
   > ```

   Then run:

   ```bash
   npm run dev
   ```

5. **Initialize the logging system (optional)**
   ```bash
   npm run init-logs
   ```
   This creates sample log data for testing and demonstration purposes.

### Available Scripts

- `npm run dev` - Start development server with hot reload (using register-ts-node.mjs)
- `npm run build` - Build the project for production
- `npm run start` - Start the production server
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Lint code
- `npm run lint:fix` - Lint and fix code
- `npm run typecheck` - Type check without building
- `npm run check` - Run type check and linting
- `npm run init-logs` - Initialize logging system with sample data

## � API Collection

The project includes a comprehensive Postman collection (`Craftworks-API-Collection.json`) with all endpoints for testing and development.

### Key Features:

- **Complete Coverage**: All endpoints with examples and descriptions
- **Environment Variables**: `{{base_url}}` and `{{auth_token}}` for easy configuration
- **Auto-Authentication**: Login endpoints automatically set the auth token
- **Request Examples**: Both successful and error response examples
- **File Upload Examples**: Enhanced verification endpoint with multipart/form-data examples
- **Detailed Descriptions**: Each endpoint includes usage notes and requirements

### Import Instructions:

1. Open Postman
2. Click "Import" → "Upload Files"
3. Select `Craftworks-API-Collection.json`
4. Set environment variables:
   - `base_url`: `http://localhost:5000/api`
   - `auth_token`: (automatically set after login)

### Latest Updates (v1.7.0):

- **Enhanced Verification**: New file upload endpoint with examples
- **Verification Status**: Updated user profile responses with `isVerified` field
- **Response Examples**: Added example responses for key endpoints
- **Legacy Support**: Maintained backward compatibility with JSON verification format

## �📡 API Endpoints

### Authentication (`/api/auth`)

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout (protected)
- `POST /api/auth/change-password` - Change password (protected)
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Users (`/api/users`)

- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile
- `GET /api/users/:userId` - Get public profile of a user
- `POST /api/users/craftsman/verification` - Submit verification documents (craftsman only)
- `GET /api/users/recommendations?jobId=...` - Get recommended craftsmen for a job (client only, category-based for now)

### Jobs (`/api/jobs`)

- `POST /api/jobs` - Create a new job (client only)
- `GET /api/jobs` - List jobs (with filters)
- `GET /api/jobs/:jobId` - Get job details
- `PUT /api/jobs/:jobId` - Update a job (client only)
- `DELETE /api/jobs/:jobId` - Delete/cancel a job (client only)
- `PATCH /api/jobs/:jobId/status` - Update job status (notifies client/craftsman)

#### Quotes (`/api/jobs/:jobId/quotes`)

- `POST /api/jobs/:jobId/quotes` - Submit a quote (craftsman only, notifies client)
- `GET /api/jobs/:jobId/quotes` - Get all quotes for a job (client only)
- `POST /api/jobs/:jobId/quotes/:quoteId/:status` - Accept or reject a quote (client only, notifies craftsman)

#### Invitations (`/api/jobs/:jobId/invitations`)

- `POST /api/jobs/:jobId/invite` - Invite a craftsman to a job (client only, notifies craftsman)
- `GET /api/jobs/:jobId/invitations` - View invitations for a job (client only)
- `POST /api/jobs/:jobId/invitations/respond` - Craftsman responds to invitation (notifies client)

### Users (`/api/users`)

- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile
- `GET /api/users/:userId` - Get public profile of a user (now includes `isVerified` field for craftsmen)
- `POST /api/users/craftsman/verification` - Submit verification documents with file upload (craftsman only)
- `GET /api/users/recommendations` - Get recommended craftsmen for a job (client only)

#### Craftsman Dashboard

- `GET /api/users/me/quotes` - Get all quotes submitted by craftsman (craftsman only, paginated)
- `GET /api/users/me/invitations` - Get all invitations received by craftsman (craftsman only, paginated)

## 📋 Enhanced Verification System

The verification system allows craftsmen to upload documents with custom names and types for admin review.

### Key Features

- **Multiple File Upload**: Support for up to 10 files (10MB each)
- **Custom Document Names**: Each file can have a descriptive name
- **Document Type Classification**: Organize by type (ID-Card, Professional-License, etc.)
- **File Type Support**: Images (jpg, jpeg, png, gif, webp) and PDF documents
- **Cloudinary Integration**: Automatic secure file storage
- **Verification Status**: User profiles show `isVerified: true/false` for craftsmen
- **Simple Process**: Only document images required - no additional fields needed
- **Verification Status**: User profiles show `isVerified: true/false` for craftsmen

### Usage Example

```javascript
const formData = new FormData();

// Add files
formData.append('verificationDocs', idCardFrontFile);
formData.append('verificationDocs', licenseFile);

// Add metadata
formData.append('docNames[]', 'National ID Card - Front');
formData.append('docNames[]', 'Professional License');
formData.append('docTypes[]', 'ID-Card');
formData.append('docTypes[]', 'Professional-License');

// Optional: Add portfolio images
formData.append('portfolioImageUrls[]', 'https://example.com/portfolio1.jpg');

// Submit
fetch('/api/users/craftsman/verification', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer token' },
  body: formData
});
```

### Admin Verification Management

- `GET /api/admin/verifications/pending` - Get pending verifications
- `POST /api/admin/verifications/:id/approve` - Approve verification
- `POST /api/admin/verifications/:id/reject` - Reject verification

### Notifications (`/api/notifications`)

- `GET /api/notifications` - List user notifications
- `POST /api/notifications/mark-read` - Mark notifications as read

### Services (`/api/services`)

- `GET /api/services` - List all available services (public)
- `POST /api/services` - Create a new service (admin/moderator only)
- `PUT /api/services/:id` - Update a service (admin/moderator only)
- `DELETE /api/services/:id` - Delete a service (admin/moderator only)

### Admin (`/api/admin`)

- User management, verification, and dispute endpoints (see requirements.md for full list)

## 🔔 Notification System

- In-app notifications are sent for all major user actions:
  - When a craftsman applies to a job (client notified)
  - When a client accepts a quote (craftsman notified)
  - When a client invites a craftsman (craftsman notified)
  - When a craftsman responds to an invitation (client notified)
  - When job status changes (client and craftsman notified)
- Notifications are stored in the database and can be fetched/marked as read via `/api/notifications`.
- Real-time/push notification integration is ready for future expansion.

## 🏗️ Architecture

### Service Layer Pattern

The application follows a service layer pattern for better separation of concerns:

- **Controllers**: Handle HTTP requests/responses and input validation
- **Services**: Contain business logic and orchestrate data operations
- **Models**: Define data structures and database operations
- **Middlewares**: Handle cross-cutting concerns (auth, logging, errors)

### Error Handling

Centralized error handling with:

- Custom error classes
- Async error wrapper
- Global error middleware
- Structured error responses

### Security Features

- JWT-based authentication
- Role-based access control
- Rate limiting
- Input validation and sanitization
- Security headers (Helmet)
- CORS configuration
- Comprehensive action logging and audit trails

### Action Logging System

The application includes a comprehensive action logging system that tracks all user activities:

- **Authentication Events**: Login, logout, registration attempts
- **User Actions**: Profile updates, content creation, system access
- **Admin Activities**: Log access, system administration
- **Security Events**: Failed login attempts, suspicious activities
- **Audit Trail**: Complete history with IP tracking and user agent logging

**Key Features:**

- Admin-only access to logs (not even moderators can access)
- Advanced filtering and search capabilities
- Pagination support for large datasets
- Statistical analytics and reporting
- Automatic cleanup of old logs
- Real-time action tracking

For detailed documentation, see [LOGGING.md](./LOGGING.md) and [API_EXAMPLES.md](./API_EXAMPLES.md).

## 🧪 Testing

The project includes a comprehensive testing setup:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📚 API Documentation

For detailed API documentation, see:

- [requirements.md](./requirements.md) - Complete endpoint specifications, schemas, and business logic
- [MESSAGING.md](./MESSAGING.md) - Real-time messaging system documentation with Socket.IO integration guide

## 🔍 Code Quality

The project enforces code quality through:

- **TypeScript**: Strict type checking
- **ESLint**: Code linting with TypeScript support
- **Prettier**: Code formatting (can be added)
- **Husky**: Git hooks for pre-commit checks (can be added)

## 📊 Logging

Structured logging with Winston:

- File-based logging (combined.log, error.log)
- Console output in development
- Automatic log rotation
