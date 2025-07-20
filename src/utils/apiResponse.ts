import { Response, Request, NextFunction } from 'express';
import { IErrorResponse, ISuccessResponse } from '../types/common.types.js';

export class ApiResponse {
  static success<T>(
    res: Response,
    data?: T,
    message?: string,
    statusCode: number = 200
  ): Response {
    const response: ISuccessResponse<T> = {
      success: true,
      ...(data !== undefined && { data }),
      ...(message && { message }),
    };
    return res.status(statusCode).json(response);
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    error?: string
  ): Response {
    const response: IErrorResponse = {
      success: false,
      message,
      statusCode,
      ...(error && { error }),
    };
    return res.status(statusCode).json(response);
  }

  static badRequest(res: Response, message: string = 'Bad Request'): Response {
    return ApiResponse.error(res, message, 400);
  }

  static unauthorized(
    res: Response,
    message: string = 'Unauthorized'
  ): Response {
    return ApiResponse.error(res, message, 401);
  }

  static forbidden(res: Response, message: string = 'Forbidden'): Response {
    return ApiResponse.error(res, message, 403);
  }

  static notFound(res: Response, message: string = 'Not Found'): Response {
    return ApiResponse.error(res, message, 404);
  }

  static conflict(res: Response, message: string = 'Conflict'): Response {
    return ApiResponse.error(res, message, 409);
  }

  static unprocessableEntity(
    res: Response,
    message: string = 'Unprocessable Entity'
  ): Response {
    return ApiResponse.error(res, message, 422);
  }

  static tooManyRequests(
    res: Response,
    message: string = 'Too Many Requests'
  ): Response {
    return ApiResponse.error(res, message, 429);
  }

  static internalError(
    res: Response,
    message: string = 'Internal Server Error'
  ): Response {
    return ApiResponse.error(res, message, 500);
  }

  static serviceUnavailable(
    res: Response,
    message: string = 'Service Unavailable'
  ): Response {
    return ApiResponse.error(res, message, 503);
  }
}

export const asyncHandler = (
  fn: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void | Response>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const sanitizeUser = (user: any): any => {
  if (!user) 
    return null;
  

  const userObject = user.toObject ? user.toObject() : user;
  const {
    password,
    resetPasswordToken,
    resetPasswordExpires,
    ...sanitizedUser
  } = userObject;
  return sanitizedUser;
};
