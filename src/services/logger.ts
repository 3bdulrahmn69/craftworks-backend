import winston from 'winston';
import path from 'path';
import { isProduction, isDevelopment } from '../config/environment.js';

const logDir = path.join(process.cwd(), 'src', 'logs');

// Custom format for structured logging
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let logEntry = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    if (Object.keys(meta).length > 0) logEntry += ` ${JSON.stringify(meta)}`;

    if (stack) logEntry += `\n${stack}`;

    return logEntry;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'craftworks-backend' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log'),
    }),
  ],
});

// Add console transport in development
if (isDevelopment)
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );

// Create a stream for morgan HTTP logging
export const morganStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Helper methods for structured logging
export const loggerHelpers = {
  logUserAction: (
    action: string,
    userId: string,
    metadata?: Record<string, any>
  ) => {
    logger.info(`User action: ${action}`, { userId, action, ...metadata });
  },

  logAuthAttempt: (
    success: boolean,
    email?: string,
    phone?: string,
    reason?: string
  ) => {
    logger.info('Authentication attempt', {
      email: email ? email.replace(/@.*/, '@***') : undefined,
      phone: phone ? phone.replace(/\d(?=\d{4})/g, '*') : undefined,
      success,
      reason,
    });
  },

  logError: (error: Error, context?: Record<string, any>) => {
    logger.error('Application error', {
      message: error.message,
      stack: error.stack,
      ...context,
    });
  },

  logDatabaseOperation: (
    operation: string,
    collection: string,
    metadata?: Record<string, any>
  ) => {
    logger.debug(`Database operation: ${operation}`, {
      collection,
      operation,
      ...metadata,
    });
  },
};

export default logger;
