# SupportBot AI — Complete Setup & Deployment Guide

A full-stack SaaS app that lets small businesses create and embed AI-powered customer support chatbots on their websites.

---

## Project Structure

```
supportbot-ai/
├── backend/               # Node.js + Express API
│   ├── src/
│   │   ├── index.js       # App entry point
│   │   ├── lib/
│   │   │   └── supabase.js
│   │   ├── middleware/
│   │   │   └── auth.js    # JWT middleware
│   │   └── routes/
│   │       ├── auth.js    # Signup / login / me
│   │       ├── bots.js    # Bot CRUD + embed key
│   │       ├── chat.js    # AI chat endpoint
│   │       └── stripe.js  # Payments & webhooks
│   ├── .env.example
│   └── package.json
├── frontend/              # React + Vite SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Landing.jsx    # Marketing page
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx  # Bot management
│   │   │   └── BotEditor.jsx  # Create / edit bot
│   │   ├── lib/
│   │   │   └── api.js         # Axios instance
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── embed/
│   └── embed.js           # Self-contained embeddable widget
└── schema.sql             # Supabase database schema
```

---

## Day 1: Database Setup (Supabase)

### 1. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a region close to your users
3. Save your database password

### 2. Run the schema
1. Open your project → **SQL Editor**
2. Paste the contents of `schema.sql` and click **Run**

### 3. Get your credentials
Go to **Settings → API**:
- `SUPABASE_URL` — your project URL (e.g. `https://xxxx.supabase.co`)
- `SUPABASE_SERVICE_KEY` — the `service_role` key (keep this secret!)

---

## Day 1: Stripe Setup

