import { tmdbFetch } from '../shared/tmdb.js';
import { jsonResponse } from '../shared/response.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const genreId = url.searchParams.get('id');
  const page = url.searchParams.get('page') || '1';

  if (!genreId) return jsonResponse({ message: 'Missing genre id' }, 400);

  return tmdbFetch('/discover/movie', {
    with_genres: genreId,
    sort_by: 'popularity.desc',
    page,
    include_adult: 'false',
  }, env);
}
