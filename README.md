# Craftworks Backend TypeScript

A modern, scalable backend API for the Egyptian local craftsmen service marketplace built with TypeScript, Express.js, and MongoDB.

## 🚀 Features

- **Modern TypeScript**: Fully typed with strict TypeScript configuration
- **Express.js Framework**: Fast, unopinionated web framework
- **MongoDB with Mongoose**: Robust document database with elegant ODM
- **JWT Authentication**: Secure token-based authentication
- **Role-based Authorization**: Support for client, craftsman, admin, and moderator roles
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

## 📡 API Endpoints

### Authentication (`/api/auth`)

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout (protected)
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
- `POST /api/jobs/:jobId/quotes/:quoteId/accept` - Accept a quote and hire craftsman (client only, notifies craftsman)

#### Invitations (`/api/jobs/:jobId/invitations`)

- `POST /api/jobs/:jobId/invite` - Invite a craftsman to a job (client only, notifies craftsman)
- `GET /api/jobs/:jobId/invitations` - View invitations for a job (client only)
- `POST /api/jobs/:jobId/invitations/respond` - Craftsman responds to invitation (notifies client)

### Users (`/api/users`)

- `GET /api/users/me` - Get current user profile
- `PUT /api/users/me` - Update current user profile
- `GET /api/users/:userId` - Get public profile of a user
- `POST /api/users/craftsman/verification` - Submit verification documents (craftsman only)
- `GET /api/users/recommendations` - Get recommended craftsmen for a job (client only)

#### Craftsman Dashboard

- `GET /api/users/me/quotes` - Get all quotes submitted by craftsman (craftsman only, paginated)
- `GET /api/users/me/invitations` - Get all invitations received by craftsman (craftsman only, paginated)

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

For detailed API documentation, see [requirements.md](./requirements.md) which contains:

- Complete endpoint specifications
- Request/response schemas
- Authentication requirements
- Database schemas
- Business logic requirements

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
