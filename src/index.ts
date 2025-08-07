import express, { Application, Request, Response } from 'express';
import { createServer, Server as HttpServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { serverConfig, rateLimitConfig } from './config/environment.js';
import { connectDatabase } from './config/database.js';
import logger, { morganStream } from './services/logger.js';
import { initializeSocket } from './services/socket.service.js';
import { requestLogger } from './middlewares/logging.middleware.js';
import {
  notFoundHandler,
  globalErrorHandler,
} from './middlewares/error.middleware.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import logsRoutes from './routes/logs.routes.js';
import userRoutes from './routes/user.routes.js';
import sendEmailRoutes from './routes/sendEmail.routes.js';
import adminRoutes from './routes/admin.routes.js';
import jobRoutes from './routes/job.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import serviceRoutes from './routes/service.routes.js';
import messageRoutes from './routes/message.routes.js';
import reviewRoutes from './routes/review.routes.js';
import disputeRoutes from './routes/dispute.routes.js';
import { walletRoutes } from './routes/wallet.routes.js';

class CraftworksServer {
  private app: Application;
  private server: HttpServer;
  private port: number;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.port = serverConfig.port;
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
    this.initializeSocket();
  }

  private initializeMiddlewares(): void {
    // Security and CORS
    this.app.use(helmet());
    this.app.use(
      cors({
        origin: serverConfig.corsOrigin,
        credentials: true,
      })
    );

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    this.app.use(morgan('combined', { stream: morganStream }));
    this.app.use(requestLogger);

    // Rate limiting
    const limiter = rateLimit(rateLimitConfig);
    this.app.use('/api/', limiter);

    // Health check endpoint
    this.app.get('/health', (_req: Request, res: Response) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: serverConfig.nodeEnv,
      });
    });
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/logs', logsRoutes);
    this.app.use('/api/users', userRoutes);
    this.app.use('/api/send-email', sendEmailRoutes);
    this.app.use('/api/admin', adminRoutes);
    this.app.use('/api/jobs', jobRoutes);
    this.app.use('/api/notifications', notificationRoutes);
    this.app.use('/api/services', serviceRoutes);
    this.app.use('/api/messages', messageRoutes);
    this.app.use('/api/reviews', reviewRoutes);
    this.app.use('/api/disputes', disputeRoutes);
    this.app.use('/api/wallet', walletRoutes);

    // 404 handler for /api/* routes
    this.app.use('/api/*', notFoundHandler);
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use(globalErrorHandler);
  }

  private initializeSocket(): void {
    // Initialize Socket.IO
    initializeSocket(this.server);
    logger.info('Socket.IO initialized');
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await connectDatabase();
      logger.info('Database connection established');

      // Start server
      this.server.listen(this.port, () => {
        logger.info(`Server is running on port ${this.port}`, {
          environment: serverConfig.nodeEnv,
          port: this.port,
        });
      });

      // Graceful shutdown handlers
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Failed to start server', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on(
      'unhandledRejection',
      (reason: unknown, promise: Promise<any>) => {
        logger.error('Unhandled Rejection at:', { promise, reason });
      }
    );

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', {
        error: error.message,
        stack: error.stack,
      });
      process.exit(1);
    });
  }

  public getApp(): Application {
    return this.app;
  }
}

// Start the server
const server = new CraftworksServer();
server.start().catch((error) => {
  logger.error('Application startup failed', {
    error: error instanceof Error ? error.message : 'Unknown error',
  });
  process.exit(1);
});

export default server;
