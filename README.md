# Smart QR-Based Bill Generator — Barista Cafe

> A full-stack billing system: React Native staff app → Supabase backend → Next.js customer web page.

---

## Monorepo Structure

```
Bill-Generator/
├── supabase/
│   ├── migrations/
│   │   └── 001_create_bills.sql   ← Run this in Supabase SQL Editor
│   └── README.md                  ← Supabase setup guide
│
├── barista-web/                   ← Next.js (Vercel)
│   ├── app/
│   │   ├── bill/[billId]/         ← Dynamic bill page (/bill/BRST10001)
│   │   └── layout.tsx
│   ├── components/                ← BillCard, ActionButtons, BillSkeleton, BillNotFound
│   ├── lib/supabase.ts            ← Supabase client + fetchBill()
│   └── .env.local.example         ← Copy → .env.local and add keys
│
└── barista-app/                   ← React Native CLI
    ├── App.tsx                    ← Entry point
    └── src/
        ├── screens/               ← MenuSelection, BillPreview, PrintSuccess
        ├── components/            ← TaxSummaryBar
        ├── store/cartStore.ts     ← Zustand live cart + tax
        ├── services/supabase.ts   ← generateBillId(), saveBill()
        ├── navigation/            ← React Navigation stack
        └── theme/colors.ts        ← Shared brand tokens
```

---

## Quick Start

### Step 1 — Supabase Backend
1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/migrations/001_create_bills.sql` in the SQL Editor
3. Copy your **Project URL** and **anon key**

### Step 2 — Web Page (Vercel)
```bash
cd barista-web
cp .env.local.example .env.local     # Fill in Supabase credentials
npm run dev                           # Local dev → http://localhost:3000
```
**Deploy:** Push to GitHub → import project in [vercel.com](https://vercel.com) → add env vars.

### Step 3 — React Native App
```bash
cd barista-app
# Edit src/services/supabase.ts   → add your Supabase URL + anon key
# Edit src/screens/BillPreviewScreen.tsx → set WEB_BASE_URL to your Vercel URL
npm install
npx react-native run-android
```
See `barista-app/README.md` for iOS and Bluetooth printer setup.

---

## System Flow

```
Staff selects items (live GST visible)
  → Generate Bill → Bill Preview
    → Save to Supabase → Bill ID generated → QR rendered
      → Print via Bluetooth (ESC/POS + QR image)
        → Customer scans QR
          → barista-web/bill/[billId] loads → Print / Download PDF / Share
```

---

## Credentials to Configure

| File | Variable | Value |
|---|---|---|
| `barista-web/.env.local` | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `barista-web/.env.local` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `barista-app/src/services/supabase.ts` | `SUPABASE_URL` / `SUPABASE_ANON` | Same values |
| `barista-app/src/screens/BillPreviewScreen.tsx` | `WEB_BASE_URL` | Vercel deployment URL |
