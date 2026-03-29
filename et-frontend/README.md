# Frontend Deployment Guide (Vercel)

This is the Next.js frontend for the Economic Times Hackathon platform.

## Deploying on Vercel

1. Create a new **Project** on Vercel.
2. Connect your GitHub repository.
3. Configure the following deployment settings:
   - **Framework Preset:** `Next.js` (should be auto-detected)
   - **Root Directory:** `et-frontend`
   - **Build Command:** `npm run build` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

## Environment Variables to Upload

You need to add the following variables in the Vercel Dashboard during setup or before the first deployment:

```env
# Point this to your Render backend URL! No trailing slash.
# Replace with the URL Render gives you for your backend.
AI_SERVICE_URL=https://et-backend-myproject.onrender.com

# Supabase Auth / DB Keys (from your local .env.example)
NEXT_PUBLIC_SUPABASE_URL=https://kdywsxfjktrebzensseq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkeXdzeGZqa3RyZWJ6ZW5zc2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3MTM5NTUsImV4cCI6MjA5MDI4OTk1NX0.sSLHATR_3aLI3mLm2WYpjgFwLLvL-LTsLwtgbRvw6Hc

# Ensure the app doesn't fall back to local engine simulation
NEXT_PUBLIC_USE_LOCAL_ENGINE=false
```

Once you configure these environment variables, hit **Deploy**. Your Vercel frontend will now seamlessly and securely talk to your Render backend!
