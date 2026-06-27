# KD Studios Website

Project is now split into two separate apps:

- `frontend` for the animated portfolio website
- `backend` for the Prisma auth API and admin controls

## Run frontend

```powershell
npm.cmd run dev:frontend
```

Open `http://localhost:3000`

If port `3000` is already in use, start the frontend on `8000` instead:

```powershell
npm.cmd run dev:frontend:8000
```

Open `http://localhost:8000`

## Run backend

```powershell
npm.cmd run dev:backend
```

API runs at `http://localhost:4000`

WebSocket runs at:

`ws://localhost:4000/ws`

## Deployment

- Netlify uses `netlify.toml` and publishes `frontend/public`.
- Render uses `render.yaml` and creates the `kd-studios-api` backend service.
- Add all `sync: false` variables shown by Render using values from your private
  `.env`.
- The production frontend expects the backend at
  `https://kd-studios-api.onrender.com`. If Render assigns a different service
  URL, update `frontend/public/config.js`.

## Database setup

This project uses Neon PostgreSQL. Copy the pooled and direct connection strings
from the Neon dashboard into `.env`:

- `DATABASE_URL`: pooled connection for the running application
- `DIRECT_URL`: direct connection for Prisma migrations

Generate Prisma Client:

```powershell
npm.cmd run prisma:generate
```

For initial development setup, sync the schema:

```powershell
npm.cmd run prisma:push
```

For production deployments, commit migrations and run:

```powershell
npm.cmd run prisma:migrate:deploy
```

The previous `prisma/dev.db` file is retained only as a local backup and is no
longer used by the application.

## Frontend connection

Frontend reads the backend URL from:

`frontend/public/config.js`

Current default:

`http://localhost:4000`

## Update your project links

Edit the `projects` array in:

`frontend/public/app.js`

## View client requests

Submitted requests, users, sessions, OTP records, notifications, and audit logs
are stored in Neon PostgreSQL through Prisma.

## Admin login

Admin credentials are configured privately in `.env`. Never document or commit
their actual values.

## Email OTP delivery

Registration and password-reset OTP emails use Gmail SMTP through Nodemailer.
Set `EMAIL_USER`, a Google App Password in `EMAIL_PASS`, and optionally
`EMAIL_FROM` in `.env`. Two-Step Verification must be enabled on the Google
account before creating an App Password.

Admin protection has two layers:

- admin password
- one-time email verification code before an admin session is created

Admin panel now includes:

- owner-only dashboard stats
- recent client request list
- secure admin password change form
- user block, unblock, and remove controls
- request reply and quote update controls

## API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/admin/request-otp`
- `POST /api/auth/admin/verify-otp`
- `POST /api/auth/password-reset/request`
- `POST /api/auth/password-reset/confirm`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/health`
- `POST /api/requests`
- `GET /api/requests/my`
- `GET /api/notifications`
- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `GET /api/admin/requests`
- `PATCH /api/admin/requests/:id`
- `PATCH /api/admin/users/:id/block`
- `PATCH /api/admin/users/:id/unblock`
- `DELETE /api/admin/users/:id`

## Backend architecture

- controllers
- services
- middleware
- Prisma models
- WebSocket realtime server
- audit logs
- notifications
- password reset OTP flow
- admin OTP login flow
- rate limiting
