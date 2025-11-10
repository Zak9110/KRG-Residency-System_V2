# 📋 Next Steps Checklist

## 🔴 CRITICAL - Do This First

### Setup Required Services

- [ ] **Supabase Setup** (10 minutes)
  - [ ] Sign up at https://supabase.com
  - [ ] Create new project
  - [ ] Go to Settings > API
  - [ ] Copy `Project URL` → Add to `.env` as `SUPABASE_URL`
  - [ ] Copy `service_role key` → Add to `.env` as `SUPABASE_SERVICE_KEY`
  - [ ] Storage bucket will auto-create on first API start

- [ ] **Twilio Setup** (15 minutes)
  - [ ] Sign up at https://www.twilio.com
  - [ ] Get WhatsApp Business API access
  - [ ] Go to Console Dashboard
  - [ ] Copy `Account SID` → Add to `.env` as `TWILIO_ACCOUNT_SID`
  - [ ] Copy `Auth Token` → Add to `.env` as `TWILIO_AUTH_TOKEN`
  - [ ] Get WhatsApp Sandbox number → Add as `TWILIO_WHATSAPP_NUMBER`
  - [ ] Get SMS capable number → Add as `TWILIO_SMS_NUMBER`

- [ ] **Test Basic Functionality**
  ```bash
  # 1. Start API
  pnpm dev:api
  
  # 2. Test OTP send (should work if Twilio configured)
  curl -X POST http://localhost:3001/api/otp/send \
    -H "Content-Type: application/json" \
    -d '{"phoneNumber":"+9647501234567","purpose":"APPLICATION"}'
  
  # 3. Check console for OTP code (dev mode)
  # 4. Verify OTP
  curl -X POST http://localhost:3001/api/otp/verify \
    -H "Content-Type: application/json" \
    -d '{"phoneNumber":"+9647501234567","otpCode":"<code>","purpose":"APPLICATION"}'
  
  # 5. Test file upload (should work if Supabase configured)
  curl -X POST http://localhost:3001/api/upload \
    -F "files=@C:\path\to\test.jpg" \
    -F "applicationId=test-123" \
    -F "documentType=NATIONAL_ID"
  ```

---

## 🟡 HIGH PRIORITY - Week 1

### 1. Application Status Lifecycle
- [ ] Update application submission to set `processingDeadline` (72 hours)
- [ ] Create status transition validation function
- [ ] Update checkpoint entry to change status: APPROVED → ACTIVE
- [ ] Update checkpoint exit to change status: ACTIVE → EXITED
- [ ] Create cron job to detect expired permits
- [ ] Create cron job to detect overstays
- [ ] Add status change notifications

### 2. Officer Dashboard UI
- [ ] Create `/apps/web/src/app/dashboard/officer` route
- [ ] Build queue list component (show assigned applications)
- [ ] Create application detail modal/page
- [ ] Add document viewer component
- [ ] Implement approve button (with notes textarea)
- [ ] Implement reject button (with reason dropdown + notes)
- [ ] Implement "Request Documents" button
- [ ] Add personal statistics cards (processed today, this week, etc.)
- [ ] Add real-time updates (polling or WebSocket)

### 3. Auto-Assignment System
- [ ] Create `POST /api/applications/:id/assign` endpoint
- [ ] Implement round-robin assignment algorithm
- [ ] Implement load balancing (find officer with lowest queue)
- [ ] Add priority queue handling (URGENT → HIGH → NORMAL → LOW)
- [ ] Create supervisor reassignment endpoint
- [ ] Add SLA tracking (show time remaining until deadline)
- [ ] Auto-assign on application submission (or manual trigger)

---

## 🟢 MEDIUM PRIORITY - Week 2

### 4. Visitor Tracking Page
- [ ] Create `/apps/web/src/app/track/page.tsx` route
- [ ] Build reference number lookup form
- [ ] Create status timeline component (visual progress)
- [ ] Show QR code if status is APPROVED
- [ ] Add download QR button
- [ ] Show document list
- [ ] Add re-upload documents feature (if status is PENDING_DOCUMENTS)
- [ ] Show expiry date and days remaining

### 5. Multi-Language Support
- [ ] Install `next-intl` package
- [ ] Create translation files:
  - [ ] `locales/ar.json` (Arabic)
  - [ ] `locales/en.json` (English)
  - [ ] `locales/ku.json` (Kurdish)
- [ ] Add language selector to header
- [ ] Translate application form
- [ ] Translate tracking page
- [ ] Translate officer dashboard
- [ ] Update WhatsApp messages to use selected language
- [ ] Store language preference in application

### 6. Enhanced Application Form
- [ ] Add OTP verification step before submission
- [ ] Add file upload component (drag & drop)
- [ ] Show file previews
- [ ] Add form validation (real-time)
- [ ] Add progress indicator (step 1/4, 2/4, etc.)
- [ ] Add "Save Draft" functionality
- [ ] Add confirmation page with reference number
- [ ] Auto-send WhatsApp confirmation on submit

---

## 🔵 LOW PRIORITY - Week 3-4

