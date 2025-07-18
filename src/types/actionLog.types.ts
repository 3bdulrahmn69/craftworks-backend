import { Document } from 'mongoose';

export interface IActionLog extends Document {
  userId?: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  action: string;
  category: ActionCategory;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
  success: boolean;
  errorMessage?: string;
  timestamp: Date;
  sessionId?: string;
}

export type ActionCategory =
  | 'auth'
  | 'user_management'
  | 'content'
  | 'system'
  | 'security'
  | 'financial'
  | 'communication';

export interface IActionLogQuery {
  userId?: string;
  userEmail?: string;
  action?: string;
  category?: ActionCategory;
  success?: boolean;
  startDate?: Date;
  endDate?: Date;
  ipAddress?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IActionLogResponse {
  logs: IActionLog[];
  totalCount: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ILogFilter {
  category?: ActionCategory[];
  actions?: string[];
  success?: boolean;
  userRoles?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}
