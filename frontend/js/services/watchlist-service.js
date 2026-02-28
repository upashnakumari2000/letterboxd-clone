import { state, saveState, navigate, syncStateForActiveUser } from '../app/state.js';
import { getSupabaseClient, hasSupabaseConfig } from './supabase-service.js';
import { apiFetch, hydrateWatchlistForSignedInUser } from './api-client.js';
import { createMovieReview, deleteMovieReview, updateMovieReview } from './reviews-service.js';
import { validateReviewPayload } from '../utils/validation.js';
import { parseRoute } from '../app/router.js';
import { renderNav } from '../components/navbar.js';
import { openAuthModal, handleAuthSubmit } from '../pages/auth-page.js';
import { closeModal } from '../components/modal.js';
import { hideDropdown } from '../components/live-search.js';

function mapSupabaseError(error, fallback = 'Request failed') {
  if (!error) return fallback;
  return error.message || error.error_description || fallback;
}

export async function handleWatchlistPath(path, options = {}) {
  const supabase = await getSupabaseClient();
  const username = state.currentUser?.username;
  if (!username) throw new Error('Sign in required.');

  if (path === '/watchlist' && (!options.method || options.method === 'GET')) {
    const { data, error } = await supabase
      .from('watchlist_items')
      .select('movie_id, created_at')
      .eq('username', username)
      .order('created_at', { ascending: false });
    if (error) throw new Error(mapSupabaseError(error));
    return { items: (data || []).map((row) => ({ movieId: String(row.movie_id), createdAt: row.created_at })) };
  }

  if (path === '/watchlist' && options.method === 'POST') {
    const body = JSON.parse(options.body || '{}');
    const movieId = String(body.movieId || '').trim();
    const { error } = await supabase
      .from('watchlist_items')
      .upsert({ username, movie_id: movieId }, { onConflict: 'username,movie_id' });
    if (error) throw new Error(mapSupabaseError(error));
    return { item: { movieId } };
  }

  if (path.startsWith('/watchlist/') && options.method === 'DELETE') {
    const movieId = decodeURIComponent(path.split('/').pop() || '');
    const { error } = await supabase
      .from('watchlist_items')
      .delete()
      .eq('username', username)
      .eq('movie_id', movieId);
    if (error) throw new Error(mapSupabaseError(error));
    return { item: { movieId } };
  }

  throw new Error('Not Found');
}

function toggleLocalWatchlist(filmId) {
  state.watchlist = state.watchlist.includes(filmId)
    ? state.watchlist.filter((id) => id !== filmId)
    : [...state.watchlist, filmId];
}

async function toggleWatchlist(filmId) {
  if (!state.currentUser || !state.token) {
    toggleLocalWatchlist(filmId);
    saveState();
    return;
  }

  const isTracked = state.watchlist.includes(filmId);
  if (isTracked) {
    await apiFetch(`/watchlist/${encodeURIComponent(filmId)}`, { method: 'DELETE' });
    state.watchlist = state.watchlist.filter((id) => id !== filmId);
  } else {
    await apiFetch('/watchlist', { method: 'POST', body: JSON.stringify({ movieId: filmId }) });
    if (!state.watchlist.includes(filmId)) state.watchlist = [...state.watchlist, filmId];
  }
  saveState();
}

function setReviewMessage(message, isError = false) {
  const node = document.getElementById('review-message');
  if (!node) return;
  node.textContent = message;
  node.style.color = isError ? 'var(--danger)' : 'var(--accent)';
}

