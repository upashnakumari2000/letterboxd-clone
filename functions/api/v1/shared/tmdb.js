import { jsonResponse } from './response.js';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function tmdbFetch(pathname, searchParams, env) {
  const apiKey = env.TMDB_API_KEY;
  if (!apiKey) return jsonResponse({ message: 'TMDB_API_KEY is not configured.' }, 500);

  const url = new URL(`${TMDB_BASE_URL}${pathname}`);
  Object.entries(searchParams || {}).forEach(([key, value]) => {
    if (value != null && value !== '') url.searchParams.set(key, String(value));
  });
  url.searchParams.set('api_key', apiKey);

  const response = await fetch(url.toString());
  const payload = await response.text();
  return new Response(payload, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'application/json; charset=utf-8',
    },
  });
}
