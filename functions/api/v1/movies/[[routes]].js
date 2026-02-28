/**
 * Compatibility catch-all router for /api/v1/movies/*
 * Routes to the correct handler based on the path segment.
 */
import { onRequestGet as trendingHandler } from './trending.js';
import { onRequestGet as searchHandler } from './search.js';
import { tmdbFetch } from '../shared/tmdb.js';
import { jsonResponse } from '../shared/response.js';

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const routeParam = params.routes ?? params.route;
  const route = Array.isArray(routeParam) ? routeParam : routeParam ? [routeParam] : [];

  if (route.length === 1 && route[0] === 'trending') return trendingHandler(context);
  if (route.length === 1 && route[0] === 'search') return searchHandler(context);

  if (route.length === 1 && /^\d+$/.test(route[0])) {
    return tmdbFetch(
      `/movie/${route[0]}`,
      { append_to_response: 'credits,release_dates,watch/providers' },
      env,
    );
  }

  return jsonResponse({ message: 'Not Found' }, 404);
}
