# Craftworks Backend API Manual (v1.3.0)

This manual provides practical usage instructions, example requests, and example responses for all backend API endpoints. Use this as a guide for integrating with the Craftworks backend.

**Latest Update (v1.3.0):** Enhanced service integration with populated service objects in job responses and flexible service filtering by both ID and name.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Business Rules](#business-rules)
3. [Users](#users)
4. [Jobs](#jobs)
5. [Quotes](#quotes)
6. [Invitations](#invitations)
7. [Notifications](#notifications)
8. [Services](#services)
9. [Craftsman Dashboard](#craftsman-dashboard)
10. [Recommendations](#recommendations)
11. [Admin](#admin)
12. [Contact Email](#contact-email)
13. [Enhanced Features](#-enhanced-features-v120)
14. [Error Responses](#error-responses)

---

## Authentication

### Register

`POST /api/auth/register`

**Request Example:**

```json
{
  "email": "client@example.com",
  "password": "Password123!",
  "phone": "+201018326780", // optional
  "role": "client", // client, craftsman
  "fullName": "John Doe"
}
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "client@example.com",
      "phone": "+201018326780",
      "role": "client",
      "fullName": "John Doe",
      "profilePicture": null,
      "address": {
        "country": "Egypt"
      },
      "rating": 0,
      "ratingCount": 0,
      "createdAt": "2025-07-23T10:30:00.000Z"
    }
  },
  "message": "User registered successfully"
}
```

**Note:**

- Admin and moderator accounts can only be created by existing admins
- Craftsmen will have additional fields: `wallet` and can have `craftsmanInfo` after verification
- Clients and craftsmen get `address` and `rating` fields, admins/moderators don't

````

### Login

`POST /api/auth/login`

**Request Example:**

```json
{
  "email": "client@example.com", // can use email or phone
  "password": "Password123!",
  "type": "clients" // clients (for client/craftsman) or admins (for admin/moderator)
}
````

**Alternative with phone:**

```json
{
  "phone": "+201018326780",
  "password": "Password123!",
  "type": "clients"
}
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "email": "client@example.com",
      "phone": "+201018326780",
      "role": "client",
      "fullName": "John Doe",
      "profilePicture": "https://res.cloudinary.com/demo/image/upload/d_avatar.png/client.png",
      "address": {
        "country": "Egypt",
        "state": "Cairo",
        "city": "New Cairo",
        "street": "123 Main Street"
      },
      "rating": 4.2,
      "ratingCount": 15,
      "createdAt": "2025-07-23T10:30:00.000Z"
    }
  },
  "message": "Login successful"
}
```

**For Craftsman Login Response:**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439012",
      "email": "craftsman@example.com",
      "phone": "+201018326781",
      "role": "craftsman",
      "fullName": "Ahmed Craftsman",
      "profilePicture": "https://res.cloudinary.com/demo/image/upload/d_avatar.png/craftsman.png",
      "address": {
        "country": "Egypt",
        "state": "Cairo",
        "city": "Cairo",
        "street": "321 Workshop Street"
      },
      "rating": 4.8,
      "ratingCount": 142,
      "wallet": {
        "balance": 12500,
        "withdrawableBalance": 8000
      },
      "createdAt": "2025-07-23T10:30:00.000Z"
    }
  },
  "message": "Login successful"
}
```

**For Admin/Moderator Login Response:**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "507f1f77bcf86cd799439013",
      "email": "admin@example.com",
      "role": "admin",
      "fullName": "System Administrator",
      "profilePicture": "https://res.cloudinary.com/demo/image/upload/d_avatar.png/admin.png",
      "createdAt": "2025-07-23T10:30:00.000Z"
    }
  },
  "message": "Login successful"
}
```

**Note:** Admin and moderator users don't have `address`, `rating`, `ratingCount`, or `wallet` fields.

````

### Forgot Password

`POST /api/auth/forgot-password`

**Request Example:**

```json
{
  "email": "client@example.com"
}
````

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

## Business Rules

### User Field Access by Role

The system implements role-based field access restrictions:

#### **Clients**

- ✅ Have: `address`, `rating`, `ratingCount`
- ❌ Don't have: `wallet`, `craftsmanInfo`

#### **Craftsmen**

- ✅ Have: `address`, `rating`, `ratingCount`, `wallet`, `craftsmanInfo`
- Can access all user features including wallet management

#### **Admins & Moderators**

- ✅ Have: Basic profile fields only (`id`, `email`, `role`, `fullName`, `profilePicture`, `createdAt`)
- ❌ Don't have: `address`, `rating`, `ratingCount`, `wallet`, `craftsmanInfo`

### Job Application Rules

#### **Single Application Per Job**

- Each craftsman can only apply once per job
- Attempting to submit multiple quotes for the same job returns error: `"You have already applied for this job"`
- The system tracks applied craftsmen in the job's `appliedCraftsmen` array

#### **Wallet Access**

- Only craftsmen have wallet functionality
- Clients and admins cannot access wallet features
- Wallet includes `balance` and `withdrawableBalance` fields
- **Security Enhancement**: Wallet information is not included in profile responses (`/users/me`) for enhanced privacy

### Authentication Types

#### **Client Portal** (`type: "clients"`)

- For `client` and `craftsman` roles
- Access to job posting, quote management, hiring features

#### **Admin Portal** (`type: "admins"`)

- For `admin` and `moderator` roles
- Access to user management, verification, system administration

---

## Users

**All endpoints require authentication.**

### Get Current User Profile

`GET /api/users/me`

**Headers:**

```
Authorization: Bearer <token>
```

**Response Example (Client):**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "email": "client@example.com",
    "phone": "+201018326780",
    "role": "client",
    "fullName": "John Doe",
    "profilePicture": "https://res.cloudinary.com/demo/image/upload/d_avatar.png/client.png",
    "address": {
      "country": "Egypt",
      "state": "Cairo",
      "city": "New Cairo",
      "street": "123 Main Street"
    },
    "rating": 4.2,
    "ratingCount": 15,
    "createdAt": "2025-07-23T10:30:00.000Z"
  },
  "message": "User profile retrieved successfully"
}
```

**Response Example (Craftsman):**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "email": "craftsman@example.com",
    "phone": "+201018326781",
    "role": "craftsman",
    "fullName": "Ahmed Craftsman",
    "profilePicture": "https://res.cloudinary.com/demo/image/upload/d_avatar.png/craftsman.png",
    "address": {
      "country": "Egypt",
      "state": "Cairo",
      "city": "Cairo",
      "street": "321 Workshop Street"
    },
    "rating": 4.8,
    "ratingCount": 142,
    "createdAt": "2025-07-23T10:30:00.000Z"
  },
  "message": "User profile retrieved successfully"
}
```

**Response Example (Admin/Moderator):**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439013",
    "email": "admin@example.com",
    "role": "admin",
    "fullName": "System Administrator",
    "profilePicture": "https://res.cloudinary.com/demo/image/upload/d_avatar.png/admin.png",
    "createdAt": "2025-07-23T10:30:00.000Z"
  },
  "message": "User profile retrieved successfully"
}
```

### Update Current User Profile

`PUT /api/users/me`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data or application/json
```

**Request Example (JSON):**

```json
{
  "fullName": "Jane Smith",
  "phone": "+201234567890",
  "address": {
    "country": "Egypt",
    "state": "Cairo",
    "city": "New Cairo",
    "street": "456 New Street"
  }
}
```

**Request Example (Craftsman with Service Update):**

```json
{
  "fullName": "Ahmed Craftsman",
  "serviceId": "507f1f77bcf86cd799439020",
  "address": {
    "country": "Egypt",
    "state": "Cairo",
    "city": "Cairo",
    "street": "321 Workshop Street"
  }
}
```

**Request Example (File Upload for Profile Picture):**

```
Form Data:
- profilePicture: <image_file>
- fullName: "Jane Smith"
```

**Supported Fields:**

- `fullName`: User's full name
- `email`: Email address (must be unique)
- `phone`: Phone number (must be unique)
- `profilePicture`: Profile image file (when using multipart/form-data)
- `address`: Address object with country, state, city, street
- `serviceId`: Service ID (craftsmen only) - updates the craftsman's primary service
- `craftsmanInfo`: Craftsman information object (craftsmen only)

**Response Example:**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+201234567890",
    "role": "client",
    "profilePicture": "https://res.cloudinary.com/demo/image/upload/profile.webp",
    "address": {
      "country": "Egypt",
      "state": "Cairo",
      "city": "New Cairo",
      "street": "456 New Street"
    }
  },
  "message": "Profile updated successfully"
}
```

### Delete Profile Picture

`DELETE /api/users/me/profile-picture`

**Headers:**

```
Authorization: Bearer <token>
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "fullName": "Jane Smith",
    "email": "jane@example.com",
    "role": "client",
    "profilePicture": null
  },
  "message": "Profile picture deleted successfully"
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
  "service": "60f1b5b5b5b5b5b5b5b5b5b1",
  "photos": ["<cloudinary_url>"],
  "address": {
    "country": "Egypt",
    "state": "Cairo",
    "city": "New Cairo",
    "street": "123 Main Street"
  },
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

