# Marshall Family Care Portal

A starter care coordination portal for Marshall Family Care, built with Next.js App Router, Supabase authentication, and Vercel deployment in mind.

## Included

- Next.js App Router project structure
- Supabase browser and server client setup
- Supabase auth callback route
- Login, sign up, and sign out actions
- Protected dashboard layout
- Dashboard pages for overview, patients, appointments, messages, and settings
- Responsive CSS foundation
- Vercel project configuration
- Environment variable example file

## Local Setup

1. Install Node.js 20.9 or newer.
2. Install dependencies:

```bash
npm install
```

3. Copy the environment example:

```bash
cp .env.example .env.local
```

4. Add your Supabase values to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

5. Start the app:

```bash
npm run dev
```

6. Open `http://localhost:3000`.

## Supabase Setup

1. Create a new project in Supabase.
2. Go to Project Settings, then API.
3. Copy the Project URL into `NEXT_PUBLIC_SUPABASE_URL`.
4. Copy the anon public key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. In Authentication settings, add redirect URLs:

```text
http://localhost:3000/auth/callback
https://your-vercel-domain.vercel.app/auth/callback
```

6. Enable email authentication or any provider you want to support.

## Optional Profiles Table

The starter includes a TypeScript placeholder for a `profiles` table. You can create it in Supabase SQL Editor:

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text check (role in ('admin', 'caregiver', 'family', 'clinician')),
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
on public.profiles for select
using (auth.uid() = id);
```

## Vercel Deployment

1. Upload or push these files to GitHub.
2. Import the repository in Vercel.
3. Add these environment variables in Vercel Project Settings:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
```

4. Set `NEXT_PUBLIC_SITE_URL` to your Vercel production URL.
5. Deploy.

## Manual GitHub Upload

If you do not want to use git locally, create a new GitHub repository and upload the files and folders from this workspace. Keep `.env.local` private and upload `.env.example` instead.

## Suggested Next Steps

- Connect dashboard pages to real Supabase tables.
- Add role-based access rules for staff, caregivers, and family members.
- Add patient intake forms and appointment creation actions.
- Add row level security policies before storing sensitive care information.
