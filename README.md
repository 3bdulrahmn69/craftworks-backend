# Craftworks Backend

A Node.js + Express + MongoDB backend for a freelance platform connecting clients with craftsmen.

## Features
- User authentication & role-based access control (JWT)
- Roles: admin, moderator, client, craftsman
- CRUD for users, jobs, proposals, contracts, reviews, messages, reports, services, admins, craftsman and client profiles
- Pagination & filtering for jobs, proposals, and messages
- Secure password hashing, input validation, and HTTP headers
- Indexing for performance
- **Comprehensive logging** (HTTP requests, errors, events)
- **Robust error handling** (404s, invalid IDs, global errors)
- **Activity log** for all important actions (admin-only access)

## Activity Log
- All important actions (user registration, admin actions, deletions, service changes, etc.) are logged in the ActivityLog collection.
- Each log entry includes: who did the action, what action, what target, details, and timestamp.
- **Admin-only endpoint:**
  - `GET /api/activity-logs` — List recent activity logs (admin only)
  - Query params: `limit` (default 100), `skip` (default 0)
- Moderators and other roles cannot access this endpoint.

## Getting Started

1. Install dependencies:
   ```