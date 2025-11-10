# 🚀 Deployment Checklist - KRG e-Visit System

## ✅ Pre-Deployment Checklist

### Code Preparation
- [ ] All features tested locally
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] All environment variables documented
- [ ] Database schema finalized
- [ ] Git repository up to date
- [ ] Sensitive data removed from code

### Services Setup
- [ ] Railway account created
- [ ] Vercel account created  
- [ ] GitHub repository created and pushed
- [ ] Supabase project created (for file storage)
- [ ] Twilio account configured (for SMS)

---

## 📦 Step-by-Step Deployment

### Part 1: Database Schema Update (5 minutes)

1. **Update Prisma Schema for PostgreSQL**:
   ```bash
   # Edit packages/database/prisma/schema.prisma
   # Change: provider = "sqlite"
   # To: provider = "postgresql"
   ```

2. **Test locally** (optional):
   ```bash
   # If you have local PostgreSQL:
   DATABASE_URL="postgresql://user:pass@localhost:5432/test" npx prisma migrate dev
   ```

---

### Part 2: Push to GitHub (5 minutes)

```bash
cd C:\Users\zaida\Desktop\KRGv3

# Initialize git (if not done)
git init
git add .
git commit -m "feat: Complete KRG e-Visit System with Arabic support"

# Create GitHub repo and push
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/krg-evisit.git
git push -u origin main
```

---

### Part 3: Deploy API to Railway (15 minutes)

#### 3.1 Create New Project
1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Select your `krg-evisit` repository
4. Click "Deploy Now"

#### 3.2 Add PostgreSQL Database
1. Click "+ New" → "Database" → "Add PostgreSQL"
2. Railway auto-generates `DATABASE_URL`
3. Wait for database to provision (~2 min)

#### 3.3 Configure API Service
1. Click on your service (should auto-detect as Node.js)
2. Go to "Settings" tab
3. **Root Directory**: `apps/api`
4. **Build Command**:
   ```
   cd ../.. && pnpm install && pnpm --filter @krg-evisit/database prisma:generate && pnpm --filter @krg-evisit/api build
   ```
5. **Start Command**:
   ```
   node dist/index.js
   ```

#### 3.4 Add Environment Variables
Click "Variables" tab and add:

```bash
NODE_ENV=production
PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=GENERATE_RANDOM_STRING_HERE

# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token  
TWILIO_PHONE_NUMBER=+1234567890

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_BUCKET=krg-documents

# Resend (optional)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=noreply@krg.gov
```

#### 3.5 Deploy and Migrate
1. Click "Deploy" (automatic after variable save)
2. Wait for build (~5 min)
3. Once deployed, open Terminal and run:
   ```bash
   npx prisma migrate deploy
   # OR
   npx prisma db push
   ```
4. Seed database:
   ```bash
   cd packages/database && npm run seed
   ```

#### 3.6 Generate Public URL
1. Go to "Settings" → "Networking"
2. Click "Generate Domain"
3. Copy URL: `https://your-api.railway.app`
4. **Save this URL!** You'll need it for Vercel

---

### Part 4: Deploy Frontend to Vercel (10 minutes)

#### 4.1 Import Project
1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub repo
4. Click "Import"

#### 4.2 Configure Build Settings
- **Framework Preset**: Next.js
- **Root Directory**: `apps/web`
- **Build Command**: 
  ```
  cd ../.. && pnpm install && pnpm --filter @krg-evisit/web build
  ```
- **Output Directory**: `.next`
- **Install Command**: `pnpm install`

#### 4.3 Add Environment Variables
Click "Environment Variables":

```bash
NEXT_PUBLIC_API_URL=https://your-api.railway.app
NODE_ENV=production
```

#### 4.4 Deploy
1. Click "Deploy"
2. Wait for build (~5 min)
3. Get your URL: `https://your-app.vercel.app`

---

### Part 5: Update CORS (5 minutes)

#### 5.1 Update API CORS Settings
1. Open `apps/api/src/index.ts` in VS Code
2. Find the CORS configuration
3. Update to include Vercel URL:
   ```typescript
   app.use(cors({
     origin: [
       'https://your-app.vercel.app',
       'http://localhost:3002'
     ],
     credentials: true
   }));
   ```

#### 5.2 Commit and Push
```bash
git add apps/api/src/index.ts
git commit -m "fix: Update CORS for production"
git push
```

Railway will auto-deploy with the new CORS settings.

---

