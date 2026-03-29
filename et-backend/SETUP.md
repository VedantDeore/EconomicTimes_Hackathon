# ET AI Microservice

Lightweight Python service (Flask) that handles AI generation (Groq) and financial calculators.

## Setup

```bash
pip install -r requirements.txt
```

## Run

**Important:** the shell's current directory must be **`et-backend`** (the folder that contains `app/`).

```bash
cd et-backend
python -m flask --app app.main:app run --host 127.0.0.1 --port 8000 --debug
```

Match `AI_SERVICE_URL` in `et-frontend/.env.local` to this URL (default `http://127.0.0.1:8000`).

## Endpoints

All endpoints are POST and stateless:

- `POST /ai/fire/plan` - FIRE plan generation
- `POST /ai/health/score` - Money health scoring
- `POST /ai/tax/analyze` - Tax analysis
- `POST /ai/tax/parse-form16` - Form 16 text → structured fields
- `POST /ai/events/advise` - Life event advice
- `POST /ai/mf/analyze` - MF portfolio analysis
- `POST /ai/mentor/chat` - AI Mentor chat (agentic pipeline)
- `POST /ai/mentor/suggestions` - Proactive mentor suggestions
- `POST /ai/couples/optimize` - Couples financial optimization
- `POST /calc/sip` - SIP calculator
- `POST /calc/tax/compare` - Tax regime comparison
- `POST /calc/insurance-gap` - Insurance gap analysis
- `POST /calc/asset-allocation` - Asset allocation
- `GET /health` - Health check