- `service` (optional): Filter by service ID (ObjectId) or service name (string)
- `status` (optional): Filter by job status
- `paymentType` (optional): Filter by payment type (Escrow, Cash, CashProtected)
- `state` (optional): Filter by address state
- `city` (optional): Filter by address city
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)

**Example Request:**

`GET /api/jobs?service=Plumbing&state=Cairo&city=New Cairo&page=1&limit=10`

**Response Example:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Fix kitchen sink leak",
      "service": {
        "_id": "60f1b5b5b5b5b5b5b5b5b5b1",
        "name": "Plumbing",
        "icon": "faucet-icon",
        "description": "Water systems and pipe work"
      },
      "status": "Posted",
      "address": {
        "country": "Egypt",
        "state": "Cairo",
        "city": "New Cairo",
        "street": "123 Main Street"
      }
    }
  ],
        "category": "Home Maintenance"
      },
      "status": "Posted",
      "address": {
        "country": "Egypt",
        "state": "Cairo",
        "city": "New Cairo",
        "street": "123 Main Street"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalItems": 1
  },
  "message": "Jobs retrieved successfully"
}
```

### Search Jobs

`GET /api/jobs/search`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Params:**

- `q` (required): Search term to match against job title and description
- `service` (optional): Filter by service ID (ObjectId) or service name (string)
- `status` (optional): Filter by job status
- `paymentType` (optional): Filter by payment type
- `state` (optional): Filter by address state
- `city` (optional): Filter by address city
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)

**Example Request:**

`GET /api/jobs/search?q=kitchen leak&service=Plumbing&state=Cairo`

**Response Example:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Fix kitchen sink leak",
      "description": "There is a leak under the kitchen sink that needs immediate attention.",
      "service": {
        "_id": "60f1b5b5b5b5b5b5b5b5b5b1",
        "name": "Plumbing",
        "icon": "faucet-icon",
        "description": "Water systems and pipe work"
      },
      "status": "Posted",
      "address": {
        "country": "Egypt",
        "state": "Cairo",
        "city": "New Cairo",
        "street": "123 Main Street"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalItems": 1
  },
  "searchTerm": "kitchen leak",
  "message": "Found 1 jobs matching \"kitchen leak\""
}
```

