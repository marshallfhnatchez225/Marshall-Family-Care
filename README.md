# Marshall Family Care Portal

A starter care coordination portal for Marshall Family Care, built with Next.js App Router, Supabase authentication, and Vercel deployment in mind.

## Included

- Next.js App Router project structure
- Supabase browser and server client setup
- Supabase auth callback route
- Login and sign out actions
- Staff-only family account creation
- Protected dashboard layout
- Dashboard pages for overview, families, services, messages, family access, and settings
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
SUPABASE_SERVICE_ROLE_KEY=your-server-only-service-role-key
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

6. Enable email authentication.
7. Disable public sign-ups in Supabase Auth settings. Family accounts should be created by staff from inside the portal.
8. Copy the service role key from Project Settings, then API. Add it to `SUPABASE_SERVICE_ROLE_KEY` only in `.env.local` and Vercel environment variables. Never expose or commit this key.

## Optional Profiles Table

The starter includes a TypeScript placeholder for a `profiles` table. You can create it in Supabase SQL Editor:

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text check (role in ('admin', 'staff', 'service_director', 'family')),
  created_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "Users can read their own profile"
on public.profiles for select
using (auth.uid() = id);
```

## Creating the First Staff Account

Because family sign-up is intentionally closed, create the first staff user from the Supabase dashboard:

1. Go to Authentication, then Users.
2. Add a staff user with an email and temporary password.
3. Copy the new user ID.
4. Add a matching row in the `profiles` table:

```sql
insert into public.profiles (id, full_name, role)
values ('USER_ID_FROM_AUTH', 'Staff Name', 'admin');
```

That staff user can then sign in and use Dashboard, then Family Access to create family credentials.

## Vercel Deployment

1. Upload or push these files to GitHub.
2. Import the repository in Vercel.
3. Add these environment variables in Vercel Project Settings:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_SITE_URL
SUPABASE_SERVICE_ROLE_KEY
```

4. Set `NEXT_PUBLIC_SITE_URL` to your Vercel production URL.
5. Deploy.

## Manual GitHub Upload

If you do not want to use git locally, create a new GitHub repository and upload the files and folders from this workspace. Keep `.env.local` private and upload `.env.example` instead.

## Suggested Next Steps

- Connect dashboard pages to real Supabase tables.
- Add arrangement-to-family assignment tables so family members only see their approved loved one's details.
- Add arrangement forms and service scheduling actions.
- Add row level security policies before storing sensitive care information.
