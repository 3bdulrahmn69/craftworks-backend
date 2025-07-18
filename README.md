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

   ```bash
   npm run dev
   ```

5. **Initialize the logging system (optional)**
   ```bash
   npm run init-logs
   ```
   This creates sample log data for testing and demonstration purposes.

### Available Scripts

- `npm run dev` - Start development server with hot reload
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

## 🔧 Configuration

### Environment Variables

| Variable            | Description                       | Default       | Required |
| ------------------- | --------------------------------- | ------------- | -------- |
| `NODE_ENV`          | Application environment           | `development` | No       |
| `PORT`              | Server port                       | `5000`        | No       |
| `MONGODB_URI`       | MongoDB connection string         | -             | Yes      |
| `JWT_SECRET`        | JWT signing secret (min 32 chars) | -             | Yes      |
| `JWT_EXPIRATION`    | JWT token expiration              | `7d`          | No       |
| `RATE_LIMIT`        | Max requests per window           | `100`         | No       |
| `RATE_LIMIT_WINDOW` | Rate limit window (ms)            | `900000`      | No       |
| `CORS_ORIGIN`       | CORS allowed origins              | `*`           | No       |
| `LOG_LEVEL`         | Logging level                     | `info`        | No       |

## 📡 API Endpoints

### Authentication (`/api/auth`)

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout (protected)
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Action Logs (`/api/logs`) - Admin Only

- `GET /api/logs` - Retrieve action logs with filtering and pagination
- `POST /api/logs/filter` - Advanced log filtering with complex criteria
- `GET /api/logs/stats` - Get logging statistics and analytics
- `GET /api/logs/filter-options` - Get available filter options
- `POST /api/logs/cleanup` - Clean up old log entries

> **Note**: All logging endpoints require admin authentication. See [LOGGING.md](./LOGGING.md) for detailed documentation.

### Health Check

- `GET /health` - Application health status

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
- Structured log format with metadata

## 🚀 Production Deployment

### Build for Production

```bash
npm run build
npm start
```

### Environment Considerations

- Set `NODE_ENV=production`
- Use a strong JWT secret
- Configure proper CORS origins
- Set up MongoDB Atlas or production MongoDB
- Configure proper logging levels
- Set up monitoring and health checks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Run linting: `npm run lint:fix`
6. Commit changes: `git commit -m 'Add amazing feature'`
7. Push to branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you have any questions or need help with setup, please:

1. Check the [requirements.md](./requirements.md) for detailed specifications
2. Review the existing code and comments
3. Check the logs for any error messages
4. Create an issue with detailed information about your problem

---

**Built with ❤️ for the Egyptian craftsmen community**