### 1. Create a Stripe account
[stripe.com](https://stripe.com) → Create account

### 2. Create a product
1. Dashboard → **Products** → Add product
2. Name: "SupportBot Pro"
3. Price: $15/month, recurring
4. Save — copy the **Price ID** (starts with `price_`)

### 3. Get your API keys
Dashboard → **Developers → API keys**:
- `STRIPE_SECRET_KEY` — starts with `sk_test_` or `sk_live_`

### 4. Set up webhook (for subscription events)
1. **Developers → Webhooks** → Add endpoint
2. URL: `https://your-backend.railway.app/api/stripe/webhook`
3. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
4. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

### 5. For local testing
```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
```

---

## Day 2: Backend Setup

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3001
FRONTEND_URL=http://localhost:5173

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

JWT_SECRET=change-this-to-a-long-random-string-32chars+

OPENAI_API_KEY=sk-...

STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Run locally
```bash
npm run dev
# API running at http://localhost:3001
```

### 4. Test health check
```bash
curl http://localhost:3001/health
# {"status":"ok"}
```

---

## Day 2: Frontend Setup

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:3001/api
```

### 3. Run locally
```bash
npm run dev
# App running at http://localhost:5173
```

---

## Day 3: Embed Widget Setup

The `embed/embed.js` file is a self-contained widget script. It needs to be served from your backend.

### Option A: Serve from Express backend
Add this to `backend/src/index.js` (after middleware):
```js
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use('/embed.js', express.static(join(__dirname, '../../embed/embed.js')));
```

### Option B: Upload to CDN (Recommended for production)
Upload `embed.js` to:
- Cloudflare R2, AWS S3, or any static host
- Update the script URL in your embed code accordingly

### Update the API URL in the widget
In `embed/embed.js`, line 8, update the fallback URL:
```js
const API_URL = scriptTag?.getAttribute('data-api-url') || 'https://YOUR-BACKEND.railway.app/api';
```

### The embed code users paste into their site:
```html
<script src="https://your-backend.railway.app/embed.js" data-bot-key="THEIR-BOT-UUID" defer></script>
```

---

## Day 4: Deployment

### Backend → Railway

1. Install Railway CLI: `npm install -g @railway/cli`
2. ```bash
   cd backend
   railway login
   railway init
   railway up
   ```
3. Set environment variables in Railway dashboard (same as `.env`)
4. Railway gives you a URL like `https://supportbot-backend.railway.app`

**Or use Render:**
1. Push backend to GitHub
2. [render.com](https://render.com) → New Web Service → connect repo
3. Build command: `npm install`
4. Start command: `npm start`
5. Add all environment variables

### Frontend → Vercel

1. Push frontend to GitHub
2. [vercel.com](https://vercel.com) → New Project → import repo
3. Framework: **Vite**
4. Add environment variable:
   - `VITE_API_URL` = `https://your-backend.railway.app/api`
5. Deploy

### Update CORS
Once deployed, update backend `.env`:
```env
FRONTEND_URL=https://your-frontend.vercel.app
```

---

## Environment Variables Reference

### Backend (`backend/.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://yourapp.vercel.app` |
| `SUPABASE_URL` | Supabase project URL | `https://xxxx.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | `eyJ...` |
| `JWT_SECRET` | Secret for signing JWTs | 32+ random chars |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `STRIPE_SECRET_KEY` | Stripe secret key | `sk_test_...` |
| `STRIPE_PRO_PRICE_ID` | Stripe price ID for Pro plan | `price_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | `whsec_...` |

### Frontend (`frontend/.env`)
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `https://api.yourapp.com/api` |

---

## API Endpoints Reference

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Bots
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/bots` | List user's bots |
| POST | `/api/bots` | Create bot |
| GET | `/api/bots/:id` | Get bot |
| PUT | `/api/bots/:id` | Update bot |
| DELETE | `/api/bots/:id` | Delete bot |
| GET | `/api/bots/embed/:key` | Public: get bot config |

### Chat
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/chat/:embed_key` | Send message to bot |

### Stripe
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/stripe/create-checkout` | Start Pro checkout |
| POST | `/api/stripe/portal` | Open billing portal |
| POST | `/api/stripe/webhook` | Stripe events |

---

## Plan Limits

| Feature | Free | Pro ($15/mo) |
|---------|------|--------------|
| Bots | 1 | Unlimited |
| Messages/month | 100 | 5,000 |
| FAQ entries | Unlimited | Unlimited |
| Embed code | ✓ | ✓ |
| AI fallback | ✓ | ✓ |

---

## Monthly Message Reset

Messages reset to 0 on the 1st of each month. Set up a Supabase cron job:

1. Go to **Supabase → Database → Extensions** → enable `pg_cron`
2. Run in SQL Editor:
```sql
SELECT cron.schedule('reset-monthly-counts', '0 0 1 * *', 'SELECT reset_monthly_counts()');
```

---

## User Flow (Success Criteria)

1. **Sign up** → `/signup` → JWT stored in localStorage
2. **Create a bot** → `/dashboard/bot/new` → enter business name, FAQs, tone, color
3. **Get embed code** → Dashboard → click "Embed" on any bot → copy the script tag
4. **Add to website** → paste `<script src="..." data-bot-key="...">` before `</body>`
5. **Chat works** → floating bubble appears on site → bot answers from FAQs + OpenAI

---

## Local Development Checklist

- [ ] Supabase project created + schema.sql run
- [ ] `backend/.env` filled in
- [ ] `frontend/.env` filled in
- [ ] `cd backend && npm install && npm run dev`
- [ ] `cd frontend && npm install && npm run dev`
- [ ] Open http://localhost:5173
- [ ] Sign up → create bot → copy embed code → test in browser console

---

## Cost Estimate (Monthly)

| Service | Cost |
|---------|------|
| Supabase (free tier) | $0 |
| Railway (starter) | ~$5 |
| Vercel (hobby) | $0 |
| OpenAI (gpt-4o-mini) | ~$0.15 per 1M tokens |
| Stripe | 2.9% + 30¢ per transaction |

**Total to run with 10 paying users: ~$8–12/month**

---

## Quick Wins / Future Features

- [ ] Analytics page (messages per day chart)
- [ ] Bot testing interface in dashboard  
- [ ] Multiple language support
- [ ] Email notifications when limit reached
- [ ] Custom bot avatar upload
- [ ] Conversation history export
- [ ] Zapier/webhook integration on new chat
