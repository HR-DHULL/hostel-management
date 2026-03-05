# Hostel & Fee Management Dashboard

A React + Supabase dashboard for coaching institute hostel management.

## Project Structure

```
hostel-app/
├── index.html          ← Entry HTML
├── package.json        ← Dependencies
├── vite.config.js      ← Build config
├── vercel.json         ← Vercel routing
└── src/
    ├── main.jsx        ← React entry point
    └── App.jsx         ← Main dashboard (your app)
```

## How to Deploy on Vercel

### Step 1 — Upload to GitHub
1. Go to github.com → New repository → name it `hostel-dashboard`
2. Upload ALL files in this folder (keep the folder structure!)
3. Commit changes

### Step 2 — Deploy on Vercel
1. Go to vercel.com → Add New Project
2. Import your `hostel-dashboard` GitHub repo
3. Vercel will auto-detect it as a Vite project
4. Click **Deploy** — no extra settings needed!

### Step 3 — First Run
When you open the live URL, you'll see a SQL setup screen.
Run the SQL shown in Supabase → SQL Editor, then click Retry.

## Tech Stack
- React 18 + Vite
- Supabase (PostgreSQL database)
- No extra libraries needed
