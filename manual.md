# Craftworks Backend API Manual

This manual provides practical usage instructions, example requests, and example responses for all available backend API endpoints. Use this as a guide for integrating with the Craftworks service marketplace backend.

---

## Table of Contents
1. [Authentication](#authentication)
2. [Users](#users)
3. [Jobs](#jobs)
4. [Quotes](#quotes)
5. [Invitations](#invitations)
6. [Payments & Wallet](#payments--wallet)
7. [Reviews & Disputes](#reviews--disputes)
8. [Admin](#admin)
9. [Contact Email](#contact-email)
10. [Services](#services)
11. [Notifications](#notifications)
12. [AI Recommendations](#ai-recommendations)
13. [Error Responses](#error-responses)

---

## Authentication

### Register
`POST /api/auth/register`

**Request Example:**
```json
{
  "email": "client@example.com",
  "password": "Password123!",
  "role": "Client",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response Example:**
```json
{
  "message": "Registration successful.",
  "data": {
    "userId": "...",
    "email": "client@example.com",
    "role": "Client"
  }
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
  "token": "<JWT_TOKEN>",
  "user": {
    "userId": "...",
    "email": "client@example.com",
    "role": "Client"
  }
}
```

**Note:** Use the returned JWT token in the `Authorization: Bearer <token>` header for all protected endpoints.

---

## Users

### Get Current User Profile
`GET /api/users/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response Example:**
```json
{
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
  }
}
```

### Update Current User Profile
`PUT /api/users/me`

**Request Example:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "profilePicture": "<base64 or file upload>"
}
```

**Response Example:**
```json
{
  "message": "Profile updated successfully.",
  "data": {
    "_id": "...",
    "firstName": "Jane",
    "lastName": "Smith"
  }
}
```

### Get All Craftsmen (for Invitation)
`GET /api/users?role=craftsman&skills=Plumbing`

**Response Example:**
```json
{
  "data": [
    {
      "_id": "...",
      "firstName": "Ahmed",
      "lastName": "Ali",
      "skills": ["Plumbing", "Electrical"],
      "profilePicture": "...",
      "location": { "type": "Point", "coordinates": [31.2, 30.1] }
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

---

## Jobs

### Create Job
`POST /api/jobs`

**Request Example:**
```json
{
  "title": "Fix kitchen sink",
  "description": "Leaking pipe under the sink.",
  "category": "Plumbing",
  "address": "123 Main St, Cairo",
  "photos": ["<cloudinary_url>"]
}
```

**Response Example:**
```json
{
  "message": "Job created successfully.",
  "data": {
    "_id": "...",
    "title": "Fix kitchen sink",
    "status": "Posted"
  }
}
```

### Get Jobs (for Craftsmen)
`GET /api/jobs?category=Plumbing&location=...`

**Response Example:**
```json
{
  "data": [
    {
      "_id": "...",
      "title": "Fix kitchen sink",
      "category": "Plumbing",
      "status": "Posted",
      "client": { "_id": "...", "firstName": "John" }
    }
  ],
  "pagination": { "page": 1, "limit": 10, "totalPages": 1, "totalItems": 1 }
}
```

---

## Quotes

### Submit Quote (Craftsman)
`POST /api/jobs/:jobId/quotes`

**Request Example:**
```json
{
  "price": 5000,
  "notes": "Can fix it tomorrow."
}
```

**Response Example:**
```json
{
  "message": "Quote submitted successfully.",
  "data": {
    "_id": "...",
    "price": 5000,
    "status": "Submitted"
  }
}
```

### Get Quotes for a Job (Client)
`GET /api/jobs/:jobId/quotes`

**Response Example:**
```json
{
  "data": [
    {
      "_id": "...",
      "craftsman": { "_id": "...", "firstName": "Ahmed" },
      "price": 5000,
      "notes": "Can fix it tomorrow.",
      "status": "Submitted"
    }
  ]
}
```

---

## Invitations

### Invite Craftsman to Job
`POST /api/jobs/:jobId/invite`

**Request Example:**
```json
{
  "craftsmanId": "..."
}
```

**Response Example:**
```json
{
  "message": "Invitation sent successfully.",
  "data": {
    "invitationId": "...",
    "status": "Pending"
  }
}
```

### View Invitations for a Job (Client)
`GET /api/jobs/:jobId/invitations`

**Response Example:**
```json
{
  "data": [
    {
      "_id": "...",
      "craftsman": { "_id": "...", "firstName": "Ahmed" },
      "status": "Pending"
    }
  ]
}
```

### Craftsman Responds to Invitation
`POST /api/jobs/:jobId/invitations/respond`

**Request Example:**
```json
{
  "response": "Accepted"
}
```

**Response Example:**
```json
{
  "message": "Invitation response recorded.",
  "data": {
    "status": "Accepted"
  }
}
```

---

## Payments & Wallet

### Get Wallet Balance
`GET /api/wallet/balance`

**Response Example:**
```json
{
  "data": {
    "balance": 10000,
    "withdrawableBalance": 5000
  }
}
```

### Request Withdrawal
`POST /api/wallet/withdraw`

**Request Example:**
```json
{
  "amount": 5000
}
```

**Response Example:**
```json
{
  "message": "Withdrawal request submitted.",
  "data": {
    "status": "Pending"
  }
}
```

---

## Reviews & Disputes

### Submit Review
`POST /api/reviews`

**Request Example:**
```json
{
  "jobId": "...",
  "revieweeId": "...",
  "rating": 5,
  "comment": "Great work!"
}
```

**Response Example:**
```json
{
  "message": "Review submitted successfully.",
  "data": {
    "_id": "...",
    "rating": 5
  }
}
```

---

## Admin

### Get All Users (Admin)
`GET /api/admin/users?page=1&limit=10`

**Response Example:**
```json
{
  "data": [
    { "_id": "...", "email": "user@example.com", "role": "Client" }
  ],
  "pagination": { "page": 1, "limit": 10, "totalPages": 1, "totalItems": 1 }
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
  "message": "Email sent successfully."
}
```

---

## Services

### Get All Services
`GET /api/services`

**Response Example:**
```json
[
  {
    "id": "...",
    "name": "Plumbing",
    "icon": "faucet-icon",
    "description": "Water systems and pipe work"
  }
]
```

---

## Notifications

### Get Notifications
`GET /api/notifications`

**Response Example:**
```json
{
  "data": [
    {
      "_id": "...",
      "type": "invitation",
      "title": "You have a new job invitation!",
      "message": "Client John invited you to a job.",
      "read": false,
      "createdAt": "2024-06-01T12:00:00Z"
    }
  ]
}
```

### Mark Notifications as Read
`POST /api/notifications/mark-read`

**Request Example:**
```json
{
  "notificationIds": ["..."]
}
```

**Response Example:**
```json
{
  "message": "Notifications marked as read."
}
```

---

## AI Recommendations

### Get Recommended Craftsmen for a Job
`GET /api/users/recommendations?jobId=...`

**Response Example:**
```json
{
  "data": [
    {
      "_id": "...",
      "firstName": "Ahmed",
      "skills": ["Plumbing"],
      "rating": 4.9,
      "distance": 2.1
    }
  ]
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
- Use pagination parameters (`page`, `limit`) where supported.
- Filter and search parameters are available for many list endpoints.
- All dates are in ISO 8601 format (UTC).
- For file uploads (e.g., profile pictures), use multipart/form-data.

---

**End of Manual.** 