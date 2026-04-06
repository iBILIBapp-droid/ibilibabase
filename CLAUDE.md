# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # Install dependencies
npm run dev        # Start development server (http://localhost:3000)
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
```

## Architecture Overview

**Stack**: Next.js 16 (App Router), React 19, Supabase Auth/Storage, Groq API (Llama 3.3)

**Structure**:
- `app/` - App Router pages and API routes
  - `page.js` - Login/auth page (client-side)
  - `student/page.js` - Student portal (SSR, client-side navigation)
  - `teacher/page.js` - Teacher portal (SSR, role-gated)
  - `about/page.js` - Static about page (SSG)
  - `api/chat/route.js` - BILIBot AI proxy (hides Groq API key)
- `components/` - Shared UI components (`AuthBar.js` for session management)
- `lib/` - Supabase client and storage utilities
  - Three Supabase organizations for file storage (ORG1, ORG2, ORG3)
  - `crawlAll()` recursively lists files across orgs
  - `listPath()` lists files in a specific path

**Auth Flow**: Login page authenticates via Supabase, redirects based on user metadata role (`student`/`teacher`). Student/teacher pages check role and deny access if mismatch.

**File Storage**: Files stored in Supabase Storage buckets under `archives/` with prefixes: `research/`, `materials/`, `prompts/`. Student page crawls all three orgs to aggregate files.

**Environment Variables** (see `.env.local.example`):
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` - Auth and storage
- `GROQ_API_KEY` - BILIBot AI chat

**Styling**: `styled-jsx` for component-scoped CSS. Global styles in `app/globals.css`.
