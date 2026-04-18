# CivicFix — Production Deployment Guide

## Frontend → Vercel

### Environment Variables (Vercel Dashboard)
```
VITE_API_URL=https://your-backend.railway.app/api
```

### Deploy Steps
```bash
# Build locally to verify
npm run build

# Preview production build
npm run preview

# Deploy to Vercel (auto-deploy on push to main)
git push origin main
```

### vercel.json (create at root if needed)
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## Backend → Railway

### Environment Variables (Railway Dashboard)
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=<strong-random-secret>
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-app.vercel.app
```

### Deploy Steps
```bash
# In railway.json or via Railway CLI:
# Start command: node index.js (or npm start)
# Root directory: /server
```

### Procfile (optional, for Railway/Heroku)
```
web: node index.js
```

---

## Security Checklist for Production

- [ ] Replace `JWT_SECRET` with a cryptographically random 64+ char string
- [ ] Set `NODE_ENV=production`
- [ ] Remove development CORS origins (localhost:5173)
- [ ] Verify `CLIENT_URL` matches your Vercel deployment URL exactly
- [ ] Enable MongoDB Atlas IP allowlist (restrict to Railway IPs)
- [ ] Review rate limiting values for production traffic
- [ ] Set up error monitoring (Sentry recommended)

---

## Health Check

```
GET https://your-backend.railway.app/api/health
```

Expected response includes `status: "ok"`, `uptime`, and `features` list.

---

## API Documentation

```
https://your-backend.railway.app/api/docs
```

Available in both development and production.
