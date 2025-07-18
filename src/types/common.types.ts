import { Request } from 'express';
import { IJWTPayload } from './user.types.js';

export interface IAuthenticatedRequest extends Request {
  user?: IJWTPayload;
}

export interface IErrorResponse {
  success: boolean;
  message: string;
  error?: string;
  statusCode?: number;
}

export interface ISuccessResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}
