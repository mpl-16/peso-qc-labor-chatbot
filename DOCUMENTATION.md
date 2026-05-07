# PESO Quezon City — Labor Rights AI Chatbot
## System Documentation

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Project Structure](#3-project-structure)
4. [Features](#4-features)
5. [API Reference](#5-api-reference)
6. [Database Schema](#6-database-schema)
7. [Environment Variables](#7-environment-variables)
8. [Labor Data Sources](#8-labor-data-sources)
9. [Rate Limiting](#9-rate-limiting)
10. [Admin Dashboard](#10-admin-dashboard)
11. [Known Limitations](#11-known-limitations)

---

## 1. System Overview

The PESO QC Labor Rights AI Chatbot is a web application built for the **Public Employment Service Office of Quezon City**. It provides workers — including regular employees, contractual workers, kasambahay (domestic workers), and fresh graduates — with accessible information about their rights under the **Philippine Labor Code**.

The system allows users to:
- Ask labor rights questions in Filipino, English, or Taglish
- Compute pay benefits (overtime, 13th month pay, night shift differential)
- Book consultation appointments with PESO QC staff
- Export conversation transcripts

PESO QC staff can manage and track bookings through a password-protected admin dashboard.

---

## 2. Architecture

```
Browser (Next.js Client)
        |
        |── /api/chat              → OpenRouter AI (nvidia/nemotron-3-super-120b)
        |── /api/bookings          → Supabase (bookings table)
        |── /api/admin/bookings    → Supabase Admin (service role)
        |── /api/admin/bookings/[id] → Supabase Admin (service role)
        |
Supabase (PostgreSQL)
        |── bookings table
        |── chat_sessions table
```

**Stack:**

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| AI Provider | OpenRouter (nvidia/nemotron-3-super-120b-a12b:free) |
| Database | Supabase (PostgreSQL) |
| Markdown Rendering | react-markdown |

---

## 3. Project Structure

```
peso-labor-chatbot/
├── app/
│   ├── layout.tsx                  # Root layout, fonts, metadata
│   ├── page.tsx                    # Main chat page (header + footer)
│   ├── globals.css                 # Global styles
│   ├── admin/
│   │   └── page.tsx                # Admin dashboard (password-protected)
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts            # AI chat endpoint
│   │   ├── bookings/
│   │   │   └── route.ts            # Public booking submission endpoint
│   │   └── admin/
│   │       └── bookings/
│   │           ├── route.ts        # Admin: list all bookings (GET)
│   │           └── [id]/
│   │               └── route.ts    # Admin: update booking status (PATCH)
│   └── components/
│       ├── ChatWindow.tsx          # Main chat UI (tabs, messages, calculator)
│       └── BookingModal.tsx        # Appointment booking form modal
└── lib/
    ├── supabase.ts                 # Supabase anon client (public)
    ├── supabaseAdmin.ts            # Supabase service role client (server-only)
    └── rateLimit.ts                # In-memory IP-based rate limiter
```

---

## 4. Features

### 4.1 Chat

- Powered by an AI model via OpenRouter
- Responds in the same language the user writes in (Filipino, English, or Taglish)
- Cites specific Labor Code articles and laws in every response
- Generates 2–3 follow-up question chips after each answer
- Conversation history is persisted per browser session via Supabase (`chat_sessions` table)
- Users can copy any assistant message
- Users can rate responses (thumbs up / thumbs down)
- Users can export the full conversation as a `.txt` file
- Users can clear their conversation (also deletes records from Supabase)

### 4.2 Pay Calculator

An offline (no AI) calculator for three common computations:

| Calculator | Formula | Legal Basis |
|---|---|---|
| Overtime Pay | (Daily Rate ÷ 8) × multiplier × hours | Labor Code Art. 87 |
| 13th Month Pay | (Monthly Salary × Months Worked) ÷ 12 | PD 851 |
| Night Shift Differential | Hourly Rate × 10% × NSD hours | Labor Code Art. 86 |

Overtime multipliers:
- Regular day: **+25%** (×1.25)
- Rest day or holiday: **+30%** (×1.30)

### 4.3 Appointment Booking

Users can submit an appointment request through a modal form with the following fields:

| Field | Validation |
|---|---|
| Full Name | Minimum 2 characters |
| Contact Number | Philippine format: `09XXXXXXXXX` or `+639XXXXXXXXX` |
| Preferred Date | Must be a future weekday (Mon–Fri) |
| Concern | Minimum 10 characters |

Validation is applied on both the client (inline, on blur) and the server (API route). Submissions are saved to the `bookings` table in Supabase.

### 4.4 Topics Browser

A browsable index of common labor rights topics organized into five categories:

- Sahod at Benepisyo (Wages and Benefits)
- Leaves at Pahinga (Leaves and Rest)
- Dismissal at Kontrata (Dismissal and Contracts)
- Kontribusyon (SSS, PhilHealth, Pag-IBIG)
- Kasambahay (Domestic Workers)

Clicking any question sends it directly to the chat.

---

## 5. API Reference

### POST `/api/chat`

Sends a message to the AI and returns a response.

**Rate limit:** 10 requests per minute per IP.

**Request body:**
```json
{
  "messages": [
    { "role": "user", "content": "Magkano ang minimum wage?" }
  ]
}
```

**Response:**
```json
{
  "message": "Ang minimum wage sa NCR ay ₱695 bawat araw..."
}
```

**Error responses:**

| Status | Meaning |
|---|---|
| 400 | Invalid or missing `messages` array |
| 429 | Rate limit exceeded |
| 500 | AI provider error |

---

### POST `/api/bookings`

Submits an appointment booking request.

**Rate limit:** 3 requests per minute per IP.

**Request body:**
```json
{
  "name": "Juan dela Cruz",
  "contact": "09171234567",
  "preferredDate": "2026-05-15",
  "concern": "Hindi ako binibigyan ng 13th month pay ng employer ko."
}
```

**Response:**
```json
{ "success": true }
```

**Error response:**
```json
{ "error": "Error message here.", "field": "contact" }
```

The `field` property identifies which form field caused the error (`name`, `contact`, `date`, `concern`, or `general`).

---

### GET `/api/admin/bookings`

Returns all bookings. Requires admin password.

**Authorization:** `Bearer <ADMIN_PASSWORD>` header required.

**Response:**
```json
{
  "bookings": [
    {
      "id": "uuid",
      "name": "Juan dela Cruz",
      "contact": "09171234567",
      "preferred_date": "2026-05-15",
      "concern": "...",
      "status": "pending",
      "created_at": "2026-05-07T10:00:00Z"
    }
  ]
}
```

---

### PATCH `/api/admin/bookings/[id]`

Updates the status of a booking. Requires admin password.

**Authorization:** `Bearer <ADMIN_PASSWORD>` header required.

**Request body:**
```json
{ "status": "confirmed" }
```

Valid status values: `pending`, `confirmed`, `done`.

**Response:**
```json
{ "success": true }
```

---

## 6. Database Schema

### `bookings`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key, auto-generated |
| `name` | text | Full name of the applicant |
| `contact` | text | Philippine mobile number |
| `preferred_date` | text | Format: YYYY-MM-DD |
| `concern` | text | Description of the labor concern |
| `status` | text | `pending`, `confirmed`, or `done` |
| `created_at` | timestamptz | Auto-set on insert |

### `chat_sessions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key, auto-generated |
| `session_id` | text | UUID generated per browser session |
| `role` | text | `user` or `assistant` |
| `content` | text | Raw message content (includes `FOLLOW_UP:` line for assistant messages) |
| `created_at` | timestamptz | Auto-set on insert, used for ordering |

---

## 7. Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# OpenRouter API key for AI chat
OPENROUTER_API_KEY=your_openrouter_api_key

# Supabase project URL (public)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# Supabase anon key (public, safe for browser)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Supabase service role key (private, server-only — never expose to browser)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Admin dashboard password
ADMIN_PASSWORD=your_admin_password
```

> **Security note:** `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_PASSWORD` must never be prefixed with `NEXT_PUBLIC_`. They are only accessible server-side.

---

## 8. Labor Data Sources

All labor figures are injected into the AI system prompt. The AI is explicitly instructed to use these values instead of its own training data.

| Data Point | Value | Source |
|---|---|---|
| Minimum Wage (NCR, Non-Agriculture) | ₱695/day | Wage Order No. NCR-26, effective May 1, 2026 |
| Minimum Wage (NCR, Agriculture) | ₱695/day | Wage Order No. NCR-26 |
| Minimum Wage (Retail/Service, ≤15 workers) | ₱695/day | Wage Order No. NCR-26 |
| 13th Month Pay | 1/12 of annual basic salary | Presidential Decree 851 |
| Night Shift Differential | +10% for work 10PM–6AM | Labor Code Article 86 |
| Overtime — Regular Day | +25% | Labor Code Article 87 |
| Overtime — Rest Day / Holiday | +30% | Labor Code Article 87 |
| Regular Holiday Pay (not worked) | 100% of daily rate | Labor Code Article 94 |
| Regular Holiday Pay (worked) | 200% of daily rate | Labor Code Article 94 |
| Special Non-Working Holiday (worked) | +30% premium | Labor Code Article 94 |
| Service Incentive Leave | 5 paid days/year | Labor Code Article 95 |
| SSS Contribution Rate | 15% of MSC (EE: 5%, ER: 10%) | 2025 SSS schedule |
| SSS Monthly Salary Credit Range | ₱5,000 – ₱35,000 | 2025 SSS schedule |
| PhilHealth Contribution Rate | 5% of basic monthly salary | 2025 PhilHealth rate |
| PhilHealth Income Floor / Ceiling | ₱10,000 / ₱100,000 | 2025 PhilHealth rate |
| Pag-IBIG Contribution | 2% EE + 2% ER (min ₱200/mo) | 2025 HDMF schedule |

To update any figure, edit the `SYSTEM_PROMPT` constant in [app/api/chat/route.ts](app/api/chat/route.ts).

---

## 9. Rate Limiting

Rate limiting is implemented in [`lib/rateLimit.ts`](lib/rateLimit.ts) using an **in-memory store** (a `Map`) keyed by `IP:pathname`.

| Endpoint | Limit |
|---|---|
| `/api/chat` | 10 requests per 60 seconds |
| `/api/bookings` | 3 requests per 60 seconds |

The IP address is read from the `x-forwarded-for` header (first value) or `x-real-ip`. If neither is present, the key falls back to `"unknown"`.

**Important limitation:** Because the store is in-memory, rate limit counters reset whenever the server process restarts and are not shared across multiple server instances (e.g., in a horizontally scaled deployment). For production at scale, replace the `Map` with a Redis-backed solution.

---

## 10. Admin Dashboard

The admin dashboard is accessible at `/admin`.

### Login

Authentication is a simple password check. The entered password is sent as a `Bearer` token in the `Authorization` header of the GET request to `/api/admin/bookings`. If the password matches `ADMIN_PASSWORD`, the bookings are returned and the user is considered authenticated. The password is held only in component state — it is never stored in localStorage or cookies.

### Booking Management

- All bookings are listed in a table sorted by submission date (newest first)
- Bookings can be filtered by status: All, Pending, Confirmed, Done
- Status can be updated inline via a dropdown — changes are sent to `PATCH /api/admin/bookings/[id]` immediately
- If a status update fails, an error banner is shown at the top of the dashboard

### Logout

Clicking Logout clears the password and bookings from component state. No server-side session is invalidated (stateless auth).

---

## 11. Known Limitations

| Limitation | Details |
|---|---|
| In-memory rate limiter | Resets on server restart; not suitable for multi-instance deployments |
| Admin auth is stateless | Password is held in React state only; no session expiry or token revocation |
| AI response time | The free-tier AI model (`nvidia/nemotron-3-super-120b-a12b:free`) can be slow under load |
| No email notifications | Booking confirmation is on-screen only; staff must check the admin dashboard manually |
| Feedback not persisted | Thumbs up/down ratings are stored in React state only and lost on page refresh |
| Chat session scoped to browser tab | `sessionStorage` is used for the session ID, so each tab has a separate conversation |
