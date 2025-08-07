# Craftworks Backend API Manual (v1.6.0)

This manual provides practical usage instructions, example requests, and example responses for all backend API endpoints. Use this as a guide for integrating with the Craftworks backend.

**Latest Update (v1.6.0):** Added comprehensive real-time messaging system with Socket.IO integration - clients and craftsmen can now communicate in real-time with text and image messages, typing indicators, read receipts, and admin moderation capabilities. Complete chat management with job-based initiation and user presence tracking.

**Previous Update (v1.5.1):** Enhanced quote management - Updated quote route from `/jobs/:jobId/quotes/:quoteId/accept` to `/jobs/:jobId/quotes/:quoteId/:status` where status can be 'accept' or 'reject'. Added ability to reject quotes with proper notifications to craftsmen. Enhanced business logic to handle both acceptance and rejection workflows.

**Previous Update (v1.5.0):** Enhanced job scheduling and service data - Added `jobDate` field for job scheduling, enhanced service object population across all endpoints (recommendations, job listings, user profiles) with full service details (name, icon, description) while excluding timestamps for cleaner responses.

**Previous Update (v1.4.0):** Standardized API response format - ALL API responses now consistently include a `success` field (true/false) for uniform error handling and status checking across the entire application. Enhanced coordinate parsing for job creation with robust handling of all coordinate formats.

**Previous Update (v1.3.3):** Enhanced coordinate parsing for job creation - robust handling of all coordinate formats including form-data edge cases, improved validation, and comprehensive error handling for location data.

**Previous Update (v1.3.2):** Enhanced job creation with automatic image upload support - clients can now upload up to 5 images directly when creating jobs, with automatic Cloudinary integration, image optimization, and file validation.

---

## Table of Contents

