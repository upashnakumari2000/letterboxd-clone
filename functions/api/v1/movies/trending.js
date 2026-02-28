import { tmdbFetch } from '../shared/tmdb.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const page = new URL(request.url).searchParams.get('page') || '1';
  return tmdbFetch('/trending/movie/week', { page }, env);
}
