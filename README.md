# PESO Quezon City — Labor Rights AI Chatbot
### Micro-PESO App | Public Employment Service Office, Quezon City

---

## Overview

The PESO QC Labor Rights AI Chatbot is a web-based micro application developed as part of the Micro-PESO initiative. It provides workers in Quezon City with instant, accessible information about their rights under the Philippine Labor Code — available 24/7, free of charge, and without requiring an office visit.

The system serves regular employees, contractual workers, kasambahay (domestic workers), and fresh graduates. It answers labor rights questions in Filipino, English, or Taglish; computes pay benefits such as overtime, 13th month pay, and night shift differential; and allows users to book consultation appointments with PESO QC staff directly through the app.

---

## Tech Stack

| Layer | Technology | Plan |
|---|---|---|
| Framework | Next.js 16 (App Router) | Free |
| Language | TypeScript | — |
| Styling | Tailwind CSS v4 | Free |
| AI Model | Nvidia Nemotron 3 Super 120B via OpenRouter | Free tier |
| Database | Supabase (PostgreSQL) | Free tier |
| Hosting | Vercel *(recommended)* | Free tier |

All external services used in this project operate on free tiers, making the system suitable for a government micro-app deployment with no infrastructure cost.

---

## Features

- **AI Chat** — Answers labor rights questions grounded in current Philippine law, citing specific Labor Code articles and wage orders
- **Pay Calculator** — Offline calculator for Overtime Pay, 13th Month Pay, and Night Shift Differential
- **Appointment Booking** — Workers can submit consultation requests directly to PESO QC staff
- **Topics Browser** — Browsable index of common labor rights topics
- **Admin Dashboard** — Password-protected dashboard for PESO QC staff to manage and update booking statuses
- **Multilingual** — Responds in the same language the user writes in (Filipino, English, Taglish)
- **Session Persistence** — Conversation history is saved and restored per browser session

---

## Labor Law References

All labor data in the system is based on the following Philippine legal sources:

- **Wage Order No. NCR-26** — Minimum wage P695/day, effective May 1, 2026
- **Presidential Decree 851** — 13th Month Pay
- **Labor Code Article 86** — Night Shift Differential (10% premium, 10PM-6AM)
- **Labor Code Article 87** — Overtime Pay (Regular: +25%, Rest day/Holiday: +30%)
- **Labor Code Article 94** — Holiday Pay
- **Labor Code Article 95** — Service Incentive Leave (5 days/year)
- **2025 SSS, PhilHealth, and Pag-IBIG contribution schedules**

---

## Prerequisites

Before setting up the project, make sure you have the following installed:

- **Node.js** v18 or higher — [nodejs.org](https://nodejs.org)
- **npm** v9 or higher (comes with Node.js)
- **Git** — [git-scm.com](https://git-scm.com)

You will also need free accounts on:

- **Supabase** — [supabase.com](https://supabase.com) — for the database
- **OpenRouter** — [openrouter.ai](https://openrouter.ai) — for the AI model

---

## Database Setup

In your Supabase project, go to the **SQL Editor** and run the following to create the required tables:

```sql
-- Appointment bookings table
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact text NOT NULL,
  preferred_date text NOT NULL,
  concern text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

-- Chat session history table
CREATE TABLE chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  role text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);
```

---

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/mpl-16/micro-app.git
cd micro-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the root of the project and add the following:

```env
# OpenRouter API key (get from openrouter.ai)
OPENROUTER_API_KEY=your_openrouter_api_key

# Supabase project URL (get from Supabase > Settings > API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase anon key (get from Supabase > Settings > API)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Supabase service role key (get from Supabase > Settings > API)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Admin dashboard password (set your own)
ADMIN_PASSWORD=your_admin_password
```

> **Note:** Never commit `.env.local` to version control. It is already listed in `.gitignore`.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The admin dashboard is accessible at [http://localhost:3000/admin](http://localhost:3000/admin).

---

## Deployment (Vercel — Free)

1. Push the repository to GitHub
2. Go to [vercel.com](https://vercel.com) and import the repository
3. In the Vercel project settings, add all environment variables from your `.env.local`
4. Deploy — Vercel will automatically build and host the app

Every subsequent push to the `main` branch will trigger an automatic redeployment.

---

## Project Structure

```
peso-labor-chatbot/
├── app/
│   ├── layout.tsx                  # Root layout
│   ├── page.tsx                    # Main page
│   ├── admin/
│   │   └── page.tsx                # Admin dashboard
│   ├── api/
│   │   ├── chat/route.ts           # AI chat endpoint
│   │   ├── bookings/route.ts       # Booking submission endpoint
│   │   └── admin/bookings/         # Admin booking endpoints
│   └── components/
│       ├── ChatWindow.tsx          # Main chat UI
│       └── BookingModal.tsx        # Booking form modal
└── lib/
    ├── supabase.ts                 # Supabase public client
    ├── supabaseAdmin.ts            # Supabase admin client
    └── rateLimit.ts                # Rate limiter
```

---

## Free Services Summary

| Service | Purpose | Free Tier Limits |
|---|---|---|
| OpenRouter (Nvidia Nemotron) | AI chat responses | Free, rate-limited |
| Supabase | Database (PostgreSQL) | 500MB storage, 2 projects |
| Vercel | Hosting | 100GB bandwidth/month |

---

## Developer

Developed by **Mark Libo-on**
Public Employment Service Office — Quezon City
2026
