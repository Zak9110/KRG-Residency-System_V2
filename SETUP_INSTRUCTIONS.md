# KRG e-Visit System - Setup Instructions

## Prerequisites Completed ✓
- Project structure created
- Database schema designed (Prisma)
- API routes implemented (auth, applications, checkpoint, analytics)
- QR code generation and verification services
- Email notification system (Resend)

## Next Steps - Follow in Order:

### Step 1: Install Dependencies
```bash
cd c:\Users\zaida\Desktop\KRGv3
pnpm install
```

### Step 2: Set Up Supabase Database (FREE)
1. Go to https://supabase.com
2. Sign up / Log in
3. Create a new project
4. Wait for database to be ready (~2 minutes)
5. Go to Project Settings > Database
6. Copy the "Connection string" (URI format)
7. Update `.env` file with your DATABASE_URL

Example:
```
DATABASE_URL="postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

### Step 3: Set Up Resend Email (FREE - 3,000 emails/month)
1. Go to https://resend.com
2. Sign up with your email
3. Verify your email address
4. Go to "API Keys" and create a new key
5. Copy the API key
6. Update `.env` file with your RESEND_API_KEY
7. Add your domain (or use test mode with your email)

### Step 4: Generate Database
```bash
pnpm db:generate
```

### Step 5: Create Database Tables
```bash
pnpm db:push
```

### Step 6: Seed Database with Default Users
```bash
pnpm db:seed
```

This will create 4 default users:
- **Admin**: admin@krg-evisit.gov / Admin@123
- **Officer**: officer@krg-evisit.gov / Officer@123
- **Supervisor**: supervisor@krg-evisit.gov / Supervisor@123
- **Director**: director@krg-evisit.gov / Director@123

### Step 7: Start Development Server
```bash
pnpm dev:api
```

The API will be available at http://localhost:3001

### Step 8: Test the API

**Health Check:**
```bash
curl http://localhost:3001/health
```

**Login:**
```powershell
curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"admin@krg-evisit.gov\",\"password\":\"Admin@123\"}'
```

**Get Current User:**
```powershell
curl http://localhost:3001/api/auth/me `
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Current Status

✅ **Completed:**
- Monorepo structure (pnpm workspaces)
- Shared types package
- Database schema (7 models)
- Database seed script
- API server with Express
- Authentication & authorization middleware
- Auth routes (login, me)
- Application routes (CRUD, approve, reject, assign)
- Checkpoint routes (QR verification, entry/exit)
- Analytics routes (dashboard, statistics, audit logs)
- QR code generation/verification service
- Email notification service

❌ **Pending:**
- Frontend (Next.js visitor portal)
- Frontend (Officer dashboard)
- Frontend (Checkpoint scanner)
- Frontend (Director analytics)
- File upload handling (Supabase Storage)
- Deployment configuration

## API Endpoints Reference

### Authentication
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Applications
- `POST /api/applications` - Create new application (public)
- `GET /api/applications/track/:referenceNumber` - Track application (public)
- `GET /api/applications` - List all applications (officer+)
- `GET /api/applications/:id` - Get application details (officer+)
- `PATCH /api/applications/:id/assign` - Assign application (supervisor)
- `PATCH /api/applications/:id/review` - Review application (officer)
- `PATCH /api/applications/:id/approve` - Approve application (director)
- `PATCH /api/applications/:id/reject` - Reject application (director)

### Checkpoint
- `POST /api/checkpoint/verify` - Verify QR code and record entry/exit
- `GET /api/checkpoint/logs` - Get checkpoint logs

### Analytics
- `GET /api/analytics/dashboard` - Dashboard statistics (director/supervisor)
- `GET /api/analytics/entry-exit` - Entry/exit statistics (director/supervisor)
- `GET /api/analytics/processing-time` - Processing time analytics (director/supervisor)
- `GET /api/analytics/audit-logs` - Audit logs (director only)

## Timeline

- **Day 1 (TODAY)**: ✅ Foundation & Backend API
- **Day 2**: Frontend - Visitor Portal (Next.js)
- **Day 3**: Frontend - Officer Dashboard
- **Day 4**: Frontend - Checkpoint Scanner & Director Dashboard
- **Day 5**: File uploads, Testing, Bug fixes
- **Day 6**: Integration testing, UI polish
- **Day 7**: Deployment (Vercel + Railway)

## Troubleshooting

### "Cannot find module" errors
These are expected before running `pnpm install`. Run the install command first.

### Database connection errors
Make sure your Supabase DATABASE_URL is correct in `.env` file.

### Email not sending
- Check RESEND_API_KEY in `.env`
- Verify your domain in Resend dashboard
- In development, emails can only be sent to verified addresses

## Next Command to Run

```bash
pnpm install
```

After installation completes, continue with Step 2 (Supabase setup).