1. [Response Format](#response-format)
2. [Authentication](#authentication)
3. [Business Rules](#business-rules)
4. [Users](#users)
5. [Jobs](#jobs)
6. [Quotes](#quotes)
7. [Invitations](#invitations)
8. [Notifications](#notifications)
9. [Services](#services)
10. [Real-time Messaging](#real-time-messaging)
11. [Craftsman Dashboard](#craftsman-dashboard)
12. [Client Dashboard](#client-dashboard)
13. [Recommendations](#recommendations)
14. [Admin](#admin)
15. [Contact Email](#contact-email)
16. [Enhanced Features](#-enhanced-features-v140)
17. [Troubleshooting Guide](#-troubleshooting-guide)
18. [Error Responses](#error-responses)

---

## Response Format

**All API responses follow a standardized format with a consistent `success` field for easy status checking:**

### Success Response Format

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation completed successfully"
}
```

### Error Response Format

```json
{
  "success": false,
  "message": "Error description here"
}
```

### Common Response Types

- **success**: `true` for successful operations, `false` for errors
- **data**: Contains the response payload (present in success responses)
- **message**: Descriptive message about the operation result
- **pagination**: Added for paginated responses (e.g., job listings, user lists)

**Note**: This standardized format applies to ALL endpoints across the API, making error handling and status checking consistent throughout your application.

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

### Change Password

`POST /api/auth/change-password`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Example:**

```json
{
  "currentPassword": "OldPassword123!",
  "newPassword": "NewPassword456!"
}
```

**Response Example:**

```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Response (Invalid Current Password):**

```json
{
  "success": false,
  "message": "Current password is incorrect",
  "statusCode": 400
}
```

**Error Response (Validation Error):**

```json
{
  "success": false,
  "message": "Password must be at least 8 characters long, Password must contain at least one uppercase letter",
  "statusCode": 400
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
    "service": {
      "_id": "6887b2a874c72b166a1cde0b",
      "name": {
        "en": "Plumbing",
        "ar": "السباكة"
      },
      "description": {
        "en": "Professional plumbing services",
        "ar": "خدمات سباكة احترافية"
      },
      "image": "https://res.cloudinary.com/demo/image/upload/plumbing.webp"
    },
    "bio": "Experienced plumber with 10+ years in residential and commercial plumbing. Specialized in emergency repairs and installations.",
    "portfolioImageUrls": [
      "https://res.cloudinary.com/demo/image/upload/portfolio/plumbing1.webp",
      "https://res.cloudinary.com/demo/image/upload/portfolio/plumbing2.webp",
      "https://res.cloudinary.com/demo/image/upload/portfolio/plumbing3.webp"
    ],
    "verificationStatus": "verified",
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

**Request Example (Portfolio Images for Craftsmen):**

```
Form Data:
- portfolioImages: <image_file_1>
- portfolioImages: <image_file_2>
- portfolioImages: <image_file_3>
- portfolioAction: "add" | "replace" | "remove"
- existingPortfolioImages: ["url1", "url2", "url3"] (JSON string)
- fullName: "Ahmed Craftsman"
- bio: "Updated bio text"
```

**Portfolio Actions:**

- `add`: Add new images to existing portfolio (default)
- `replace`: Replace all portfolio images with new ones
- `remove`: Keep only existing images (remove others)

**Supported Fields:**

- `fullName`: User's full name
- `email`: Email address (must be unique)
- `phone`: Phone number (must be unique)
- `profilePicture`: Profile image file (when using multipart/form-data)
- `address`: Address object with country, state, city, street
- `serviceId`: Service ID (craftsmen only) - updates the craftsman's primary service
- `craftsmanInfo`: Craftsman information object (craftsmen only)
- `portfolioImages`: Portfolio image files (craftsmen only, up to 10 images)
- `portfolioAction`: Action for portfolio images (craftsmen only)
- `existingPortfolioImages`: Array of existing portfolio image URLs to keep (craftsmen only)

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

### Portfolio Image Management (Craftsmen Only)

#### Update Portfolio Images

`PUT /api/users/me/portfolio`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Request Example:**

```
Form Data:
- portfolioImages: <image_file_1>
- portfolioImages: <image_file_2>
- portfolioImages: <image_file_3>
- action: "add" | "replace" | "remove"
- existingImages: ["url1", "url2"] (JSON string)
```

**Portfolio Actions:**

- `add`: Add new images to existing portfolio (max 10 total)
- `replace`: Replace all images with new ones
- `remove`: Keep only existing images, remove others

**Response Example:**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "role": "craftsman",
    "portfolioImageUrls": [
      "https://res.cloudinary.com/demo/image/upload/portfolio1.webp",
      "https://res.cloudinary.com/demo/image/upload/portfolio2.webp",
      "https://res.cloudinary.com/demo/image/upload/portfolio3.webp"
    ]
  },
  "message": "Portfolio images updated successfully"
}
```

#### Delete Single Portfolio Image

`DELETE /api/users/me/portfolio/:imageUrl`

**Headers:**

```
Authorization: Bearer <token>
```

**Parameters:**

- `imageUrl`: URL-encoded image URL to delete

**Response Example:**

```json
{
  "success": true,
  "data": {
    "id": "507f1f77bcf86cd799439012",
    "portfolioImageUrls": [
      "https://res.cloudinary.com/demo/image/upload/portfolio1.webp"
    ]
  },
  "message": "Portfolio image deleted successfully"
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
      },
      "isInvited": false
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
Content-Type: multipart/form-data
```

**Request Example (Form Data):**

```
Form Data:
- title: "Fix kitchen sink leak"
- description: "There is a leak under the kitchen sink that needs immediate attention."
- service: "60f1b5b5b5b5b5b5b5b5b5b1"
- address[country]: "Egypt"
- address[state]: "Cairo"
- address[city]: "New Cairo"
- address[street]: "123 Main Street"
- location[type]: "Point"
- location[coordinates]: "31.2,30.1" (longitude,latitude as comma-separated values)
- jobDate: "2024-12-20" (ISO date string - optional, date when the job should be performed)

**Coordinate Format Support:**
- **Recommended**: `"31.2,30.1"` (simple comma-separated string)
- **Also Supported**: `"[31.2,30.1]"`, `"[ '31.2,30.1' ]"`, `"[31.2, 30.1]"`
- **Format**: Always longitude first, then latitude
- **Validation**: Must be exactly 2 valid numeric values
- **Error Handling**: Comprehensive parsing with detailed error messages
- paymentType: "Cash"
- photos: <image_file_1>
- photos: <image_file_2>
- photos: <image_file_3>
```

**Alternative Request Example (JSON - without images):**

```
Content-Type: application/json
```

```json
{
  "title": "Fix kitchen sink leak",
  "description": "There is a leak under the kitchen sink.",
  "service": "60f1b5b5b5b5b5b5b5b5b5b1",
  "address": {
    "country": "Egypt",
    "state": "Cairo",
    "city": "New Cairo",
    "street": "123 Main Street"
  },
  "location": { "type": "Point", "coordinates": [31.2, 30.1] },
  "paymentType": "Cash",
  "jobDate": "2024-12-20"
}
```

**Image Upload Specifications:**

- **Field Name**: `photos` (can be used multiple times)
- **Maximum Files**: 5 images per job
- **File Size Limit**: 10MB per image
- **Supported Formats**: JPEG, PNG, GIF, WebP
- **Auto Processing**: Images are automatically optimized (800x600 limit, WebP format, quality optimization)
- **Storage**: Automatically uploaded to Cloudinary and URLs stored in database

**Response Example:**

```json
{
  "success": true,
  "data": {
    "_id": "6888bf8eede5a191977daf40",
    "title": "Fix kitchen sink leak",
    "description": "There is a leak under the kitchen sink that needs immediate attention.",
    "service": {
      "_id": "60f1b5b5b5b5b5b5b5b5b5b1",
      "name": "Plumbing",
      "icon": "faucet-icon",
      "description": "Water systems and pipe work"
    },
    "photos": [
      "https://res.cloudinary.com/demo/image/upload/v1234567890/job-images/job_1234567890_abc123def.webp",
      "https://res.cloudinary.com/demo/image/upload/v1234567890/job-images/job_1234567890_xyz789uvw.webp"
    ],
    "status": "Posted",
    "jobDate": "2024-12-20T00:00:00.000Z",
    "createdAt": "2025-07-29T12:33:18.731Z"
  },
  "message": "Job created successfully"
}
```

**Practical Usage Examples:**

```bash
# Example with curl (form-data with images)
curl -X POST http://localhost:5000/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "title=Fix kitchen sink leak" \
  -F "description=Urgent leak repair needed" \
  -F "service=60f1b5b5b5b5b5b5b5b5b5b1" \
  -F "address[country]=Egypt" \
  -F "address[state]=Cairo" \
  -F "address[city]=New Cairo" \
  -F "address[street]=123 Main Street" \
  -F "location[type]=Point" \
  -F "location[coordinates]=31.2,30.1" \
  -F "paymentType=Cash" \
  -F "jobDate=2024-12-20" \
  -F "photos=@/path/to/leak_photo1.jpg" \
  -F "photos=@/path/to/leak_photo2.jpg"

# Alternative coordinate formats that also work:
# -F "location[coordinates]=[31.2,30.1]"
# -F "location[coordinates]=[ '31.2,30.1' ]"
# -F "location[coordinates]=[31.2, 30.1]"

# Example without images (JSON)
curl -X POST http://localhost:5000/api/jobs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix kitchen sink leak",
    "description": "Urgent leak repair needed",
    "service": "60f1b5b5b5b5b5b5b5b5b5b1",
    "address": {
      "country": "Egypt",
      "state": "Cairo",
      "city": "New Cairo",
      "street": "123 Main Street"
    },
    "location": {
      "type": "Point",
      "coordinates": [31.2, 30.1]
    },
    "paymentType": "Cash"
  }'
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

### Update Quote Status - Accept or Reject (Client Only)

`POST /api/jobs/:jobId/quotes/:quoteId/:status`

**Headers:**

```
Authorization: Bearer <token>
```

**URL Parameters:**

- `jobId` (required): The ObjectId of the job
- `quoteId` (required): The ObjectId of the quote to update
- `status` (required): The action to perform - either `accept` or `reject`

**Example Requests:**

Accept a quote:
`POST /api/jobs/688d3eddeed54bd83df56b72/quotes/507f1f77bcf86cd799439020/accept`

Reject a quote:
`POST /api/jobs/688d3eddeed54bd83df56b72/quotes/507f1f77bcf86cd799439020/reject`

**Response Example (Accept):**

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

**Response Example (Reject):**

```json
{
  "success": true,
  "message": "Quote rejected successfully",
  "data": {
    "job": { "_id": "...", "status": "Posted" },
    "quote": { "_id": "...", "status": "Declined" }
  }
}
```

**Business Logic:**

- **When accepting a quote:**

  - The selected quote status becomes "Accepted"
  - All other quotes for the same job are automatically set to "Declined"
  - Job status changes to "Hired"
  - The craftsman is assigned to the job
  - Job price is set to the quote price
  - Hired date is recorded
  - Craftsman receives a notification about acceptance

- **When rejecting a quote:**
  - Only the selected quote status becomes "Declined"
  - Job remains in "Posted" status
  - Other quotes remain unaffected
  - Craftsman receives a notification about rejection

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

## Real-time Messaging

The messaging system allows real-time communication between clients and craftsmen using both HTTP REST endpoints and Socket.IO WebSocket connections.

### Authentication for Messaging

All messaging endpoints require JWT authentication. For Socket.IO connections, pass the token in the `auth` object:

```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token-here'
  }
});
```

### Create Chat

`POST /api/messages/chats`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "participantId": "participant_user_id",
  "jobId": "job_id_optional"
}
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "_id": "chat_id",
    "participants": [
      {
        "_id": "user1_id",
        "fullName": "John Doe",
        "profilePicture": "https://...",
        "role": "client"
      },
      {
        "_id": "user2_id",
        "fullName": "Ahmed Ali",
        "profilePicture": "https://...",
        "role": "craftsman"
      }
    ],
    "jobId": {
      "_id": "job_id",
      "title": "Fix Kitchen Plumbing"
    },
    "isActive": true,
    "unreadCount": {
      "user1_id": 0,
      "user2_id": 0
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Chat created successfully"
}
```

### Get User's Chats

`GET /api/messages/chats?page=1&limit=20`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response Example:**

```json
{
  "success": true,
  "data": {
    "chats": [
      {
        "_id": "chat_id",
        "participants": [
          {
            "_id": "user1_id",
            "fullName": "John Doe",
            "profilePicture": "https://...",
            "role": "client"
          },
          {
            "_id": "user2_id",
            "fullName": "Ahmed Ali",
            "profilePicture": "https://...",
            "role": "craftsman"
          }
        ],
        "lastMessage": "Hello, when can you start?",
        "lastMessageAt": "2024-01-01T12:00:00.000Z",
        "lastMessageSenderId": "user1_id",
        "unreadCount": {
          "user1_id": 0,
          "user2_id": 2
        },
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "totalCount": 5,
    "totalPages": 1,
    "currentPage": 1
  }
}
```

### Get Chat Details

`GET /api/messages/chats/:chatId`

**Headers:**

```
Authorization: Bearer <token>
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "_id": "chat_id",
    "participants": [
      {
        "_id": "user1_id",
        "fullName": "John Doe",
        "profilePicture": "https://...",
        "role": "client"
      },
      {
        "_id": "user2_id",
        "fullName": "Ahmed Ali",
        "profilePicture": "https://...",
        "role": "craftsman"
      }
    ],
    "jobId": {
      "_id": "job_id",
      "title": "Fix Kitchen Plumbing"
    },
    "lastMessage": "I can start tomorrow morning",
    "lastMessageAt": "2024-01-01T14:00:00.000Z",
    "lastMessageSenderId": "user2_id",
    "unreadCount": {
      "user1_id": 1,
      "user2_id": 0
    },
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T14:00:00.000Z"
  }
}
```

### Get Chat Messages

`GET /api/messages/chats/:chatId/messages?page=1&limit=50`

**Headers:**

```
Authorization: Bearer <token>
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response Example:**

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "_id": "message_id",
        "chatId": "chat_id",
        "senderId": {
          "_id": "user1_id",
          "fullName": "John Doe",
          "profilePicture": "https://...",
          "role": "client"
        },
        "messageType": "text",
        "content": "Hello, when can you start?",
        "timestamp": "2024-01-01T12:00:00.000Z",
        "isRead": true,
        "readAt": "2024-01-01T12:05:00.000Z",
        "isEdited": false,
        "isDeleted": false
      },
      {
        "_id": "message_id_2",
        "chatId": "chat_id",
        "senderId": {
          "_id": "user2_id",
          "fullName": "Ahmed Ali",
          "profilePicture": "https://...",
          "role": "craftsman"
        },
        "messageType": "text",
        "content": "I can start tomorrow morning",
        "timestamp": "2024-01-01T14:00:00.000Z",
        "isRead": false,
        "isEdited": false,
        "isDeleted": false
      }
    ],
    "totalCount": 15,
    "totalPages": 1,
    "currentPage": 1
  }
}
```

### Send Message (HTTP Fallback)

`POST /api/messages/chats/:chatId/messages`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "messageType": "text",
  "content": "Hello, when can you start the work?"
}
```

**For Image Messages:**

```json
{
  "messageType": "image",
  "content": "https://cloudinary.com/image-url"
}
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "_id": "message_id",
    "chatId": "chat_id",
    "senderId": {
      "_id": "user1_id",
      "fullName": "John Doe",
      "profilePicture": "https://...",
      "role": "client"
    },
    "messageType": "text",
    "content": "Hello, when can you start the work?",
    "timestamp": "2024-01-01T12:00:00.000Z",
    "isRead": false,
    "isEdited": false,
    "isDeleted": false
  },
  "message": "Message sent successfully"
}
```

### Mark Messages as Read

`PATCH /api/messages/chats/:chatId/read`

**Headers:**

```
Authorization: Bearer <token>
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "updatedCount": 3
  },
  "message": "Messages marked as read"
}
```

### Delete Message

`DELETE /api/messages/messages/:messageId`

**Headers:**

```
Authorization: Bearer <token>
```

**Response Example:**

```json
{
  "success": true,
  "data": null,
  "message": "Message deleted successfully"
}
```

### Socket.IO Real-time Events

#### Connect to Socket.IO

```javascript
const socket = io('http://localhost:5000', {
  auth: {
    token: 'your-jwt-token-here'
  }
});

socket.on('connect', () => {
  console.log('Connected to chat server');
});
```

#### Join Chat Room

```javascript
socket.emit('join-chat', 'chat_id');
```

#### Leave Chat Room

```javascript
socket.emit('leave-chat', 'chat_id');
```

#### Send Message via Socket

```javascript
socket.emit('send-message', {
  chatId: 'chat_id',
  messageType: 'text',
  content: 'Hello via socket!'
});
```

#### Listen for New Messages

```javascript
socket.on('new-message', (message) => {
  console.log('New message received:', message);
  // Update UI with new message
});
```

#### Typing Indicators

```javascript
// Start typing
socket.emit('typing-start', 'chat_id');

// Stop typing
socket.emit('typing-stop', 'chat_id');

// Listen for typing events
socket.on('user-typing', (data) => {
  console.log(`User ${data.userId} is typing: ${data.isTyping}`);
});
```

#### Mark Messages as Read via Socket

```javascript
socket.emit('mark-messages-read', 'chat_id');

// Listen for read receipts
socket.on('message-read', (data) => {
  console.log(`Messages read by: ${data.readBy}`);
});
```

#### Listen for Chat Updates

```javascript
socket.on('chat-updated', (chat) => {
  console.log('Chat updated:', chat);
  // Update chat list or current chat
});
```

#### Error Handling

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error.message);
});
```

### Admin Messaging Endpoints

#### Get All Chats (Admin Only)

`GET /api/messages/admin/chats?page=1&limit=20`

**Headers:**

```
Authorization: Bearer <admin-token>
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "chats": [
      {
        "_id": "chat_id",
        "participants": [
          {
            "_id": "user1_id",
            "fullName": "John Doe",
            "profilePicture": "https://...",
            "role": "client",
            "email": "john@example.com"
          },
          {
            "_id": "user2_id",
            "fullName": "Ahmed Ali",
            "profilePicture": "https://...",
            "role": "craftsman",
            "email": "ahmed@example.com"
          }
        ],
        "jobId": {
          "_id": "job_id",
          "title": "Fix Kitchen Plumbing"
        },
        "lastMessage": "Work completed successfully",
        "lastMessageAt": "2024-01-01T16:00:00.000Z",
        "lastMessageSenderId": "user2_id",
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "totalCount": 150,
    "totalPages": 8,
    "currentPage": 1
  }
}
```

#### Get Chat Messages (Admin Only)

`GET /api/messages/admin/chats/:chatId/messages?page=1&limit=50`

**Headers:**

```
Authorization: Bearer <admin-token>
```

**Response Example:**

```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "_id": "message_id",
        "chatId": "chat_id",
        "senderId": {
          "_id": "user1_id",
          "fullName": "John Doe",
          "profilePicture": "https://...",
          "role": "client",
          "email": "john@example.com"
        },
        "messageType": "text",
        "content": "Hello, when can you start?",
        "timestamp": "2024-01-01T12:00:00.000Z",
        "isRead": true,
        "readAt": "2024-01-01T12:05:00.000Z",
        "isEdited": false,
        "isDeleted": false
      }
    ],
    "totalCount": 25,
    "totalPages": 1,
    "currentPage": 1,
    "chat": {
      "_id": "chat_id",
      "participants": [
        {
          "_id": "user1_id",
          "fullName": "John Doe",
          "profilePicture": "https://...",
          "role": "client"
        },
        {
          "_id": "user2_id",
          "fullName": "Ahmed Ali",
          "profilePicture": "https://...",
          "role": "craftsman"
        }
      ],
      "jobId": {
        "_id": "job_id",
        "title": "Fix Kitchen Plumbing"
      },
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### Integration Workflow

#### 1. Chat Initiation Flow

```
1. Client posts a job
2. Craftsman submits a quote
3. Client accepts the quote
4. Both users get access to create/join a chat
5. Either user creates a chat (linked to the job)
```

#### 2. Frontend Implementation Example

```javascript
// After client accepts quote
async function startChatWithCraftsman(craftsmanId, jobId) {
  try {
    const response = await fetch('/api/messages/chats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        participantId: craftsmanId,
        jobId: jobId
      })
    });

    const { data: chat } = await response.json();

    // Navigate to chat page or open chat modal
    openChatInterface(chat._id);
  } catch (error) {
    console.error('Error creating chat:', error);
  }
}
```

#### 3. Real-time Chat Component

```javascript
function ChatComponent({ chatId, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://localhost:5000', {
      auth: { token: localStorage.getItem('token') }
    });

    // Join chat room
    newSocket.emit('join-chat', chatId);

    // Listen for new messages
    newSocket.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for typing indicators
    newSocket.on('user-typing', (data) => {
      // Show/hide typing indicator
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('leave-chat', chatId);
      newSocket.disconnect();
    };
  }, [chatId]);

  const sendMessage = (content) => {
    socket.emit('send-message', {
      chatId,
      messageType: 'text',
      content
    });
  };

  return (
    // Chat UI components
  );
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

## User Dashboard

### Get User's Jobs (Client: Posted Jobs, Craftsman: Hired Jobs)

`GET /api/users/me/jobs`

**Headers:**

```
Authorization: Bearer <token>
```

**Access Control:**

- **Clients**: Get all jobs they have posted
- **Craftsmen**: Get all jobs they have been hired for

**Response Messages:**

- Clients receive: "Posted jobs retrieved successfully"
- Craftsmen receive: "Hired jobs retrieved successfully"

**Enhanced Data Structure:**

- **For Clients**: The `craftsman` field will be populated with `fullName` and `phone` when a craftsman is assigned
- **For Craftsmen**: The `client` field will be populated with `fullName` and `phone` for easy contact

**Example Requests:**

- Get all jobs: `GET /api/users/me/jobs`
- Get only completed jobs: `GET /api/users/me/jobs?status=Completed` (or `completed`)
- Get only cancelled jobs: `GET /api/users/me/jobs?status=Cancelled` (or `cancelled`)
- Get jobs with pagination: `GET /api/users/me/jobs?page=1&limit=5&status=Posted` (or `posted`)

**Query Parameters:**

- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10, max: 100)
- `status` (optional): Filter jobs by status. Valid values: `Posted`, `Quoted`, `Hired`, `On The Way`, `Completed`, `Disputed`, `Cancelled` (case-insensitive)

**Response Examples:**

**For Clients (Posted Jobs):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "6888bf8eede5a191977daf40",
      "client": "6888bf0881fdba0c83c2ecda",
      "craftsman": {
        "_id": "6887b2a974c72b166a1cde16",
        "fullName": "Mahmoud Plumber",
        "phone": "+201234567890"
      },
      "title": "Fix kitchen sink leak",
      "description": "There is a persistent leak under the kitchen sink that needs immediate attention.",
      "service": {
        "_id": "6887b2a874c72b166a1cde0b",
        "name": "Plumbing",
        "icon": "faucet-icon",
        "description": "Water systems and pipe work"
      },
      "photos": ["https://res.cloudinary.com/demo/image/upload/sink_leak1.jpg"],
      "address": {
        "country": "Egypt",
        "state": "Cairo",
        "city": "New Cairo",
        "street": "123 Test Street"
      },
      "location": {
        "type": "Point",
        "coordinates": [31.2, 30.1]
      },
      "status": "Posted",
      "paymentType": "Cash",
      "jobPrice": 0,
      "platformFee": 0,
      "appliedCraftsmen": [],
      "createdAt": "2025-07-29T12:33:18.731Z",
      "updatedAt": "2025-07-29T12:33:18.731Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "totalPages": 1,
    "totalItems": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  },
  "message": "Jobs retrieved successfully"
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

**Query Parameters:**

- `jobId` (required): The ObjectId of the job to get recommendations for

**Response Fields:**

- `isInvited` (boolean): Indicates whether this craftsman has already been invited to the specified job

**Example Request:**

`GET /api/users/recommendations?jobId=6888bf8eede5a191977daf40`

**Response Example:**

```json
{
  "success": true,
  "data": [
    {
      "_id": "6887b2a974c72b166a1cde16",
      "fullName": "Mahmoud Plumber",
      "profilePicture": "https://res.cloudinary.com/demo/image/upload/d_avatar.png/craftsman1.png",
      "craftsmanInfo": {
        "skills": ["Plumbing", "HVAC"],
        "service": {
          "_id": "6887b2a874c72b166a1cde0b",
          "name": "Plumbing",
          "icon": "faucet-icon",
          "description": "Water systems and pipe work"
        },
        "bio": "Experienced plumber with 10+ years in residential and commercial plumbing. Specialized in emergency repairs and installations.",
        "portfolioImageUrls": [
          "https://res.cloudinary.com/demo/image/upload/plumbing1.jpg",
          "https://res.cloudinary.com/demo/image/upload/plumbing2.jpg"
        ],
        "verificationStatus": "verified",
        "verificationDocs": []
      },
      "rating": 4.8,
      "ratingCount": 142,
      "isInvited": false
    }
  ]
}
```

**Error Response for Invalid Job ID:**

```json
{
  "success": false,
  "message": "Resource not found (invalid ID)",
  "statusCode": 404
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
  "success": true,
  "message": "Email sent successfully."
}
```

---

## 🆕 Enhanced Features (v1.4.0)

### Latest Updates (v1.4.0)

#### **🎯 Standardized API Response Format**

- **Consistent Success Field**: ALL API responses now include a `success` field (true/false) for uniform error handling
- **Structured Error Handling**: Standardized error responses with consistent message formatting
- **Frontend Integration**: Simplified status checking across the entire application
- **Backward Compatibility**: All existing response data structures maintained, only adding the success field

#### **Previous Updates (v1.3.3)**

#### **🗺️ Robust Coordinate Parsing for Job Locations**

- **Multiple Format Support**: Handles various coordinate input formats for maximum compatibility
  - Simple comma-separated: `"31.2,30.1"` (recommended)
  - Array formats: `"[31.2,30.1]"`, `"[31.2, 30.1]"`
  - Quoted string arrays: `"[ '31.2,30.1' ]"` (handles form-data edge cases)
  - Proper JSON arrays: `[31.2, 30.1]`
- **Smart Parsing Logic**: Automatic detection and conversion of string formats to numeric arrays
- **Comprehensive Validation**: Ensures exactly 2 valid numeric coordinates (longitude, latitude)
- **Enhanced Error Messages**: Clear feedback on coordinate format issues with examples
- **Form-Data Compatibility**: Seamless handling of multipart/form-data coordinate submissions
- **Backward Compatibility**: All existing coordinate formats continue to work

#### **🔧 Coordinate Processing Features**

- **Automatic Cleanup**: Removes non-numeric characters while preserving valid coordinate data
- **Type Safety**: Ensures coordinates are always stored as `[number, number]` arrays in database
- **GeoJSON Compliance**: Proper GeoJSON Point format with longitude first, latitude second
- **Debugging Support**: Comprehensive logging for troubleshooting coordinate parsing issues

### Previous Updates (v1.3.2)

#### **📸 Automatic Image Upload for Jobs**

- **Direct File Upload**: Job creation now supports direct image file uploads via multipart/form-data
- **Multiple Image Support**: Upload up to 5 images per job posting
- **File Validation**: Automatic validation for image formats (JPEG, PNG, GIF, WebP) and file sizes (10MB max per image)
- **Cloudinary Integration**: Automatic upload to Cloudinary cloud storage with optimized delivery
- **Image Optimization**: Automatic image processing (800x600 limit, WebP format conversion, quality optimization)
- **Seamless API**: Backward compatible - jobs can still be created with JSON without images
- **Error Handling**: Comprehensive error handling for upload failures with clear error messages

#### **📁 Image Processing Features**

- **Smart Compression**: Automatic quality optimization for faster loading
- **Format Standardization**: All images converted to WebP for optimal performance
- **Size Optimization**: Images automatically resized to maximum 800x600 while maintaining aspect ratio
- **Organized Storage**: Images stored in dedicated `job-images` folder with unique identifiers
- **Secure URLs**: Direct HTTPS URLs returned for immediate use in applications

### Previous Updates (v1.3.1)

#### **🏗️ Enhanced Dashboard Functionality**

- **Client Dashboard**: Added `GET /users/me/jobs` endpoint for clients to retrieve their posted jobs
- **Enhanced Recommendations**: Improved recommendations endpoint with ObjectId validation and error handling
- **Comprehensive Pagination**: Full pagination support for all dashboard endpoints

### Previous Updates (v1.3.0)

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

## 🛠️ Troubleshooting Guide

### Coordinate Format Issues

If you're having trouble with job creation due to coordinate validation errors, here are the supported formats and solutions:

#### ✅ **Supported Coordinate Formats**

**Form-Data (multipart/form-data):**

```
location[coordinates]: "31.2,30.1"          ✅ Recommended
location[coordinates]: "[31.2,30.1]"        ✅ Works
location[coordinates]: "[ '31.2,30.1' ]"    ✅ Edge case support
location[coordinates]: "[31.2, 30.1]"       ✅ With spaces
```

**JSON (application/json):**

```json
{
  "location": {
    "type": "Point",
    "coordinates": [31.2, 30.1]  ✅ Standard GeoJSON
  }
}
```

#### ❌ **Common Issues and Solutions**

**Problem**: `"Cast to [Number] failed"`

- **Cause**: Coordinates sent as string instead of array
- **Solution**: Use one of the supported formats above

**Problem**: `"Location coordinates must be two valid numbers"`

- **Cause**: Invalid coordinate format or missing values
- **Solution**: Ensure exactly 2 numeric values (longitude, latitude)

**Problem**: Coordinates show as `"[ '31.2,30.1' ]"` in error

- **Cause**: Form-data parsing edge case
- **Solution**: API now handles this automatically (v1.3.3+)

#### 🔍 **Debugging Tips**

1. **Check Console Logs**: Server logs show coordinate parsing steps
2. **Validate Input**: Ensure longitude and latitude are valid numbers
3. **Format Check**: Use simple comma-separated format for form-data
4. **GeoJSON Order**: Always longitude first, then latitude

#### 📍 **Coordinate Guidelines**

- **Longitude**: East-West position (-180 to +180)
- **Latitude**: North-South position (-90 to +90)
- **Egypt Examples**:
  - Cairo: `[31.2357, 30.0444]` (longitude, latitude)
  - Alexandria: `[29.9187, 31.2001]`

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
