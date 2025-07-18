import { Request, Response, NextFunction } from 'express';
import logger from '../services/logger.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { isProduction } from '../config/environment.js';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.path.startsWith('/api/')) {
    ApiResponse.notFound(res, `API route ${req.path} not found`);
    return;
  }
  next();
};

export const globalErrorHandler = (
  error: AppError | Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Handle different types of errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (
    error.name === 'MongoServerError' &&
    (error as any).code === 11000
  ) {
    statusCode = 409;
    message = 'Duplicate field value';
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Log error details
  logger.error('Global error handler', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    statusCode,
  });

  // Send error response
  const errorResponse = {
    success: false,
    message,
    statusCode,
    ...(!isProduction && error.stack && { stack: error.stack }),
  };

  res.status(statusCode).json(errorResponse);
};

export const asyncErrorHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
