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

## Getting Started

1. Install dependencies:
   ```sh
   npm install
   ```
2. Create a `.env` file with your MongoDB URI:
   ```env
   MONGO_URI=mongodb+srv://<user>:<password>@<cluster-url>/craftworks
   PORT=5000
   JWT_SECRET=your_jwt_secret
   ```
3. Start the server:
   ```sh
   npm run dev
   ```

## API Structure

- All endpoints are prefixed with `/api` (e.g., `/api/jobs`)
- Authentication: Bearer JWT token in `Authorization` header
- See `docs.md` for full API usage and endpoint details

## Logging & Monitoring
- **HTTP requests** are logged using [morgan](https://www.npmjs.com/package/morgan) (dev format)
- **Application events & errors** are logged using [winston](https://www.npmjs.com/package/winston)
- Logs are written to:
  - `logs/combined.log` (all logs)
  - `logs/error.log` (errors only)
- All errors, warnings, and important events are timestamped and logged
- Console output is also formatted and timestamped

## Error Handling
- **404 Not Found**: Any request to a non-existent `/api/...` route returns `{ "message": "API route not found" }` with status 404
- **Invalid ObjectId**: If a route expects an ObjectId and you pass an invalid string, you get `{ "message": "Resource not found (invalid ID)" }` with status 404
- **Global Error Handler**: All unhandled errors return `{ "message": "Internal server error" }` with status 500 (unless a more specific status is set)
- All errors are logged with details about the request and error

## Security
- All sensitive routes require authentication
- Role-based access control for all entities (admin, moderator, client, craftsman)
- Passwords are hashed and never returned
- Helmet and CORS enabled by default

## Project Structure

```
src/
  models/
  routes/
  controllers/
  middlewares/
  utils/
  app.js
```

---

## Next Steps
- See `docs.md` for API usage and endpoint documentation
- (Recommended) Add a `/api/health` endpoint for uptime monitoring in production