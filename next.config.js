/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for SSG pages
  output: 'standalone',

  // Allow images from Supabase
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
    unoptimized: true,
  },

  // Environment variables
  env: {
    SUPABASE_URL: process.env.SUPABASE_URL || 'https://yapnbwxerwppsepcdcxi.supabase.co',
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhcG5id3hlcndwcHNlcGNkY3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MjY2NDIsImV4cCI6MjA4ODEwMjY0Mn0.ROjaZEjyQ22-GHEussOo1Sr7VCAhoWnjO-42NCWtrxk',
    GROQ_API_KEY: process.env.GROQ_API_KEY,
  },
};

export default nextConfig;
