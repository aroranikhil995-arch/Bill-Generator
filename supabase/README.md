# Supabase Setup — Barista Cafe Bill Generator

## 1 — Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Click **New Project**, name it `barista-cafe`, select your region, and set a strong database password.

## 2 — Run the Migration

1. Open the **SQL Editor** in your Supabase dashboard.
2. Copy the contents of `migrations/001_create_bills.sql` and run them.
3. Verify the `bills` and `bill_items` tables appear in **Table Editor**.

## 3 — Grab Your API Keys

Go to **Project Settings → API** and copy:

| Variable | Where to paste |
|---|---|
| `Project URL` | `.env` files in both `barista-web` and `barista-app` |
| `anon / public key` | Same `.env` files |

## 4 — Test the API

```bash
curl "https://<your-project-ref>.supabase.co/rest/v1/bills" \
  -H "apikey: <your-anon-key>" \
  -H "Authorization: Bearer <your-anon-key>"
```

Expected: `[]` (empty array, no bills yet).

## 5 — Test Bill ID Generation

```sql
select next_bill_id();
-- returns: BRST10001
select next_bill_id();
-- returns: BRST10002
```
