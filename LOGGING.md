# Action Logging System

This document describes the comprehensive action logging system implemented in the Craftworks backend.

## Overview

The logging system tracks all user actions and system events, providing detailed audit trails for security, debugging, and analytics purposes. Only administrators have access to view and manage logs.

## Features

- **Comprehensive Logging**: Tracks authentication, user actions, and system events
- **Admin-Only Access**: Only users with admin role can access logs (not even moderators)
- **Advanced Filtering**: Filter logs by category, action, user, date range, and more
- **Pagination Support**: Efficient handling of large log datasets
- **Statistics Dashboard**: Overview of system activity and success rates
- **Automatic Cleanup**: TTL-based cleanup of old logs (configurable)

## Endpoints

### Base URL: `/api/logs`

All endpoints require authentication and admin role.

### GET `/api/logs`

Retrieve action logs with pagination and basic filtering.

**Query Parameters:**

- `userId` (string): Filter by specific user ID
- `userEmail` (string): Filter by user email (partial match)
- `action` (string): Filter by action name (partial match)
- `category` (string): Filter by action category
- `success` (boolean): Filter by success status
- `startDate` (string): Start date for date range filter (ISO format)
- `endDate` (string): End date for date range filter (ISO format)
- `ipAddress` (string): Filter by IP address
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50, max: 100)
- `sortBy` (string): Sort field (default: 'timestamp')
- `sortOrder` (string): Sort order 'asc' or 'desc' (default: 'desc')

**Example:**

```
GET /api/logs?category=auth&success=true&page=1&limit=20
```

### POST `/api/logs/filter`

Advanced filtering with complex criteria.

**Request Body:**

```json
{
  "categories": ["auth", "user_management"],
  "actions": ["login", "register"],
  "success": true,
  "userRoles": ["admin", "client"],
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": "2025-12-31T23:59:59Z",
  "search": "john@example.com",
  "page": 1,
  "limit": 50
}
```

### GET `/api/logs/stats`

Get logging statistics and analytics.

**Query Parameters:**

- `startDate` (string): Start date for statistics period
- `endDate` (string): End date for statistics period

**Response includes:**

- Total action counts
- Success/failure rates
- Category breakdown
- Top actions
- Time-based analytics

### GET `/api/logs/filter-options`

Get available filter options (categories, actions, user roles).

### POST `/api/logs/cleanup`

Clean up old log entries (admin only).

**Request Body:**

```json
{
  "olderThanDays": 365
}
```

## Log Categories

- **auth**: Authentication-related actions (login, logout, register)
- **user_management**: User profile and account management
- **content**: Content creation, editing, and management
- **system**: System administration and configuration
- **security**: Security-related events and alerts
- **financial**: Payment and financial transactions
- **communication**: Messaging and notifications

## Tracked Actions

### Authentication Actions

- `login`: Successful user login
- `logout`: User logout
- `register`: New user registration
- `login_failed`: Failed login attempt
- `register_failed`: Failed registration attempt

### System Actions

- `view_logs`: Admin viewing logs
- `view_filtered_logs`: Admin viewing filtered logs
- `view_logs_stats`: Admin viewing log statistics
- `cleanup_logs`: Admin cleaning up old logs

### Automatic Action Logging

The system automatically logs HTTP requests for authenticated users:

- `view_*`: GET requests
- `create_*`: POST requests
- `update_*`: PUT/PATCH requests
- `delete_*`: DELETE requests

## Log Entry Structure

Each log entry contains:

```typescript
{
  userId?: string;           // User performing the action
  userEmail?: string;        // User's email
  userName?: string;         // User's full name
  userRole?: string;         // User's role
  action: string;            // Action identifier
  category: ActionCategory;  // Action category
  details?: object;          // Additional action details
  ipAddress?: string;        // Client IP address
  userAgent?: string;        // Client user agent
  location?: string;         // Geo location (if available)
  success: boolean;          // Action success status
  errorMessage?: string;     // Error message if failed
  timestamp: Date;           // When the action occurred
  sessionId?: string;        // Session identifier
}
```

## Data Retention

- Logs are automatically deleted after 365 days (configurable)
- Manual cleanup available through admin endpoint
- Compound indexes ensure efficient querying

## Security Features

- **Admin-Only Access**: Only administrators can view logs
- **Action Logging**: All log access is itself logged
- **IP Tracking**: Client IP addresses are recorded
- **User Agent Tracking**: Client information is captured
- **Audit Trail**: Complete audit trail of who accessed what when

## Usage Examples

### View Recent Login Attempts

```
GET /api/logs?category=auth&action=login&limit=100
```

### Check Failed Actions

```
GET /api/logs?success=false&startDate=2025-07-01T00:00:00Z
```

### Filter by User

```
GET /api/logs?userEmail=john@example.com
```

### Get Monthly Statistics

```
GET /api/logs/stats?startDate=2025-07-01T00:00:00Z&endDate=2025-07-31T23:59:59Z
```

## Implementation Notes

1. **Performance**: Indexes are created for efficient querying
2. **Storage**: Uses MongoDB for scalable log storage
3. **Async Logging**: Non-blocking logging to avoid performance impact
4. **Error Handling**: Logging failures don't affect main application flow
5. **Winston Integration**: Also logs to Winston for file-based logging

## Monitoring and Alerts

The logging system provides data for:

- Security monitoring and intrusion detection
- Performance analytics and bottleneck identification
- User behavior analysis
- Compliance and audit requirements
- Error tracking and debugging

## Configuration

Key configuration options:

- Log retention period (default: 365 days)
- Auto-cleanup enabled/disabled
- Log level filtering
- Storage limits and rotation

For implementation details, see:

- `src/models/actionLog.model.ts` - Log data model
- `src/services/actionLog.service.ts` - Log business logic
- `src/controllers/logs.controller.ts` - API endpoints
- `src/middlewares/logging.middleware.ts` - Automatic logging
