import { Request, Response, NextFunction } from 'express';
import { ActionLogService } from '../services/actionLog.service.js';
import { IAuthenticatedRequest } from '../types/common.types.js';
import { ActionCategory } from '../types/actionLog.types.js';
import logger from '../services/logger.js';

/**
 * Middleware to automatically log HTTP requests and responses
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  const originalSend = res.send;

  // Override res.send to capture response data
  res.send = function (data) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Only log if this is an authenticated request and not a logs endpoint (to avoid recursion)
    const authenticatedReq = req as IAuthenticatedRequest;
    if (authenticatedReq.user && !req.path.startsWith('/api/logs')) {
      // Determine action based on method and path
      const action = determineAction(req.method, req.path);

      if (action) 
        // Async logging (non-blocking)
        ActionLogService.logAction({
          userId: authenticatedReq.user.userId,
          userRole: authenticatedReq.user.role,
          action,
          category: categorizeAction(req.path),
          details: {
            method: req.method,
            path: req.path,
            statusCode: res.statusCode,
            duration,
            queryParams:
              Object.keys(req.query).length > 0 ? req.query : undefined,
          },
          ipAddress: req.ip,
          userAgent: req.get('User-Agent'),
          success: res.statusCode < 400,
          errorMessage:
            res.statusCode >= 400 ? `HTTP ${res.statusCode}` : undefined,
        }).catch((error) => {
          logger.error('Failed to log request action', {
            error: error instanceof Error ? error.message : 'Unknown error',
            path: req.path,
            method: req.method,
          });
        });
      
    }

    return originalSend.call(this, data);
  };

  next();
};

/**
 * Determine action name based on HTTP method and path
 */
function determineAction(method: string, path: string): string | null {
  // Skip logging for health checks and non-meaningful endpoints
  if (path === '/health' || path.startsWith('/api/logs')) 
    return null;
  

  const pathSegments = path.split('/').filter(Boolean);
  const resource = pathSegments[1]; // Usually 'auth', 'users', etc.

  switch (method.toUpperCase()) {
    case 'GET':
      return `view_${resource}`;
    case 'POST':
      if (path.includes('/login')) 
        return 'login';
      
      if (path.includes('/register')) 
        return 'register';
      
      if (path.includes('/logout')) 
        return 'logout';
      
      return `create_${resource}`;
    case 'PUT':
    case 'PATCH':
      return `update_${resource}`;
    case 'DELETE':
      return `delete_${resource}`;
    default:
      return `${method.toLowerCase()}_${resource}`;
  }
}

/**
 * Categorize action based on path
 */
function categorizeAction(path: string): ActionCategory {
  if (path.includes('/auth')) 
    return 'auth';
  
  if (path.includes('/user')) 
    return 'user_management';
  
  if (path.includes('/admin')) 
    return 'system';
  
  if (path.includes('/log')) 
    return 'system';
  
  if (path.includes('/craftsman')) 
    return 'user_management';
  
  if (path.includes('/order')) 
    return 'content';
  
  if (path.includes('/payment')) 
    return 'financial';
  
  if (path.includes('/message')) 
    return 'communication';
  

  return 'system';
}
