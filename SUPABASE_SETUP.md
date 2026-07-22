# Supabase setup

The gauge journal stores data in a hosted Supabase (Postgres) database so it
syncs across any browser or device you sign in from. One-time setup:

## 1. Create a project

1. Go to <https://supabase.com>, sign up (free tier is plenty), and create a new
   project. Pick any name/region; save the database password somewhere.
2. Wait for the project to finish provisioning (~1 min).

## 2. Create the table + security policies

In the Supabase dashboard, open **SQL Editor** → **New query**, paste this, and
run it:

```sql
-- One row per gauge swatch; the full Swatch object lives in `data` (jsonb).
create table if not exists public.swatches (
  id text primary key,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz,
  data jsonb not null
);

-- Row-Level Security: each user can only see/edit their own rows.
alter table public.swatches enable row level security;

create policy "own swatches - select" on public.swatches
  for select using (user_id = auth.uid());
create policy "own swatches - insert" on public.swatches
  for insert with check (user_id = auth.uid());
create policy "own swatches - update" on public.swatches
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own swatches - delete" on public.swatches
  for delete using (user_id = auth.uid());
```

## 3. Make sign-up frictionless (optional but recommended)

**Authentication** → **Sign In / Providers** → **Email**: turn **off**
"Confirm email". Then signing up logs you straight in (no email round-trip).
Leave it on if you prefer email confirmation.

## 4. Add your credentials to the app

**Project Settings** → **API**. Copy the **Project URL** and the **anon public**
key. Create a file named `.env.local` in the project root (it is gitignored):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Restart the dev server (`npm run dev`) so Vite picks up the new env vars.

## 5. Sign in and import your data

1. Open the app — you'll see a sign-in screen. Create an account.
2. If you exported a JSON backup from another browser, click **Import JSON** to
   load it into your account.

The **anon key is safe to keep in the client** — Row-Level Security is what
protects the data, and each account only ever sees its own swatches.
