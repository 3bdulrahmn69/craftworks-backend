import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { serverConfig, rateLimitConfig } from './config/environment.js';
import { connectDatabase } from './config/database.js';
import logger, { morganStream } from './services/logger.js';
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

class CraftworksServer {
  private app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = serverConfig.port;
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
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

    // 404 handler for /api/* routes
    this.app.use('/api/*', notFoundHandler);
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use(globalErrorHandler);
  }

  public async start(): Promise<void> {
    try {
      // Connect to database
      await connectDatabase();
      logger.info('Database connection established');

      // Start server
      this.app.listen(this.port, () => {
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