### Practical Job Search and Filtering Examples

**Find plumbing jobs in Cairo:**

```
GET /api/jobs?service=Plumbing&state=Cairo
```

**Search for urgent repairs with cash payment:**

```
GET /api/jobs/search?q=urgent repair&paymentType=Cash
```

**Find electrical jobs in specific city:**

```
GET /api/jobs?service=Electrical&city=New Cairo&status=Posted
```

**Search for kitchen-related jobs in Alexandria:**

```
GET /api/jobs/search?q=kitchen&state=Alexandria
```

**Search for HVAC services by name:**

```
GET /api/jobs?service=HVAC&status=Posted
```

**Combine multiple filters for targeted search:**

```
GET /api/jobs?state=Cairo&city=New Cairo&paymentType=CashProtected&status=Posted&page=1&limit=20
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
    "service": {
      "_id": "60f1b5b5b5b5b5b5b5b5b5b1",
      "name": "Plumbing",
      "icon": "faucet-icon",
      "description": "Water systems and pipe work"
    },
    "status": "Posted",
    "address": {
      "country": "Egypt",
      "state": "Cairo",
      "city": "New Cairo",
      "street": "123 Main Street"
    },
    "client": "...",
    "createdAt": "2024-06-01T12:00:00Z"
  },
  "message": "Job retrieved successfully"
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
  "description": "Updated description with more details about the urgency.",
  "address": {
    "country": "Egypt",
    "state": "Cairo",
    "city": "New Cairo",
    "street": "123 Main Street, Apt 5B"
  }
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
  "price": 1500,
  "notes": "I can fix the leak today. Price includes parts and labor. 2 year warranty on work."
}
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "_id": "507f1f77bcf86cd799439020",
    "job": "507f1f77bcf86cd799439015",
    "craftsman": "507f1f77bcf86cd799439012",
    "price": 1500,
    "notes": "I can fix the leak today. Price includes parts and labor. 2 year warranty on work.",
    "status": "Submitted",
    "createdAt": "2025-07-23T11:00:00.000Z"
  },
  "message": "Quote submitted successfully."
}
```

**Note:**

- Craftsmen can only apply once per job
- If a craftsman tries to submit a second quote for the same job, they'll get an error: "You have already applied for this job"

