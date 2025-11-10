# 🎯 KRG e-Visit System

**Digital residency permit system for Kurdistan Region of Iraq**

Streamlined end-to-end workflow from online application to checkpoint verification with QR codes, WhatsApp notifications, and automated security screening.

[![Status](https://img.shields.io/badge/Status-Phase%201%20Complete-green)]()
[![Progress](https://img.shields.io/badge/Progress-40%25-blue)]()
[![Tech](https://img.shields.io/badge/Stack-PNPM%20Monorepo-purple)]()

---

## ✨ Features Implemented (Phase 1)

- ✅ **Online Application Submission** - Public form with validation
- ✅ **File Upload System** - Supabase Storage integration (documents, photos, IDs)
- ✅ **Phone OTP Verification** - SMS-based verification via Twilio
- ✅ **WhatsApp Notifications** - 7 automated message templates
- ✅ **Security Screening** - Risk scoring (0-100) with watchlist checking
- ✅ **QR Code Generation** - HMAC-signed permits
- ✅ **Entry/Exit Tracking** - Checkpoint logging
- ✅ **Audit Trail** - Complete action history

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm 8+
- Supabase account (file storage)
- Twilio account (WhatsApp/SMS)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd KRGv3

# Install dependencies
pnpm install

# Setup environment variables
cd apps/api
copy .env.example .env
# Edit .env with your API keys (Supabase, Twilio, etc.)

# Setup database
cd ../../packages/database
npx prisma generate
npx prisma db push
npm run seed

# Start development servers
cd ../..
pnpm dev        # Both API + Web
# OR
pnpm dev:api    # API only (port 3001)
pnpm dev:web    # Web only (port 3000)
```

---

## 🌐 Access URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Visitor Portal** | http://localhost:3000 | Public application form |
| **API Backend** | http://localhost:3001 | REST API endpoints |
| **Prisma Studio** | `pnpm db:studio` | Database GUI |
| **API Health Check** | http://localhost:3001/health | Server status |

---

## 🔑 Default Login Credentials

### Admin Account
- **Email:** admin@krg-evisit.gov
- **Password:** Admin@123
- **Access:** Full system administration

### Officer Account
- **Email:** officer@krg-evisit.gov
- **Password:** Officer@123
- **Access:** Application processing queue

### Supervisor Account
- **Email:** supervisor@krg-evisit.gov
- **Password:** Supervisor@123
- **Access:** Team management + overrides

---

## 📡 API Endpoints

### Public (No Auth)
```http
POST /api/applications          # Submit application
POST /api/otp/send             # Send OTP
POST /api/otp/verify           # Verify OTP
GET  /health                   # Health check
```

### Protected (Auth Required)
```http
POST   /api/upload                    # Upload documents
GET    /api/upload/:applicationId     # Get documents
DELETE /api/upload/:documentId        # Delete document
POST   /api/checkpoint/verify         # Verify QR code
POST   /api/checkpoint/entry          # Record entry
```

📖 **Full API Documentation:** See `API_REFERENCE.md`

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Language:** TypeScript

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express.js
- **Language:** TypeScript

### Database
- **Production:** PostgreSQL (Supabase)
- **Development:** SQLite
- **ORM:** Prisma

### Services
- **Storage:** Supabase Storage
- **Notifications:** Twilio (WhatsApp + SMS)
- **Email:** Resend
- **Auth:** JWT (jsonwebtoken)

### Monorepo
- **Package Manager:** pnpm
- **Workspaces:** 3 packages (api, web, database)
- **Build Tool:** TypeScript + tsx

---

## 📦 Project Structure

```
KRGv3/
├── apps/
│   ├── api/                    # Express API backend
│   │   ├── src/
│   │   │   ├── routes/        # API endpoints
│   │   │   │   ├── applications.ts
│   │   │   │   ├── upload.ts  ✨ NEW
│   │   │   │   └── otp.ts     ✨ NEW
│   │   │   ├── services/      # Business logic
│   │   │   │   ├── whatsapp.ts ✨ NEW
│   │   │   │   ├── storage.ts  ✨ NEW
│   │   │   │   └── security.ts ✨ NEW
│   │   │   └── index.ts
│   │   └── .env.example       ✨ NEW
│   └── web/                    # Next.js frontend
│       └── src/app/
│           ├── apply/          # Public application
│           └── track/          # Status tracking
├── packages/
│   ├── database/               # Prisma schema + migrations
│   │   ├── prisma/
│   │   │   └── schema.prisma  # 10 tables (3 new)
│   │   └── src/seed.ts
│   └── shared-types/           # TypeScript types
├── IMPLEMENTATION_SUMMARY.md   ✨ NEW - What's been built
├── API_REFERENCE.md           ✨ NEW - Complete API docs
└── package.json
```

---

## 🔧 Environment Variables

Copy `apps/api/.env.example` to `apps/api/.env` and configure:

### Required (Critical)
```env
# Supabase (File Storage)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...

# Twilio (WhatsApp + SMS)
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_SMS_NUMBER=+1234567890
```

### Already Configured
```env
# Email
RESEND_API_KEY=your-existing-key

# Security
JWT_SECRET=your-secret
QR_CODE_SECRET=your-qr-secret
```

📋 **Full Environment Guide:** See `apps/api/.env.example`

---

## 🧪 Testing

### Test OTP System
```bash
# Send OTP
curl -X POST http://localhost:3001/api/otp/send \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+9647501234567","purpose":"APPLICATION"}'

# Verify OTP (check console for code in dev mode)
curl -X POST http://localhost:3001/api/otp/verify \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+9647501234567","otpCode":"123456","purpose":"APPLICATION"}'
```

### Test File Upload
```bash
curl -X POST http://localhost:3001/api/upload \
  -F "files=@/path/to/file.jpg" \
  -F "applicationId=test-id" \
  -F "documentType=NATIONAL_ID"
```

---

## 📊 Database Schema

### Tables (10 Total)
1. **users** - Officers, Supervisors, Directors, Admins
2. **applications** - Visitor applications (36 fields)
3. **documents** - Uploaded files
4. **entry_exit_logs** - Checkpoint records
5. **audit_logs** - System actions
6. **internal_watchlist** - Security flags ✨
7. **otp_verifications** - Phone verification ✨ NEW
8. **renewal_applications** - Permit renewals ✨ NEW
9. **appeals** - Rejection appeals ✨ NEW

```bash
# View database in GUI
cd packages/database
npx prisma studio
```

---

## 📈 Implementation Status

### ✅ Phase 1: Critical Infrastructure (100%)
- ✅ Database schema (10 tables)
- ✅ File upload system
- ✅ WhatsApp/SMS notifications
- ✅ Phone OTP verification
- ✅ Security screening (risk scoring)
- ✅ Environment configuration

### 🚧 Phase 2: UI & Workflows (0%)
- 🔄 Officer dashboard (Next.js)
- 🔄 Visitor tracking page
- 🔄 Application status lifecycle
- 🔄 Auto-assignment system
- 🔄 Multi-language support (Arabic/English/Kurdish)

### 📋 Phase 3: Advanced Features (0%)
- ⏳ Permit renewal workflow
- ⏳ Appeal system
- ⏳ Checkpoint mobile app (React Native)
- ⏳ Emergency applications
- ⏳ Analytics dashboard

**Overall Progress:** 40% Complete

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **README.md** | This file - Quick start guide |
| **IMPLEMENTATION_SUMMARY.md** | Detailed progress report |
| **API_REFERENCE.md** | Complete API documentation |
| **SETUP_INSTRUCTIONS.md** | Original setup guide |
| **apps/api/.env.example** | Environment variables template |

---

## 🤝 Contributing

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes
# ...

# Run tests
pnpm test

# Commit with conventional commits
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/your-feature
```

---

## 📝 License

Copyright © 2025 Kurdistan Regional Government

---

## 🆘 Support

**Questions?** Check the documentation:
1. `IMPLEMENTATION_SUMMARY.md` - What's built
2. `API_REFERENCE.md` - API endpoints
3. `apps/api/.env.example` - Configuration

**Issues?** Check:
- Database: `pnpm db:studio` (view data)
- API Logs: `pnpm dev:api` (watch console)
- Environment: Verify all keys in `.env`

---

**Last Updated:** November 9, 2025  
**Version:** 1.0.0-beta  
**Status:** Phase 1 Complete ✅
