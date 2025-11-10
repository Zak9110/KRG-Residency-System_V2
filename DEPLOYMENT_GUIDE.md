# Deployment Guide - KRG e-Visit System

## 🚀 Quick Deployment Steps

### Prerequisites
- GitHub account
- Railway account (https://railway.app)
- Vercel account (https://vercel.com)
- Your project pushed to GitHub

---

## Part 1: Deploy API to Railway (Backend)

### Step 1: Prepare Database Schema
Railway uses PostgreSQL, so we need to update the schema:

1. Open `packages/database/prisma/schema.prisma`
2. Change datasource from `sqlite` to `postgresql`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

### Step 2: Push to GitHub
```bash
cd C:\Users\zaida\Desktop\KRGv3
git init
git add .
git commit -m "Initial commit - KRG e-Visit System"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Step 3: Deploy to Railway

1. **Go to Railway**: https://railway.app/new
2. **Click "Deploy from GitHub repo"**
3. **Select your repository**
4. **Add PostgreSQL Database**:
   - Click "New" → "Database" → "Add PostgreSQL"
   - Railway will automatically create DATABASE_URL

5. **Configure API Service**:
   - Click "New" → "GitHub Repo"
   - Select your repo
   - Set Root Directory: `apps/api`
   - Set Build Command: `cd ../.. && pnpm install && pnpm --filter @krg-evisit/database prisma:generate && pnpm --filter @krg-evisit/api build`
   - Set Start Command: `cd ../.. && pnpm --filter @krg-evisit/api start`

6. **Add Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3001
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   JWT_SECRET=your-super-secret-jwt-key-change-this
   
   # Twilio (SMS)
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone
   
   # Supabase (Storage)
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_key
   SUPABASE_BUCKET=krg-documents
   
   # Resend (Email)
   RESEND_API_KEY=your_resend_api_key
   ```

7. **Run Database Migration**:
   - In Railway terminal: `npx prisma migrate deploy`
   - Or: `npx prisma db push`

8. **Seed Database**:
   ```bash
   npm run seed
   ```

9. **Get API URL**: Railway will provide a public URL like:
   `https://your-api.railway.app`

---

## Part 2: Deploy Frontend to Vercel (Web App)

### Step 1: Update API URLs

1. Create `.env.local` in `apps/web/`:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.railway.app
   ```

2. Replace all `localhost:3001` references with `process.env.NEXT_PUBLIC_API_URL`

### Step 2: Deploy to Vercel

1. **Go to Vercel**: https://vercel.com/new
2. **Import Git Repository**
3. **Configure Project**:
   - Framework Preset: Next.js
   - Root Directory: `apps/web`
   - Build Command: `cd ../.. && pnpm install && pnpm --filter @krg-evisit/web build`
   - Output Directory: `.next`
   - Install Command: `pnpm install`

4. **Add Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.railway.app
   NODE_ENV=production
   ```

5. **Deploy**: Click "Deploy"

6. **Get Frontend URL**: Vercel will provide:
   `https://your-app.vercel.app`

---

## Part 3: Final Configuration

### Update CORS on Railway

Add to `apps/api/src/index.ts`:
```typescript
app.use(cors({
  origin: ['https://your-app.vercel.app', 'http://localhost:3002'],
  credentials: true
}));
```

Redeploy Railway after this change.

---

## 🎯 Testing Checklist

After deployment, test:

- [ ] Frontend loads at Vercel URL
- [ ] Language switcher works (EN/AR)
- [ ] Can access login page
- [ ] Can login with test credentials
- [ ] Officer dashboard loads
- [ ] Supervisor dashboard loads
- [ ] Director dashboard loads with charts
- [ ] Professional dashboard shows all sections
- [ ] Track application works
- [ ] Apply form works (if implemented)

---

## 📝 Important Notes

1. **Database Migration**: Changing from SQLite to PostgreSQL requires:
   - Update schema.prisma
   - Run `npx prisma migrate dev` locally first
   - Test thoroughly before deploying

2. **Environment Variables**: Never commit sensitive keys to GitHub
   - Use `.env.example` for templates
   - Add real values in Railway/Vercel dashboards

3. **Build Time**: First deployment may take 5-10 minutes

4. **Monitoring**: 
   - Railway: Check logs in dashboard
   - Vercel: Check logs in dashboard

---

## 🔧 Quick Commands Reference

```bash
# Build locally to test
pnpm build

# Check for TypeScript errors
cd apps/api && npx tsc --noEmit
cd apps/web && npx next build

# Test production build locally
cd apps/api && pnpm start
cd apps/web && pnpm start
```

---

## 🆘 Troubleshooting

**API won't start?**
- Check DATABASE_URL is set
- Verify Prisma schema is correct
- Check Railway logs for errors

**Frontend can't reach API?**
- Check NEXT_PUBLIC_API_URL is set
- Verify CORS is configured
- Check Network tab in browser

**Database errors?**
- Run migrations: `npx prisma migrate deploy`
- Check PostgreSQL connection
- Verify schema matches

---

## ✅ Success Indicators

✅ Railway API status: "Active"
✅ Vercel deployment status: "Ready"
✅ Both services have green status
✅ Can access frontend URL
✅ Can login to dashboards
✅ Charts load on director dashboard

---

## 📞 Support Resources

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Prisma Docs: https://www.prisma.io/docs
- Next.js Docs: https://nextjs.org/docs
