# Craftworks Backend

A Node.js + Express + MongoDB backend for a freelance platform connecting clients with craftsmen.

## Features
- User authentication & role-based access control (JWT)
- Roles: admin, moderator, client, craftsman
- CRUD for users, jobs, proposals, contracts, reviews, messages, reports, services, admins, craftsman and client profiles
- Pagination & filtering for jobs, proposals, and messages
- Secure password hashing, input validation, and HTTP headers
- Indexing for performance

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