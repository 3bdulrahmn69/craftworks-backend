# API Examples for Action Logging System

This document provides practical examples of how to use the logging system API endpoints.

## Authentication

All logging endpoints require admin authentication. Include the JWT token in the Authorization header:

```bash
Authorization: Bearer <admin_jwt_token>
```

## Examples

### 1. View Recent Login Attempts

```bash
curl -X GET "http://localhost:3000/api/logs?category=auth&action=login&limit=20" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "_id": "64f5a1b2c3d4e5f6a7b8c9d0",
        "userId": "64f5a1b2c3d4e5f6a7b8c9d1",
        "userEmail": "john@example.com",
        "userName": "John Doe",
        "userRole": "client",
        "action": "login",
        "category": "auth",
        "details": {
          "email": "john@example.com",
          "loginMethod": "email"
        },
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0...",
        "success": true,
        "timestamp": "2025-07-14T10:30:00.000Z"
      }
    ],
    "totalCount": 150,
    "page": 1,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "message": "Logs retrieved successfully"
}
```

### 2. View Failed Actions in Last 24 Hours

```bash
curl -X GET "http://localhost:3000/api/logs?success=false&startDate=2025-07-13T10:00:00Z&endDate=2025-07-14T10:00:00Z" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 3. Advanced Filtering with POST

```bash
curl -X POST "http://localhost:3000/api/logs/filter" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categories": ["auth", "security"],
    "success": false,
    "startDate": "2025-07-01T00:00:00Z",
    "endDate": "2025-07-14T23:59:59Z",
    "search": "failed",
    "page": 1,
    "limit": 25
  }'
```

### 4. Get System Statistics

```bash
curl -X GET "http://localhost:3000/api/logs/stats?startDate=2025-07-01T00:00:00Z&endDate=2025-07-14T23:59:59Z" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalActions": 2500,
      "successfulActions": 2350,
      "failedActions": 150,
      "successRate": 94
    },
    "categoryBreakdown": [
      {
        "_id": "auth",
        "count": 800,
        "successCount": 750
      },
      {
        "_id": "user_management",
        "count": 600,
        "successCount": 590
      }
    ],
    "topActions": [
      {
        "_id": "login",
        "count": 500,
        "successCount": 480
      },
      {
        "_id": "view_profile",
        "count": 300,
        "successCount": 300
      }
    ]
  }
}
```

### 5. Get Available Filter Options

```bash
curl -X GET "http://localhost:3000/api/logs/filter-options" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "categories": ["auth", "user_management", "content", "system", "security", "financial", "communication"],
    "actions": ["login", "logout", "register", "view_logs", "create_user", "update_profile"],
    "userRoles": ["admin", "client", "craftsman", "moderator"],
    "successOptions": [true, false]
  }
}
```

### 6. Search for Specific User Activity

```bash
curl -X GET "http://localhost:3000/api/logs?userEmail=suspicious@example.com&limit=100" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 7. Monitor Recent Admin Actions

```bash
curl -X POST "http://localhost:3000/api/logs/filter" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userRoles": ["admin"],
    "startDate": "2025-07-14T00:00:00Z",
    "page": 1,
    "limit": 50
  }'
```

### 8. Check System Errors

```bash
curl -X POST "http://localhost:3000/api/logs/filter" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "categories": ["system", "security"],
    "success": false,
    "page": 1,
    "limit": 50
  }'
```

### 9. Cleanup Old Logs (Admin Only)

```bash
curl -X POST "http://localhost:3000/api/logs/cleanup" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "olderThanDays": 365
  }'
```

**Response:**

```json
{
  "success": true,
  "data": {
    "deletedCount": 1250
  },
  "message": "Successfully cleaned up 1250 old log entries"
}
```

### 10. Monitor Registration Patterns

```bash
curl -X GET "http://localhost:3000/api/logs?action=register&startDate=2025-07-01T00:00:00Z&limit=100" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## Error Responses

### Unauthorized (No Token)

```json
{
  "success": false,
  "message": "No token provided"
}
```

### Forbidden (Non-Admin User)

```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### Bad Request (Invalid Parameters)

```json
{
  "success": false,
  "message": "Invalid date format"
}
```

## Query Parameters Reference

### GET `/api/logs`

| Parameter   | Type    | Description                | Example                    |
| ----------- | ------- | -------------------------- | -------------------------- |
| `userId`    | string  | Filter by user ID          | `64f5a1b2c3d4e5f6a7b8c9d1` |
| `userEmail` | string  | Filter by email (partial)  | `john@example.com`         |
| `action`    | string  | Filter by action (partial) | `login`                    |
| `category`  | string  | Filter by category         | `auth`                     |
| `success`   | boolean | Filter by success status   | `true` or `false`          |
| `startDate` | string  | Start date (ISO)           | `2025-07-01T00:00:00Z`     |
| `endDate`   | string  | End date (ISO)             | `2025-07-14T23:59:59Z`     |
| `ipAddress` | string  | Filter by IP               | `192.168.1.100`            |
| `page`      | number  | Page number                | `1`                        |
| `limit`     | number  | Items per page (max 100)   | `50`                       |
| `sortBy`    | string  | Sort field                 | `timestamp`                |
| `sortOrder` | string  | Sort order                 | `asc` or `desc`            |

## Use Cases

### Security Monitoring

- Monitor failed login attempts
- Track admin actions
- Identify suspicious IP addresses
- Monitor after-hours activity

### Debugging

- Track user actions before errors
- Monitor API usage patterns
- Identify performance bottlenecks
- Debug authentication issues

### Analytics

- User behavior analysis
- Feature usage statistics
- Performance metrics
- Conversion tracking

### Compliance

- Audit trails for regulations
- Data access logging
- Administrative action tracking
- Security incident investigation
