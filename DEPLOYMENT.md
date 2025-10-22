# 🚀 Railway Deployment Guide

## Quick Start (5 minutes)

### 1. Prerequisites
- GitHub account
- Railway account (free): https://railway.app
- Cloudinary account (free): https://cloudinary.com

### 2. Setup Cloudinary

1. Go to https://cloudinary.com and create account
2. Copy from Dashboard:
   - Cloud Name
   - API Key  
   - API Secret

### 3. Deploy to Railway

#### Option A: Deploy from GitHub (Recommended)

1. Push your code to GitHub
2. Go to https://railway.app
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. Railway auto-detects Node.js and starts deployment

#### Option B: Deploy with Railway CLI

```bash
npm install -g @railway/cli
railway login
cd backend
railway init
railway up
```

### 4. Add PostgreSQL Database

1. In Railway dashboard, click your project
2. Click "New" button
3. Select "Database" → "Add PostgreSQL"
4. Done! Railway auto-connects it

### 5. Configure Environment Variables

In Railway project → your service → Variables tab, add:

```
NODE_ENV=production
JWT_SECRET=YOUR_GENERATED_SECRET_HERE
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 6. Get Your API URL

Railway assigns URL like: `https://your-app.up.railway.app`

Find it in: Settings → Domains

### 7. Test Your Deployment

```bash
curl https://your-app.up.railway.app/health
```

Should return: `{"status":"ok","timestamp":"..."}`

### 8. Login as Admin

```bash
curl -X POST https://your-app.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

⚠️ **Change admin password immediately!**

### 9. Change Admin Password

```bash
curl -X POST https://your-app.up.railway.app/api/auth/change-password \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"admin123","newPassword":"NewSecurePassword123!"}'
```

## Environment Variables Explained

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection (auto-set by Railway) | `postgresql://...` |
| `JWT_SECRET` | Secret key for JWT tokens | Use crypto.randomBytes(64) |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name | `my-cloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789012345` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abcdefghijklmnop` |
| `PORT` | Server port (auto-set by Railway) | `3000` |
| `NODE_ENV` | Environment | `production` |

## Monitoring

### View Logs
Railway Dashboard → Your Service → Logs

### Check Database
Railway Dashboard → PostgreSQL → Connect

```bash
# Copy connection string and use psql
psql "postgresql://..."
```

### Health Check
```bash
curl https://your-app.up.railway.app/health
```

## Troubleshooting

### Build Fails
- Check `package.json` has correct `start` script
- Verify all dependencies are in `dependencies` not `devDependencies`

### Database Connection Error
- Railway auto-sets `DATABASE_URL` - no action needed
- Check logs for specific error

### Image Upload Fails
- Verify Cloudinary credentials
- Check image size < 5MB
- Ensure proper CORS settings

### 500 Internal Server Error
- Check Railway logs
- Verify all environment variables are set
- Check database connection

## Scaling

Railway free tier includes:
- 500 hours/month
- 512 MB RAM
- 1 GB storage

Upgrade for:
- More resources
- Custom domains
- Priority support

## Next Steps

1. Build frontend and deploy separately
2. Set up custom domain
3. Configure SSL (Railway provides free SSL)
4. Set up monitoring/alerts
5. Create user accounts and grant access

## Security Checklist

- [ ] Changed default admin password
- [ ] Generated secure JWT_SECRET
- [ ] Cloudinary credentials secured
- [ ] CORS configured for frontend only
- [ ] Environment variables not in code
- [ ] Database backups enabled

## Support

- Railway Docs: https://docs.railway.app
- Cloudinary Docs: https://cloudinary.com/documentation
- Create GitHub issue for app-specific problems
