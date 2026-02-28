import { tmdbFetch } from '../shared/tmdb.js';
import { jsonResponse } from '../shared/response.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const query = new URL(request.url).searchParams.get('q') || '';
  if (!query.trim()) return jsonResponse({ message: 'Missing search query: q' }, 400);

  const [movieResponse, personResponse] = await Promise.all([
    tmdbFetch('/search/movie', { query, include_adult: 'false' }, env),
    tmdbFetch('/search/person', { query, include_adult: 'false' }, env),
  ]);

  const moviePayload = await movieResponse.json();
  const personPayload = await personResponse.json();

  if (!movieResponse.ok) return jsonResponse(moviePayload, movieResponse.status);
  if (!personResponse.ok) return jsonResponse(personPayload, personResponse.status);

  const byId = new Map();
  const add = (movie) => {
    if (!movie?.id || byId.has(movie.id)) return;
    byId.set(movie.id, movie);
  };

  (moviePayload.results || []).forEach(add);
  (personPayload.results || [])
    .flatMap((person) => (Array.isArray(person.known_for) ? person.known_for : []))
    .filter((item) => item.media_type === 'movie' || item.title)
    .forEach(add);

  return jsonResponse({ ...moviePayload, results: [...byId.values()] });
}
