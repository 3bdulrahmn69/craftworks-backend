# Craftworks Backend API Manual

This manual provides practical usage instructions, example requests, and example responses for all backend API endpoints. Use this as a guide for integrating with the Craftworks backend.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Jobs](#jobs)
4. [Quotes](#quotes)
5. [Invitations](#invitations)
6. [Notifications](#notifications)
7. [Services](#services)
8. [Recommendations](#recommendations)
9. [Admin](#admin)
10. [Contact Email](#contact-email)
11. [Error Responses](#error-responses)

---

## Authentication

### Register

`POST /api/auth/register`

**Request Example:**

```json
{
  "email": "client@example.com",
  "password": "Password123!",
  "role": "client", // craftsman, admin, moderator
  "fullName": "John Doe"
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
      "role": "client"
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
  "loginIdentifier": "client@example.com", // email or phone
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
      "role": "client"
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
    "role": "client",
    "fullName": "John Doe",
    "profilePicture": "...",
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
  "fullName": "Jane Smith"
}
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "fullName": "Jane Smith"
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
    "fullName": "Ahmed Ali",
    "role": "craftsman",
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
  "message": "Verification documents submitted successfully."
}
```

### Get Recommended Craftsmen for a Job (Client Only)

`GET /api/users/recommendations?jobId=...`

**Headers:**

```
Authorization: Bearer <token>
```

**Response Example:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "fullName": "Craftsman Name",
      "profilePicture": "...",
      "rating": 4.8,
      "ratingCount": 12,
      "craftsmanInfo": {
        "skills": ["Plumbing"],
        "verificationStatus": "verified"
      }
    }
  ]
}
```

---

## Jobs

**All endpoints require authentication.**

### Create a New Job (Client Only)

`POST /api/jobs`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Example:**

```json
{
  "title": "Fix kitchen sink leak",
  "description": "There is a leak under the kitchen sink.",
  "category": "Plumbing",
  "photos": ["<cloudinary_url>"],
  "address": "123 Main St, Cairo",
  "location": { "type": "Point", "coordinates": [31.2, 30.1] },
  "paymentType": "Cash"
}
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "Fix kitchen sink leak",
    "status": "Posted",
    "createdAt": "2024-06-01T12:00:00Z"
  },
  "message": "Job created successfully."
}
```

### List Jobs

`GET /api/jobs`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Params:**

- `category` (optional)
- `status` (optional)
- `page` (optional)
- `limit` (optional)

**Response Example:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Fix kitchen sink leak",
      "category": "Plumbing",
      "status": "Posted"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalItems": 1
  }
}
```

### Get Job Details

`GET /api/jobs/:jobId`

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
    "title": "Fix kitchen sink leak",
    "description": "There is a leak under the kitchen sink.",
    "category": "Plumbing",
    "status": "Posted",
    "client": "...",
    "createdAt": "2024-06-01T12:00:00Z"
  }
}
```

### Update a Job (Client Only)

`PUT /api/jobs/:jobId`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Example:**

```json
{
  "title": "Fix kitchen sink leak (urgent)",
  "description": "Updated description."
}
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "Fix kitchen sink leak (urgent)"
  },
  "message": "Job updated successfully."
}
```

### Delete/Cancel a Job (Client Only)

`DELETE /api/jobs/:jobId`

**Headers:**

```
Authorization: Bearer <token>
```

**Response Example:**

```json
{
  "success": true,
  "message": "Job deleted"
}
```

### Update Job Status

`PATCH /api/jobs/:jobId/status`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Example:**

```json
{
  "status": "Completed"
}
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "status": "Completed"
  },
  "message": "Job status updated."
}
```

---

## Quotes

**All endpoints require authentication.**

### Submit a Quote (Craftsman Only)

`POST /api/jobs/:jobId/quotes`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Example:**

```json
{
  "price": 500,
  "notes": "Can fix it today."
}
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "job": "...",
    "craftsman": "...",
    "price": 500,
    "status": "Submitted"
  },
  "message": "Quote submitted successfully."
}
```

### Get All Quotes for a Job (Client Only)

`GET /api/jobs/:jobId/quotes`

**Headers:**

```
Authorization: Bearer <token>
```

**Response Example:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "craftsman": {
        "_id": "...",
        "fullName": "Craftsman Name",
        "profilePicture": "...",
        "rating": 4.8
      },
      "price": 500,
      "status": "Submitted"
    }
  ]
}
```

