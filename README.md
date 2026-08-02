# NovaOS — Nova Summit 2027 Committee Progress Tracker

A role-based dashboard for committee members to log daily progress, and executives to track planning across departments.

## Tech Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase (Auth, Postgres, Storage)
- Vercel (deployment)

## Prerequisites

- Node.js 18+
- A Supabase project ([supabase.com](https://supabase.com))

## 1. Clone and install

\`\`\`bash
git clone https://github.com/YOUR_USERNAME/novaos.git
cd novaos-app
npm install
\`\`\`

## 2. Environment variables

Copy the example file and fill in your Supabase credentials (found under **Project Settings → API**):

\`\`\`bash
cp .env.example .env.local
\`\`\`

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
\`\`\`

## 3. Run database migrations

In the Supabase Dashboard → **SQL Editor**, run every file in \`/sql\` **in order**:

1. \`01_schema_rls_storage.sql\` — tables, RLS policies, task attachments bucket
2. \`02_update_trigger_email_fullname.sql\` — signup trigger tweak
3. Any later migrations added during development (report-attachments bucket, profile fields, avatars bucket — check the SQL blocks in project history if these aren't yet captured as numbered files)

## 4. Run locally

\`\`\`bash
npm run dev
\`\`\`

Visit [http://localhost:3000/auth/sign-up](http://localhost:3000/auth/sign-up) to create your first account.

**Note:** new signups default to \`team_member\` role. To promote a user to \`dept_head\` or \`executive\`, update it directly in Supabase:

\`\`\`sql
update public.profiles set role = 'executive' where id = 'user-uuid-here';
\`\`\`

## Roles

| Role | Access |
|---|---|
| \`team_member\` | Own assigned tasks only |
| \`dept_head\` | All tasks in their department |
| \`executive\` | Everything, all departments |

## Project structure

\`\`\`
app/
  (dashboard)/       # Authenticated app shell (sidebar, mobile nav)
    page.tsx          # Role-aware home (task list or stats)
    tasks/             # All/department/personal task list
    departments/        # Department index + drill-down
    profile/             # User profile + avatar
  auth/               # Login, signup, callback, confirm
components/
  tasks/              # Task table, report modal
  ui/                  # shadcn primitives
lib/
  supabase/            # Client/server Supabase instances
  types.ts, nav.ts, departments.ts
sql/                  # Database migrations, run in order
\`\`\`

## Deployment

See deployment steps in project notes — summary: push to GitHub, import into Vercel, set the two env vars above, then add your production URL to Supabase's **Auth → URL Configuration** (Site URL + Redirect URLs) or auth redirects will fail in production.

## Known limitations

- New signups can self-select any role including Executive — fine for internal testing, but should be gated (e.g. domain-restricted or admin-approved) before public launch.
- No column-level RLS — a team member's task update goes through the same policy path as a dept head's; enforcement of "only status can change" happens at the UI layer, not the database.
