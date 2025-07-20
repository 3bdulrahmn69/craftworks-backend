# Craftworks Backend API Manual

This manual provides practical usage instructions, example requests, and example responses for all currently implemented backend API endpoints. Use this as a guide for integrating with the Craftworks backend as it exists now.

---

## Table of Contents
1. [Authentication](#authentication)
2. [Users](#users)
3. [Contact Email](#contact-email)
4. [Logs (Admin Only)](#logs-admin-only)
5. [Error Responses](#error-responses)

---

## Authentication

### Register
`POST /api/auth/register`

**Request Example:**
```json
{
  "email": "client@example.com",
  "password": "Password123!",
  "role": "client", // craftsman, adimn, moderator
  "fullName": "John",
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "client@example.com",
      "role": "Client"
    },
    "token": "<JWT_TOKEN>"
  },
  "message": "User registered successfully"
}
```

### Login
`POST /api/auth/login`

**Request Example:**
```json
{
  "loginIdentifier": "client@example.com",
  "password": "Password123!",
  "type": "clients"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "client@example.com",
      "role": "Client"
    },
    "token": "<JWT_TOKEN>"
  },
  "message": "Login successful"
}
```

### Forgot Password
`POST /api/auth/forgot-password`

**Request Example:**
```json
{
  "email": "client@example.com"
}
```

**Response Example:**
```json
{
  "success": true,
  "message": "If the email exists, a password reset link has been sent"
}
```

### Reset Password
`POST /api/auth/reset-password`

**Request Example:**
```json
{
  "token": "<RESET_TOKEN>",
  "newPassword": "NewPassword123!"
}
```

**Response Example:**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

### Logout
`POST /api/auth/logout`

**Headers:**
```
Authorization: Bearer <token>
```

**Response Example:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## Users

**All endpoints require authentication.**

### Get Current User Profile
`GET /api/users/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "client@example.com",
    "role": "Client",
    "firstName": "John",
    "lastName": "Doe",
    "profilePicture": "...",
    "location": { "type": "Point", "coordinates": [31.2, 30.1] },
    "wallet": { "balance": 10000, "withdrawableBalance": 5000 },
    "createdAt": "2024-06-01T12:00:00Z"
  },
  "message": "User profile retrieved successfully"
}
```

### Update Current User Profile
`PUT /api/users/me`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Example (JSON):**
```json
{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "firstName": "Jane",
    "lastName": "Smith"
  },
  "message": "Profile updated successfully."
}
```

### Get Public Profile of a User
`GET /api/users/:userId`

**Headers:**
```
Authorization: Bearer <token>
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "firstName": "Ahmed",
    "lastName": "Ali",
    "role": "Craftsman",
    "profilePicture": "..."
  },
  "message": "User profile retrieved successfully"
}
```

### Submit Verification Documents (Craftsman Only)
`POST /api/users/craftsman/verification`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Example:**
```json
{
  "skills": ["Plumbing", "Electrical"],
  "bio": "Experienced plumber and electrician.",
  "portfolioImageUrls": ["<cloudinary_url>"],
  "verificationDocs": [
    { "docType": "National ID", "docUrl": "<cloudinary_url>" }
  ]
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "craftsmanInfo": {
      "skills": ["Plumbing", "Electrical"],
      "bio": "Experienced plumber and electrician.",
      "portfolioImageUrls": ["<cloudinary_url>"],
      "verificationStatus": "Pending",
      "verificationDocs": [
        { "docType": "National ID", "docUrl": "<cloudinary_url>" }
      ]
    }
  },
  "message": "Verification documents submitted successfully"
}
```

---

## Contact Email

### Send Contact Email
`POST /api/send-email`

**Request Example:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "Hello, I have a question."
}
```

**Response Example:**
```json
{
  "success": true,
  "message": "Email sent successfully."
}
```

---

## Logs (Admin Only)

**All endpoints require authentication and admin role.**

### Get All Action Logs
`GET /api/logs`

**Headers:**
```
Authorization: Bearer <token>
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "_id": "...",
        "userId": "...",
        "action": "login",
        "category": "auth",
        "success": true,
        "timestamp": "2024-06-01T12:00:00Z"
      }
    ],
    "totalCount": 1,
    "page": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "message": "Logs retrieved successfully"
}
```

### Get Logs with Advanced Filtering
`POST /api/logs/filter`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Example:**
```json
{
  "categories": ["auth", "system"],
  "actions": ["login", "register"],
  "success": true,
  "page": 1,
  "limit": 10
}
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "_id": "...",
        "userId": "...",
        "action": "login",
        "category": "auth",
        "success": true,
        "timestamp": "2024-06-01T12:00:00Z"
      }
    ],
    "totalCount": 1,
    "page": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "message": "Filtered logs retrieved successfully"
}
```

### Get Action Logs Statistics
`GET /api/logs/stats`

**Headers:**
```
Authorization: Bearer <token>
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "login": 10,
    "register": 5
  },
  "message": "Logs statistics retrieved successfully"
}
```

### Get Filter Options for Logs
`GET /api/logs/filter-options`

**Headers:**
```
Authorization: Bearer <token>
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "categories": ["auth", "system", "user_management"],
    "actions": ["login", "register", "logout"]
  },
  "message": "Filter options retrieved successfully"
}
```

### Cleanup Old Logs
`POST /api/logs/cleanup`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Example:**
```json
{
  "olderThanDays": 365
}
```

**Response Example:**
```json
{
  "success": true,
  "message": "Old logs cleaned up successfully"
}
```

---

## Error Responses

**Standard Error Example:**
```json
{
  "success": false,
  "message": "Resource not found (invalid ID)",
  "statusCode": 404
}
```

**Validation Error Example:**
```json
{
  "success": false,
  "message": "Name, email, and message are required.",
  "statusCode": 400
}
```

**Unauthorized Example:**
```json
{
  "success": false,
  "message": "Unauthorized",
  "statusCode": 401
}
```

---

**General Tips:**
- Always use the JWT token in the `Authorization` header for protected endpoints.
- All dates are in ISO 8601 format (UTC).
- For file uploads (e.g., profile pictures), use multipart/form-data.

---

**End of Manual.** 