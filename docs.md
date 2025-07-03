# Craftworks Backend API Documentation

## Authentication

- Register: `POST /api/auth/register`
- Login: `POST /api/auth/login`
- All protected endpoints require a Bearer JWT token in the `Authorization` header.

## User Roles
- `admin`: Can manage users, jobs, services, reports, etc.
- `moderator`: Can moderate content and manage reports.
- `client`: Can post jobs, review craftsmen, message, etc.
- `craftsman`: Can submit proposals, manage profile, message, etc.

## Main Endpoints

### Users
- `GET /api/users/me` — Get your profile
- `PUT /api/users/me` — Update your profile
- `GET /api/users` — List all users (admin or moderator only)
- `DELETE /api/users/:id` — Delete user (admin or moderator only)

### Jobs
- `POST /api/jobs` — Create job (client only)
- `GET /api/jobs` — List jobs (paginated, filterable)
- `GET /api/jobs/:id` — Get job details
- `PUT /api/jobs/:id` — Update job (owner, admin, or moderator)
- `DELETE /api/jobs/:id` — Delete job (owner, admin, or moderator)

### Proposals
- `POST /api/proposals` — Submit proposal (craftsman only)
- `GET /api/proposals` — List proposals (paginated, filterable)
- `GET /api/proposals/:id` — Get proposal (involved users, admin, or moderator)
- `PUT /api/proposals/:id` — Update status (job owner, admin, or moderator)
- `DELETE /api/proposals/:id` — Delete (craftsman, admin, or moderator)

### Contracts
- `POST /api/contracts` — Create contract (when proposal accepted)
- `GET /api/contracts` — List contracts (involved users, admin, or moderator)
- `GET /api/contracts/:id` — Get contract
- `PUT /api/contracts/:id` — Update (admin or moderator only)
- `DELETE /api/contracts/:id` — Delete (admin or moderator only)

### Reviews
- `POST /api/reviews` — Create review (involved users)
- `GET /api/reviews` — List reviews
- `GET /api/reviews/:id` — Get review
- `PUT /api/reviews/:id` — Update (author only)
- `DELETE /api/reviews/:id` — Delete (admin or moderator only)

### Messages
- `POST /api/messages` — Send message
- `GET /api/messages` — List messages (paginated, filterable)
- `GET /api/messages/:id` — Get message (sender/receiver, admin, or moderator)
- `DELETE /api/messages/:id` — Delete (sender, admin, or moderator)

### Reports
- `POST /api/reports` — Create report
- `GET /api/reports` — List reports (admin or moderator only)
- `GET /api/reports/:id` — Get report (involved users, admin, or moderator)
- `DELETE /api/reports/:id` — Delete (admin or moderator only)

### Services
- `POST /api/services` — Create (admin only)
- `GET /api/services` — List all
- `GET /api/services/:id` — Get service
- `PUT /api/services/:id` — Update (admin only)
- `DELETE /api/services/:id` — Delete (admin only)

### Admins
- `POST /api/admins` — Create admin (admin only)
- `GET /api/admins` — List admins (admin or moderator only)
- `GET /api/admins/:id` — Get admin
- `PUT /api/admins/:id` — Update (self or admin)
- `DELETE /api/admins/:id` — Delete (admin only)

### CraftsmanProfile
- `POST /api/craftsman-profiles` — Create (craftsman only)
- `GET /api/craftsman-profiles` — List all
- `GET /api/craftsman-profiles/me` — Get own
- `PUT /api/craftsman-profiles/me` — Update own
- `DELETE /api/craftsman-profiles/:id` — Delete (admin or moderator only)

### ClientProfile
- `POST /api/client-profiles` — Create (client only)
- `GET /api/client-profiles` — List all
- `GET /api/client-profiles/me` — Get own
- `PUT /api/client-profiles/me` — Update own
- `DELETE /api/client-profiles/:id` — Delete (admin or moderator only)

## Example: Register & Login

```http
POST /api/auth/register
Content-Type: application/json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "yourpassword",
  "role": "client"
}
```

```http
POST /api/auth/login
Content-Type: application/json
{
  "email": "john@example.com",
  "password": "yourpassword"
}
```

Response:
```json
{
  "token": "<JWT token>"
}
```

## Using the API
- Include `Authorization: Bearer <token>` in headers for all protected endpoints.
- Use pagination params: `?page=1&limit=10`
- Filter jobs/proposals/messages by status, category, etc.

## Security Notes
- All passwords are hashed
- JWT tokens expire after 7 days
- All sensitive actions are role-protected
- Helmet and CORS are enabled

---
For more details, see the code or contact the maintainer. 