### 7. Permit Renewal System
- [ ] Create `POST /api/applications/:id/renew` endpoint
- [ ] Create renewal form UI
- [ ] Implement renewal types (STANDARD, EMERGENCY, OVERSTAY)
- [ ] Add renewal eligibility check
- [ ] Create proactive expiry reminders (cron job)
  - [ ] Send WhatsApp at -7 days
  - [ ] Send WhatsApp at -3 days
  - [ ] Send WhatsApp at expiry day
- [ ] Create grace period logic (3 days)
- [ ] Add overstay penalty calculation (if needed)
- [ ] Link renewal to original application

### 8. Appeal System
- [ ] Create `POST /api/applications/:id/appeal` endpoint
- [ ] Create appeal submission form UI
- [ ] Add appeal deadline check (14 days from rejection)
- [ ] Create supervisor appeal review queue
- [ ] Add appeal decision UI (approve/reject appeal)
- [ ] Send appeal decision notifications
- [ ] Link appeal to original application
- [ ] Limit to 1 appeal per rejection

### 9. Checkpoint Mobile App
- [ ] Initialize React Native project with Expo
- [ ] Create login screen (checkpoint officers)
- [ ] Build QR scanner screen (use camera)
- [ ] Implement QR verification logic
- [ ] Create permit details display
- [ ] Add entry recording button
- [ ] Add exit recording button
- [ ] Implement offline mode (cache approved permits)
- [ ] Add sync queue for offline actions
- [ ] Create emergency application form (on mobile)

### 10. Emergency Applications
- [ ] Create `POST /api/applications/emergency` endpoint
- [ ] Implement fast-track security screening
- [ ] Add temporary permit generation (7-day max)
- [ ] Create supervisor override workflow
- [ ] Add follow-up review queue (24-hour deadline)
- [ ] Auto-revoke if not reviewed in 48 hours

---

## ⚙️ MAINTENANCE & OPTIMIZATION

### Code Quality
- [ ] Add TypeScript strict mode
- [ ] Add ESLint rules
- [ ] Add Prettier formatting
- [ ] Write unit tests (Jest)
- [ ] Write integration tests (Supertest)
- [ ] Add API documentation (Swagger/OpenAPI)

### Performance
- [ ] Add Redis for caching
- [ ] Implement rate limiting middleware
- [ ] Add pagination to list endpoints
- [ ] Optimize database queries (indexes)
- [ ] Add CDN for static assets
- [ ] Implement image optimization

### Security
- [ ] Add CORS configuration
- [ ] Implement request validation (zod)
- [ ] Add SQL injection prevention
- [ ] Add CSRF protection
- [ ] Implement password strength requirements
- [ ] Add 2FA for admin accounts
- [ ] Set up SSL/TLS certificates

### DevOps
- [ ] Set up GitHub Actions CI/CD
- [ ] Configure production environment
- [ ] Set up logging (Winston/Pino)
- [ ] Add monitoring (Sentry)
- [ ] Set up backups (automated)
- [ ] Create deployment documentation

---

## 📊 Progress Tracking

### Phase 1: Infrastructure ✅ (100%)
- ✅ Database schema
- ✅ File upload
- ✅ WhatsApp/SMS
- ✅ OTP verification
- ✅ Security screening
- ✅ Documentation

### Phase 2: UI & Core Workflows 🚧 (0%)
- ⏳ Officer dashboard
- ⏳ Visitor tracking
- ⏳ Status lifecycle
- ⏳ Auto-assignment
- ⏳ Multi-language

### Phase 3: Advanced Features ⏳ (0%)
- ⏳ Permit renewals
- ⏳ Appeal system
- ⏳ Mobile app
- ⏳ Emergency applications
- ⏳ Analytics

---

## 🎯 Sprint Planning Suggestion

### Sprint 1 (Week 1): Core Workflows
1. Application status lifecycle
2. Officer dashboard (basic)
3. Auto-assignment system

### Sprint 2 (Week 2): Visitor Experience
1. Visitor tracking page
2. Enhanced application form with OTP
3. Multi-language support (Arabic priority)

### Sprint 3 (Week 3): Advanced Features
1. Permit renewal system
2. Appeal submission
3. Proactive notifications

### Sprint 4 (Week 4): Mobile & Polish
1. Checkpoint mobile app (MVP)
2. Emergency applications
3. Testing & bug fixes

---

## 📝 Notes

- **Supabase & Twilio are CRITICAL** - System won't function without them
- **Test incrementally** - Verify each feature works before moving on
- **Arabic language is priority** - Most users will be Arabic speakers
- **Security is non-negotiable** - Always validate & sanitize input
- **Mobile app can wait** - Web-based checkpoint access works initially

---

## ✅ Quick Wins (Can Do Today)

1. [ ] Set up Supabase account (10 min)
2. [ ] Set up Twilio account (15 min)
3. [ ] Test OTP sending (5 min)
4. [ ] Test file upload (5 min)
5. [ ] Submit test application (2 min)
6. [ ] View data in Prisma Studio (2 min)

**Total Time: ~40 minutes to validate everything works!**

---

**Questions?** Check:
- `IMPLEMENTATION_SUMMARY.md` - What's already done
- `API_REFERENCE.md` - How to use the APIs
- `apps/api/.env.example` - What credentials are needed

**Ready to start Phase 2?** Let me know! 🚀
