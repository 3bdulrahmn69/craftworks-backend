import { Response, NextFunction } from 'express';
import logger from '../services/logger.js';
import { AuthService, AuthenticationError } from '../services/auth.service.js';
import { IAuthenticatedRequest } from '../types/common.types.js';

export const authenticateJWT = (
  req: IAuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Auth middleware: No token provided', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });
      res.status(401).json({
        success: false,
        message: 'No token provided',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      logger.warn('Auth middleware: Empty token', {
        ip: req.ip,
        path: req.path,
      });
      res.status(401).json({
        success: false,
        message: 'Invalid token format',
      });
      return;
    }

    const decoded = AuthService.verifyToken(token);

    // Validate token payload
    if (!decoded.userId || !decoded.role) {
      logger.warn('Auth middleware: Invalid token payload', {
        tokenPayload: decoded,
        ip: req.ip,
      });
      res.status(401).json({
        success: false,
        message: 'Invalid token payload',
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof AuthenticationError) {
      logger.warn('Auth middleware: Authentication error', {
        error: error.message,
        ip: req.ip,
        path: req.path,
      });
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    logger.error('Auth middleware: Unexpected error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      path: req.path,
    });
    res.status(500).json({
      success: false,
      message: 'Authentication error',
    });
  }
};

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (
    req: IAuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    try {
      if (!req.user) {
        logger.warn('Authorization: No user in request', {
          ip: req.ip,
          path: req.path,
        });
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn('Authorization: Insufficient permissions', {
          userId: req.user.userId,
          userRole: req.user.role,
          allowedRoles,
          path: req.path,
        });
        res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Authorization middleware error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
        path: req.path,
      });
      res.status(500).json({
        success: false,
        message: 'Authorization error',
      });
    }
  };
};

export const optionalAuth = (
  req: IAuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = AuthService.verifyToken(token);
    req.user = decoded;
  } catch (error) {
    // Silently ignore token errors for optional auth
    logger.debug('Optional auth: Token validation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
    });
  }

  next();
};
