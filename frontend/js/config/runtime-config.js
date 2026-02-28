function normalizeApiBase(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.replace(/\/+$/, '');
}

export function getRuntimeApiBase() {
  const globalBase = normalizeApiBase(window.__API_BASE__);
  if (globalBase) return globalBase;

  const metaBase = normalizeApiBase(
    document.querySelector('meta[name="api-base"]')?.getAttribute('content'),
  );
  if (metaBase) return metaBase;

  return '/api/v1';
}

export function getRuntimeSupabaseUrl() {
  const global = (window.SUPABASE_URL || '').trim();
  if (global) return global;
  return (document.querySelector('meta[name="supabase-url"]')?.getAttribute('content') || '').trim();
}

export function getRuntimeSupabaseAnonKey() {
  const global = (window.SUPABASE_ANON_KEY || '').trim();
  if (global) return global;
  return (document.querySelector('meta[name="supabase-anon-key"]')?.getAttribute('content') || '').trim();
}
