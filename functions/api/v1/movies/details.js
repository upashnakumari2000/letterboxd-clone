import { tmdbFetch } from '../shared/tmdb.js';
import { jsonResponse } from '../shared/response.js';

export async function onRequestGet(context) {
  const { params } = context;
  const movieId = params.id;
  if (!movieId || !/^\d+$/.test(movieId)) return jsonResponse({ message: 'Invalid movie ID' }, 400);
  return tmdbFetch(`/movie/${movieId}`, { append_to_response: 'credits,release_dates,watch/providers' }, context.env);
}