function syncReviewStarRating(container, nextRating) {
  if (!(container instanceof HTMLElement)) return;
  const hiddenInput = container.querySelector('input[name="rating"]');
  if (!(hiddenInput instanceof HTMLInputElement)) return;
  hiddenInput.value = String(nextRating);
  const stars = container.querySelectorAll('[data-rating-value]');
  stars.forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const starValue = Number(node.dataset.ratingValue);
    const isActive = Number.isFinite(starValue) && starValue <= nextRating;
    node.classList.toggle('active', isActive);
    node.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

export function bindEvents(app, nav) {
  document.addEventListener('click', async (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;

    // auth modal triggers from navbar
    if (t.dataset.action === 'open-signin') {
      openAuthModal('signin', nav);
      return;
    }
    if (t.dataset.action === 'open-signup') {
      openAuthModal('signup', nav);
      return;
    }

    // auth switch inside modal (signin ↔ signup)
    if (t.dataset.authSwitch) {
      const mc = document.querySelector('.modal-content');
      if (mc) {
        const { authFormHtml } = await import('../pages/auth-page.js');
        // re-render modal with switched type — handled inside auth-page openAuthModal
        openAuthModal(t.dataset.authSwitch, nav);
      }
      return;
    }

    if (t.dataset.action === 'toggle-watchlist') {
      const filmId = String(t.dataset.film || '').trim();
      if (!filmId) return;
      try { await toggleWatchlist(filmId); } catch { }
      renderNav(nav);
      parseRoute(app);
    }

    if (t.dataset.action === 'set-review-rating') {
      const value = Number(t.dataset.ratingValue);
      const container = t.closest('.star-rating');
      if (!Number.isFinite(value) || !container) return;
      syncReviewStarRating(container, value);
    }

    if (t.dataset.action === 'toggle-review-edit') {
      const reviewId = String(t.dataset.reviewId || '').trim();
      if (!reviewId) return;
      const form = document.getElementById(`edit-review-${reviewId}`);
      if (form) form.hidden = !form.hidden;
    }

    if (t.dataset.action === 'delete-review') {
      const movieId = String(t.dataset.movieId || '').trim();
      const reviewId = String(t.dataset.reviewId || '').trim();
      if (!movieId || !reviewId) return;
      try {
        await deleteMovieReview(movieId, reviewId);
        setReviewMessage('Review deleted.');
      } catch (err) {
        setReviewMessage(err.message, true);
      }
      parseRoute(app);
    }

    if (t.dataset.action === 'signout') {
      if (hasSupabaseConfig()) {
        try { const supabase = await getSupabaseClient(); await supabase.auth.signOut(); } catch { }
      }
      state.currentUser = null;
      state.token = null;
      syncStateForActiveUser();
      saveState();
      renderNav(nav);
      navigate('/');
    }
  });

  document.addEventListener('submit', async (e) => {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;

    if (form.id === 'discover-form') {
      e.preventDefault();
      const fd = new FormData(form);
      const q = String(fd.get('q') || '').trim();
      hideDropdown();
      navigate(`/films/${encodeURIComponent(q)}`);
    }

    if (form.id === 'auth-form') {
      e.preventDefault();
      await handleAuthSubmit(form, nav);
    }

    if (form.id === 'movie-review-form') {
      e.preventDefault();
      const fd = new FormData(form);
      const movieId = String(fd.get('movieId') || '').trim();
      try {
        const payload = validateReviewPayload({ rating: fd.get('rating'), text: fd.get('text'), watchedOn: fd.get('watchedOn') });
        await createMovieReview(movieId, payload);
        setReviewMessage('Review posted successfully.');
        parseRoute(app);
      } catch (err) {
        setReviewMessage(err.message, true);
      }
    }

    if (form.hasAttribute('data-review-edit-form')) {
      e.preventDefault();
      const fd = new FormData(form);
      const movieId = String(fd.get('movieId') || '').trim();
      const reviewId = String(fd.get('reviewId') || '').trim();
      try {
        const payload = validateReviewPayload({ rating: fd.get('rating'), text: fd.get('text'), watchedOn: fd.get('watchedOn') });
        await updateMovieReview(movieId, reviewId, payload);
        setReviewMessage('Review updated successfully.');
        parseRoute(app);
      } catch (err) {
        setReviewMessage(err.message, true);
      }
    }
  });

  window.addEventListener('hashchange', () => {
    hideDropdown();
    renderNav(nav);
    parseRoute(app);
    document.getElementById('main-content')?.focus();
  });
}