```

### Get All Quotes for a Job (Client Only)

`GET /api/jobs/:jobId/quotes`

**Headers:**

```

Authorization: Bearer <token>

````

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
````

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

## Craftsman Dashboard

### Get Craftsman's Submitted Quotes (Craftsman Only)

`GET /api/users/me/quotes`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10, max: 100)
- `status` (optional): Filter by quote status (Submitted, Accepted, Declined)

**Response Example:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "67891234567890123456789a",
      "price": 1500,
      "notes": "I can fix the leak today. Price includes parts and labor.",
      "status": "Submitted",
      "createdAt": "2025-07-25T10:00:00.000Z",
      "job": {
        "_id": "67891234567890123456789b",
        "title": "Fix kitchen sink leak",
        "description": "There is a persistent leak under the kitchen sink...",
        "service": {
          "_id": "60f1b5b5b5b5b5b5b5b5b5b1",
          "name": "Plumbing"
        },
        "address": "123 Main Street, New Cairo",
        "status": "Posted",
        "client": {
          "_id": "67891234567890123456789c",
          "fullName": "Ahmed Mohamed",
          "profilePicture": "https://...",
          "rating": 4.2,
          "ratingCount": 15
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 3,
    "totalItems": 25,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Get Craftsman's Received Invitations (Craftsman Only)

`GET /api/users/me/invitations`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10, max: 100)
- `status` (optional): Filter by invitation status (Pending, Accepted, Rejected)

**Response Example:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "67891234567890123456789d",
      "status": "Pending",
      "createdAt": "2025-07-25T09:30:00.000Z",
      "job": {
        "_id": "67891234567890123456789e",
        "title": "Custom kitchen cabinets",
        "description": "Design and build custom kitchen cabinets...",
        "service": {
          "_id": "60f1b5b5b5b5b5b5b5b5b5b2",
          "name": "Carpentry"
        },
        "address": "123 Main Street, New Cairo",
        "status": "Posted",
        "paymentType": "CashProtected",
        "client": {
          "_id": "67891234567890123456789f",
          "fullName": "Ahmed Mohamed",
          "profilePicture": "https://...",
          "rating": 4.2,
          "ratingCount": 15
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 2,
    "totalItems": 12,
    "hasNextPage": true,
    "hasPrevPage": false
  }
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

## 🆕 Enhanced Features (v1.3.0)

### Latest Updates (v1.3.0)

#### **🔧 Enhanced Service Integration**

- **Service Object Display**: Job responses now include complete service objects with `_id`, `name`, `icon`, and `description` instead of just service IDs
- **Flexible Service Filtering**: Filter jobs by either service ID (ObjectId) or service name (string)
  - Example: `/jobs?service=Plumbing` or `/jobs?service=6887b2a874c72b166a1cde0b`
- **Improved API Usability**: Users can work with readable service names while maintaining ID-based efficiency
- **Consistent Service Population**: All job endpoints (list, search, details, advanced filter) now return populated service objects

#### **🔧 Service-Based Job Categorization (v1.2.0)**

- **Breaking Change**: Jobs now use `service` field instead of `category`
- Service field references Service model ObjectId instead of string category
- All API endpoints updated to use `service` parameter instead of `category`
- Enhanced data integrity with proper service relationships

#### **🔒 Enhanced Security (v1.2.0)**

- **Wallet Privacy**: Wallet information removed from craftsman profile responses (`/users/me`)
- Improved data privacy for sensitive financial information

### Previous Job Search Capabilities (v1.1.0)

The job system includes powerful search and filtering capabilities:

#### **🔍 Text Search**

- Search jobs by keywords in title and description
- Case-insensitive matching
- Combined with other filters

#### **📍 Location-Based Filtering**

- Filter by address state
- Filter by address city
- Structured address format: `{ country, state, city, street }`

#### **💳 Payment Type Filtering**

- Filter by payment method: Cash, Escrow, CashProtected

#### **🔗 Combined Filtering**

All filters can be combined for precise job discovery:

```
GET /api/jobs/search?q=urgent repair&state=Cairo&city=New Cairo&service=Plumbing&paymentType=Cash
```

### Benefits for Users

**For Craftsmen:**

- Find jobs in their specific area (state/city)
- Search for jobs matching their expertise keywords
- Filter by preferred payment methods
- Search by service name for easier job discovery

**For Clients:**

- Better job discovery through search
- Enhanced location-based job posting
- Improved service selection with readable service names
- Complete service information in job responses
- Improved job management with structured data

### Backward Compatibility

All new features are fully backward compatible with existing implementations. Existing API calls will continue to work without modification.

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
