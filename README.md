# iBilib — Digital Archive (Next.js)

The iBilib digital archive platform, now rebuilt with Next.js for improved performance, SEO, and server-side rendering.

## Features

- **Server-Side Rendering (SSR)**: Dynamic pages for student and teacher portals
- **Static Site Generation (SSG)**: SEO-optimized pages like About
- **API Routes**: Serverless functions for BILIBot AI chat
- **Supabase Integration**: Authentication and storage
- **Responsive Design**: Mobile-first UI

## Pages

| Page | Route | Rendering | Description |
|------|-------|-----------|-------------|
| Login | `/` | Client-side | Authentication with Supabase |
| Student Portal | `/student` | SSR | Student resource browser |
| Teacher Portal | `/teacher` | SSR | Teacher dashboard |
| About | `/about` | SSG | SEO-optimized info page |
| Chat API | `/api/chat` | API | BILIBot AI proxy |

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

3. Update environment variables in `.env.local`:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   GROQ_API_KEY=your_groq_api_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
ibilibabase-main/
├── app/
│   ├── layout.js          # Root layout with fonts
│   ├── page.js            # Login page
│   ├── globals.css        # Global styles
│   ├── student/
│   │   └── page.js        # Student portal (SSR)
│   ├── teacher/
│   │   └── page.js        # Teacher portal (SSR)
│   ├── about/
│   │   └── page.js        # About page (SSG)
│   └── api/
│       └── chat/
│           └── route.js   # BILIBot API
├── components/
│   └── AuthBar.js         # Auth component
├── lib/
│   └── supabase.js        # Supabase utilities
├── public/
│   └── ibilib/image/      # Static assets
└── next.config.js         # Next.js config
```

## Technology Stack

- **Framework**: Next.js 14+ (App Router)
- **React**: 19
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (3 organizations)
- **AI**: Groq API (Llama 3.3)
- **Styling**: CSS-in-JS (styled-jsx)
- **Deployment**: Vercel-ready

## Migration Notes

This Next.js version replaces the original vanilla HTML/JS implementation. Key changes:

1. **Routing**: File-based routing with App Router
2. **Auth**: Integrated Supabase client with protected routes
3. **API**: Server-side proxy for Groq API (hides API keys)
4. **SEO**: Meta tags and Open Graph for better search visibility
5. **Performance**: Automatic code splitting and optimization

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `GROQ_API_KEY` | Groq API key for BILIBot |

## License

ISC