### Accept a Quote and Hire Craftsman (Client Only)

`POST /api/jobs/:jobId/quotes/:quoteId/accept`

**Headers:**

```
Authorization: Bearer <token>
```

**Response Example:**

```json
{
  "success": true,
  "message": "Quote accepted and craftsman hired",
  "data": {
    "job": { "_id": "...", "status": "Hired" },
    "quote": { "_id": "...", "status": "Accepted" }
  }
}
```

---

## Invitations

**All endpoints require authentication.**

### Invite a Craftsman to a Job (Client Only)

`POST /api/jobs/:jobId/invite`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Example:**

```json
{
  "craftsmanId": "..."
}
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "job": "...",
    "craftsman": "...",
    "status": "Pending"
  },
  "message": "Invitation sent."
}
```

### View Invitations for a Job (Client Only)

`GET /api/jobs/:jobId/invitations`

**Headers:**

```
Authorization: Bearer <token>
```

**Response Example:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "craftsman": {
        "_id": "...",
        "fullName": "Craftsman Name"
      },
      "status": "Pending"
    }
  ]
}
```

### Craftsman Responds to Invitation

`POST /api/jobs/:jobId/invitations/respond`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Example:**

```json
{
  "response": "Accepted" // or "Rejected"
}
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "status": "Accepted"
  },
  "message": "Invitation response recorded."
}
```

---

## Notifications

**All endpoints require authentication.**

### List User Notifications

`GET /api/notifications`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Params:**

- `page` (optional)
- `limit` (optional)

**Response Example:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "type": "quote",
      "title": "New Quote Received",
      "message": "A craftsman has submitted a quote for your job: Fix kitchen sink leak",
      "read": false,
      "createdAt": "2024-06-01T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "totalItems": 1
  }
}
```

### Mark Notifications as Read

`POST /api/notifications/mark-read`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Example:**

```json
{
  "notificationIds": ["..."] // optional, mark all if omitted
}
```

**Response Example:**

```json
{
  "success": true,
  "message": "Notifications marked as read"
}
```

---

## Services

### List All Services (Public)

`GET /api/services`

**Response Example:**

```json
[
  {
    "_id": "...",
    "name": "Plumbing",
    "icon": "faucet-icon",
    "description": "Water systems and pipe work"
  }
]
```

### Create a New Service (Admin/Moderator Only)

`POST /api/services`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Example:**

```json
{
  "name": "Painting",
  "icon": "paint-icon",
  "description": "Wall and house painting"
}
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Painting"
  },
  "message": "Service created."
}
```

### Update a Service (Admin/Moderator Only)

`PUT /api/services/:id`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Example:**

```json
{
  "name": "Painting & Decorating"
}
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "name": "Painting & Decorating"
  },
  "message": "Service updated."
}
```

### Delete a Service (Admin/Moderator Only)

`DELETE /api/services/:id`

**Headers:**

```
Authorization: Bearer <token>
```

**Response Example:**

```json
{
  "success": true,
  "message": "Service deleted"
}
```

---

## Recommendations

### Get Recommended Craftsmen for a Job (Client Only)

`GET /api/users/recommendations?jobId=...`

**Headers:**

```
Authorization: Bearer <token>
```

**Response Example:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "fullName": "Craftsman Name",
      "profilePicture": "...",
      "rating": 4.8,
      "ratingCount": 12,
      "craftsmanInfo": {
        "skills": ["Plumbing"],
        "verificationStatus": "verified"
      }
    }
  ]
}
```

---

## Admin

**All endpoints require admin or moderator authentication.**

See [requirements.md](./requirements.md) for the full list of admin endpoints and request/response formats for:

- User management (ban/unban, create admin, etc.)
- Craftsman verification approval/rejection
- Dispute management
- Service management

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
  "message": "Email sent successfully."
}
```

---

## Error Responses

**Common error response format:**

```json
{
  "success": false,
  "message": "Error message here"
}
```

**Common status codes:**

- `200 OK`: Successful GET, PUT, DELETE
- `201 Created`: Successful POST
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Not logged in or invalid token
- `403 Forbidden`: Not allowed
- `404 Not Found`: Resource does not exist
- `500 Server Error`: Unexpected error

---

**Built with ❤️ for the Egyptian craftsmen community**
