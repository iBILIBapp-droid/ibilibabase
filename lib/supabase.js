import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

export function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Supabase storage constants for file operations
export const SB_URL_ORG1 = "https://gujzpqpcobwdsigxjcem.supabase.co";
export const SB_KEY_ORG1 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd1anpwcXBjb2J3ZHNpZ3hqY2VtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzNjMyMzMsImV4cCI6MjA4NzkzOTIzM30.3W1BtfXpXRcikt1bfOGwdFBQEVtT3xhrGbub-PyGQ6o";

export const SB_URL_ORG2 = "https://utpuzryjocromtvstxeb.supabase.co";
export const SB_KEY_ORG2 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0cHV6cnlqb2Nyb210dnN0eGViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3MTg1MTYsImV4cCI6MjA4ODI5NDUxNn0.G_km1SkeuexDBmfx0oC1l0dFLM95CCQrfvJrdRxYXkk";

export const SB_URL_ORG3 = "https://yapnbwxerwppsepcdcxi.supabase.co";
export const SB_KEY_ORG3 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhcG5id3hlcndwcHNlcGNkY3hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI1MjY2NDIsImV4cCI6MjA4ODEwMjY0Mn0.ROjaZEjyQ22-GHEussOo1Sr7VCAhoWnjO-42NCWtrxk";

export async function listPath(prefix, url = SB_URL_ORG1, key = SB_KEY_ORG1) {
  try {
    const res = await fetch(`${url}/storage/v1/object/list/archives`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prefix, limit: 200 }),
    });

    if (!res.ok) {
      console.error(`[listPath] ERROR ${res.status} for prefix "${prefix}"`);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error(`[listPath] Error for prefix "${prefix}":`, e);
    return [];
  }
}

export async function crawlAll(prefix, results = [], orgUrl = SB_URL_ORG1, orgKey = SB_KEY_ORG1) {
  const items = await listPath(prefix, orgUrl, orgKey);
  const folders = items.filter(i => !i.id && i.name !== '.emptyFolderPlaceholder');
  const files = items.filter(i => i.id && i.name !== '.emptyFolderPlaceholder' && i.name.match(/\.(pdf|doc|docx)$/i));

  for (const f of files) {
    results.push({
      name: f.name,
      fullPath: `${prefix}/${f.name}`,
      size: f.metadata?.size,
      orgUrl,
      orgKey
    });
  }

  // Crawl subfolders in parallel
  await Promise.all(folders.map(f => crawlAll(`${prefix}/${f.name}`, results, orgUrl, orgKey)));

  return results;
}

export function formatSize(bytes) {
  if (!bytes) return 'Document';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}
