# Deployment Guide - Email Statistics Dashboard

## Quick Start - Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account (free)
- This repository pushed to GitHub

### Step 1: Push to GitHub

```bash
cd ~/Desktop/email-stats
git init
git add .
git commit -m "Initial commit: Email stats dashboard with auth"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/email-stats.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - Framework Preset: Next.js
   - Root Directory: `.`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Step 3: Set Environment Variables in Vercel

In Vercel Dashboard → Project Settings → Environment Variables, add:

```
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=generate-a-new-secret-using-command-below
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

### Step 4: Initialize Database (First Time Only)

After deployment, call the init endpoint once:
```bash
curl -X POST https://your-domain.vercel.app/api/init
```

This will create:
- Authentication tables
- Test user: `admin@example.com` / `admin123`

### Step 5: Access Your App

Visit: `https://your-domain.vercel.app`

Login with:
- Email: `admin@example.com`
- Password: `admin123`

---

## Production Considerations

### Database Migration (SQLite → PostgreSQL)

For production, we recommend PostgreSQL. Here's how to set it up:

1. **Add PostgreSQL support**
   ```bash
   npm install pg
   ```

2. **Update lib/db.ts** to use PostgreSQL instead of SQLite

3. **In Vercel, add PostgreSQL** via Vercel Postgres:
   - Project Settings → Storage → Create Database
   - Copy the `DATABASE_URL` environment variable

4. **Redeploy** - your app will automatically use PostgreSQL

### Security Checklist

- [ ] Change default credentials (`admin@example.com`)
- [ ] Generate new `NEXTAUTH_SECRET`
- [ ] Enable Vercel Production Deployment Protection
- [ ] Set up HTTPS (automatic with Vercel)
- [ ] Configure custom domain
- [ ] Enable environment variable encryption

### Performance Optimization

- Enable Vercel Analytics
- Set up Error Monitoring (Sentry, LogRocket)
- Configure CDN caching for static assets

---

## Local Development

```bash
cd ~/Desktop/email-stats

# Install dependencies
npm install

# Create .env.local with:
# NEXTAUTH_URL=http://localhost:3000
# NEXTAUTH_SECRET=your-secret-key-here

# Start dev server
npm run dev

# Initialize database (first time)
curl -X POST http://localhost:3000/api/init

# Login at http://localhost:3000/login
# Email: admin@example.com
# Password: admin123
```

---

## Troubleshooting

### "Database not found" error
- Call `/api/init` endpoint to initialize tables

### "Invalid credentials" error
- Ensure you've called `/api/init`
- Check database contains `auth_users` table

### "NEXTAUTH_SECRET is not configured"
- Add `NEXTAUTH_SECRET` to Vercel environment variables

---

## Support

For issues, check:
1. Vercel Build Logs (Project Settings → Deployments)
2. Console logs at `https://your-domain.vercel.app/logs`
3. NextAuth.js docs: https://next-auth.js.org/