## 🧪 Testing Deployment (15 minutes)

### Test Checklist

1. **Frontend Loads**:
   - [ ] Visit `https://your-app.vercel.app`
   - [ ] Home page displays correctly
   - [ ] No console errors

2. **Language Switcher**:
   - [ ] Click 🌐 icon
   - [ ] URL changes to `/ar`
   - [ ] Page displays in Arabic (RTL)
   - [ ] Switch back to English works

3. **Login System**:
   - [ ] Navigate to `/en/login`
   - [ ] Login with `director@test.com` / `password123`
   - [ ] Redirects to director dashboard
   - [ ] No errors in console

4. **Director Dashboard**:
   - [ ] All sections load (Overview, Demographics, etc.)
   - [ ] Charts display data
   - [ ] Sidebar navigation works
   - [ ] Filters panel opens
   - [ ] Arabic version works (`/ar/dashboard/director`)

5. **Track Application**:
   - [ ] Go to Track page
   - [ ] Try searching (may not find anything if no apps yet)
   - [ ] Page loads without errors

6. **Test Other Roles**:
   - [ ] Login as Officer: `officer@test.com`
   - [ ] Login as Supervisor: `supervisor@test.com`
   - [ ] Both dashboards load correctly

---

## 🔧 Troubleshooting

### API Issues

**Problem**: API won't start
```bash
# Check Railway logs
# Common issues:
- DATABASE_URL not set
- Prisma schema not generated
- Missing environment variables
```

**Solution**:
1. Go to Railway dashboard
2. Click on API service
3. Check "Deployments" → "View Logs"
4. Look for error messages
5. Verify all environment variables are set

---

### Frontend Issues

**Problem**: Can't reach API
```bash
# Check browser console
# Common error: "Failed to fetch"
```

**Solution**:
1. Verify `NEXT_PUBLIC_API_URL` is set in Vercel
2. Check CORS is configured correctly
3. Ensure Railway API is running
4. Try accessing API URL directly in browser

---

**Problem**: Dashboard blank/no data
```bash
# Charts not loading
```

**Solution**:
1. Check if database is seeded (Railway terminal: `npm run seed`)
2. Verify API endpoint returns data (visit `/api/analytics/director-pro`)
3. Check browser Network tab for failed requests

---

## 📊 Post-Deployment Tasks

### 1. Update Documentation
- [ ] Add production URLs to README
- [ ] Document any deployment-specific configs
- [ ] Update environment variable examples

### 2. Monitor Services
- [ ] Check Railway metrics (CPU, memory)
- [ ] Check Vercel analytics
- [ ] Set up alerts (optional)

### 3. Security Check
- [ ] Verify JWT_SECRET is strong
- [ ] Ensure no sensitive data in logs
- [ ] Test authentication is working

### 4. Performance
- [ ] Test page load times
- [ ] Check dashboard chart rendering
- [ ] Verify image optimization

---

## 🎉 Success Criteria

✅ **Backend Deployed**
- Railway shows "Active" status
- API URL responds to requests
- Database connected and seeded

✅ **Frontend Deployed**
- Vercel shows "Ready" status  
- Application accessible via HTTPS
- All pages load without errors

✅ **Integration Working**
- Frontend can reach backend API
- Authentication works
- Dashboard displays data
- Language switching works

✅ **Features Functional**
- Login system operational
- All three dashboards work
- Professional director dashboard loads
- Arabic/English switching works
- Charts display data

---

## 📞 Support Resources

- **Railway Docs**: https://docs.railway.app
- **Vercel Docs**: https://vercel.com/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Next.js Docs**: https://nextjs.org/docs

---

## ⏱️ Estimated Time

- **Total**: ~60 minutes
- Code prep: 10 min
- Railway setup: 15 min
- Vercel setup: 10 min
- CORS update: 5 min
- Testing: 15 min
- Documentation: 5 min

---

## 🎯 What's Next After Deployment?

1. ✅ **Deployment Complete** (Current step)
2. 📝 **Create Demo Video** (30-45 min)
   - Record screen walkthrough
   - Show all features
   - Demonstrate bilingual support
   - Showcase professional dashboard
3. 📚 **Write Final Documentation** (30 min)
   - User guides for each role
   - API documentation
   - Setup instructions
4. 🎬 **Prepare Presentation** (30 min)
   - PowerPoint slides
   - Project highlights
   - Technical architecture
   - Demo preparation

---

**Good luck with your deployment! 🚀**
