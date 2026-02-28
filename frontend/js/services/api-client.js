import { API_BASE, state, saveState, syncStateForActiveUser } from '../app/state.js';
import { getSupabaseClient, hasSupabaseConfig } from './supabase-service.js';
import { handleAuthPath } from './reviews-service.js';
import { handleWatchlistPath } from './watchlist-service.js';
import { handleReviewsPath } from './reviews-service.js';

export async function apiFetch(path, options = {}) {
  const cleanPath = String(path || '').trim();
  const method = (options.method || 'GET').toUpperCase();

  if (
    hasSupabaseConfig() &&
    (cleanPath.startsWith('/auth/') ||
      cleanPath.startsWith('/watchlist') ||
      cleanPath.includes('/reviews') ||
      cleanPath.startsWith('/users/'))
  ) {
    if (cleanPath.startsWith('/auth/')) return handleAuthPath(cleanPath, { ...options, method });
    if (cleanPath.startsWith('/watchlist')) return handleWatchlistPath(cleanPath, { ...options, method });
    return handleReviewsPath(cleanPath, { ...options, method });
  }

  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  const response = await fetch(`${API_BASE}${path}`, { ...options, method, headers });
  const contentType = (response.headers.get('Content-Type') || '').toLowerCase();
  if (!contentType.includes('application/json')) {
    throw new Error('API returned a non-JSON response. Check API_BASE and backend server.');
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'Request failed');
  return payload;
}

export async function bootstrapAuth() {
  if (!state.token) {
    if (state.currentUser) state.currentUser = null;
    syncStateForActiveUser();
    saveState();
    return;
  }

  try {
    const payload = await apiFetch('/auth/me');
    const previousUsername = state.currentUser?.username || null;
    state.currentUser = payload.user;
    if (previousUsername !== state.currentUser?.username) syncStateForActiveUser();
    await hydrateWatchlistForSignedInUser();
    saveState();
  } catch {
    state.currentUser = null;
    state.token = null;
    syncStateForActiveUser();
    saveState();
  }
}

export async function hydrateWatchlistForSignedInUser() {
  if (!state.currentUser || !state.token) return;

  const payload = await apiFetch('/watchlist');
  state.watchlist = Array.isArray(payload.items)
    ? payload.items.map((item) => String(item.movieId)).filter(Boolean)
    : [];
}
