# Grace & Growth

Spiritual accountability app for two friends. Built with React + Vite + Supabase, deployed on Netlify.

## Setup

### 1. Supabase
1. Create a project at supabase.com
2. Go to **Database > SQL Editor**, paste the contents of `supabase-schema.sql` and run it
3. Go to **Project Settings > API** and copy your `Project URL` and `anon public` key

### 2. Environment variables

**Local development** — create a `.env` file in the project root:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Netlify** — go to Site > Site configuration > Environment variables and add the same two keys.

### 3. Local development
```bash
npm install
npm run dev
```

### 4. Deploy
```bash
git add .
git commit -m "your message"
git push
```
Netlify auto-deploys on every push. Build command: `npm run build`. Publish directory: `dist`.

## How it works

- Both users sign up with their own email and password
- All data is stored in Supabase — syncs across any device
- The "Friend" tab automatically shows your partner's progress once they sign up
- Row-level security means each user can only write their own data, but read each other's for the partner view
