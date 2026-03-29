# Backend Deployment Guide (Render)

This is the Python FastAPI/Flask backend for the Economic Times Hackathon.

## Deploying on Render

1. Create a new **Web Service** on Render.
2. Connect your GitHub repository.
3. Configure the following deployment settings:
   - **Root Directory:** `et-backend` (It is crucial to set this so Render finds the `requirements.txt` and `app/` folder)
   - **Runtime:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT`
     *(Render provides the `$PORT` environment variable automatically).*

## Environment Variables to Upload

You need to add the following variables in the Render Dashboard (**Environment > Environment Variables**):

```env
# Required for AI services (Replace with your actual key)
GROQ_API_KEY=your_groq_api_key_here

# (Optional) If you have a HuggingFace token used anywhere for embeddings
HF_TOKEN=your_hf_token_here

# Allow your Vercel frontend to talk to this backend securely.
# Alternatively, replace '*' with your actual frontend URL, e.g. https://my-frontend.vercel.app
CORS_ORIGINS=*
```

Once Render finishes deploying, it will give you a live URL like `https://et-backend-myproject.onrender.com`.  
**Copy this URL** — you will need to paste it into your Vercel frontend environment variables.
