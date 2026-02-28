import { state } from '../app/state.js';
import { getSupabaseClient } from './supabase-service.js';

export const MOVIE_REVIEWS_LIMIT = 50;
export const PROFILE_REVIEWS_LIMIT = 10;

function mapSupabaseError(error, fallback = 'Request failed') {
  if (!error) return fallback;
  return error.message || error.error_description || fallback;
}

function requireSignedInUser() {
  if (!state.currentUser?.username) throw new Error('Sign in required.');
  return state.currentUser.username;
}

function mapReviewRow(row) {
  return {
    id: row.id,
    username: row.username,
    movieId: String(row.movie_id),
    rating: Number(row.rating),
    text: row.text,
    watchedOn: row.watched_on,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function handleAuthPath(path, options = {}) {
  const supabase = await getSupabaseClient();

  if (path === '/auth/signup' && options.method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');

    const { data, error } = await supabase.auth.signUp({
      email: `${username}@letterboxdclone.local`,
      password,
      options: { data: { username } },
    });

    if (error) throw new Error(mapSupabaseError(error));
    if (data.user?.id) {
      await supabase.from('profiles').upsert({ id: data.user.id, username }, { onConflict: 'id' });
    }
    return { message: 'Account created.' };
  }

  if (path === '/auth/signin' && options.method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const username = String(body.username || '').trim().toLowerCase();
    const password = String(body.password || '');
    const email = `${username}@letterboxdclone.local`;

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(mapSupabaseError(error));

    state.token = data.session?.access_token || null;
    return {
      token: state.token,
      user: { username: data.user?.user_metadata?.username || username },
    };
  }

  if (path === '/auth/me') {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw new Error('Session expired.');
    return { user: { username: data.user.user_metadata?.username || String(data.user.email || '').split('@')[0] } };
  }

  throw new Error('Not Found');
}

export async function handleReviewsPath(path, options = {}) {
  const supabase = await getSupabaseClient();

  const movieMatch = path.match(/^\/movies\/([^/]+)\/reviews(?:\/([^/]+))?$/);
  if (movieMatch) {
    const movieId = decodeURIComponent(movieMatch[1]);
    const reviewId = movieMatch[2] ? decodeURIComponent(movieMatch[2]) : null;

    if ((!options.method || options.method === 'GET') && !reviewId) {
      const { data, error } = await supabase
        .from('reviews')
        .select('id, username, movie_id, rating, text, watched_on, created_at, updated_at')
        .eq('movie_id', movieId)
        .order('created_at', { ascending: false })
        .limit(MOVIE_REVIEWS_LIMIT);
      if (error) throw new Error(mapSupabaseError(error));
      return { items: (data || []).map(mapReviewRow) };
    }

    if (options.method === 'POST') {
      const username = requireSignedInUser();
      const body = JSON.parse(options.body || '{}');
      const { data, error } = await supabase
        .from('reviews')
        .insert({ username, movie_id: movieId, rating: body.rating, text: body.text, watched_on: body.watchedOn || null })
        .select('id, username, movie_id, rating, text, watched_on, created_at, updated_at')
        .single();
      if (error) throw new Error(mapSupabaseError(error));
      return { item: mapReviewRow(data) };
    }

    if (options.method === 'PATCH' && reviewId) {
      const username = requireSignedInUser();
      const body = JSON.parse(options.body || '{}');
      const { data, error } = await supabase
        .from('reviews')
        .update({ rating: body.rating, text: body.text, watched_on: body.watchedOn || null })
        .eq('id', reviewId)
        .eq('username', username)
        .select('id, username, movie_id, rating, text, watched_on, created_at, updated_at')
        .single();
      if (error) throw new Error(mapSupabaseError(error));
      return { item: mapReviewRow(data) };
    }

    if (options.method === 'DELETE' && reviewId) {
      const username = requireSignedInUser();
      const { error } = await supabase.from('reviews').delete().eq('id', reviewId).eq('username', username);
      if (error) throw new Error(mapSupabaseError(error));
      return { item: { id: reviewId } };
    }
  }

  const userReviewMatch = path.match(/^\/users\/([^/]+)\/reviews$/);
  if (userReviewMatch) {
    const username = decodeURIComponent(userReviewMatch[1]).toLowerCase();
    const { data, error } = await supabase
      .from('reviews')
      .select('id, username, movie_id, rating, text, watched_on, created_at, updated_at')
      .eq('username', username)
      .order('created_at', { ascending: false })
      .limit(PROFILE_REVIEWS_LIMIT);
    if (error) throw new Error(mapSupabaseError(error));
    return { items: (data || []).map(mapReviewRow) };
  }

  throw new Error('Not Found');
}

export async function fetchMovieReviews(movieId) {
  const { apiFetch } = await import('./api-client.js');
  const payload = await apiFetch(`/movies/${encodeURIComponent(movieId)}/reviews`);
  return { reviews: Array.isArray(payload.reviews) ? payload.reviews : (payload.items || []) };
}

export async function fetchUserReviews(username) {
  const { apiFetch } = await import('./api-client.js');
  const payload = await apiFetch(`/users/${encodeURIComponent(username)}/reviews`);
  return { reviews: Array.isArray(payload.reviews) ? payload.reviews : (payload.items || []) };
}

export async function createMovieReview(movieId, payload) {
  const { apiFetch } = await import('./api-client.js');
  return apiFetch(`/movies/${encodeURIComponent(movieId)}/reviews`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateMovieReview(movieId, reviewId, payload) {
  const { apiFetch } = await import('./api-client.js');
  return apiFetch(`/movies/${encodeURIComponent(movieId)}/reviews/${encodeURIComponent(reviewId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteMovieReview(movieId, reviewId) {
  const { apiFetch } = await import('./api-client.js');
  return apiFetch(`/movies/${encodeURIComponent(movieId)}/reviews/${encodeURIComponent(reviewId)}`, {
    method: 'DELETE',
  });
}
