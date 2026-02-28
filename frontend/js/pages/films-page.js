import { apiFetch } from '../services/api-client.js';
import { fetchUserReviews, PROFILE_REVIEWS_LIMIT } from '../services/reviews-service.js';
import { normalizeTmdbFilm } from '../services/movies-service.js';
import { state, getFilm, navigate } from '../app/state.js';
import { filmGrid } from '../components/movie-card.js';
import { escapeHtml } from '../utils/dom.js';
import { formatWatchedOn } from '../utils/format.js';
import { bindLiveSearch } from '../components/live-search.js';

function heroSection(title, subtitle, extraContent = '') {
  return `<section class="hero">
    <div class="hero-content">
      <h2 class="page-title hero-title">${escapeHtml(title)}</h2>
      <p class="muted hero-subtitle">${escapeHtml(subtitle)}</p>
      ${extraContent}
    </div>
  </section>`;
}

export async function homePage(app) {
  app.innerHTML = `${heroSection('Trending this week', 'A quick pulse check on what Letterboxd-style viewers are talking about right now.')}<p class="muted">Loading from TMDB…</p>`;
  try {
    const payload = await apiFetch('/movies/trending');
    state.tmdbFilms = (payload.results || []).map((m) => normalizeTmdbFilm(m));
    app.innerHTML = `
      ${heroSection('Trending this week', 'A quick pulse check on what Letterboxd-style viewers are talking about right now.')}
      <section class="card section discover-search-card">
        <form id="discover-form" class="toolbar-form" autocomplete="off">
          <label style="flex:1">
            <input id="nav-search-input" name="q" placeholder="Search films, directors, actors…" autocomplete="off" />
          </label>
          <button class="primary" type="submit">Search</button>
        </form>
      </section>
      ${filmGrid(state.tmdbFilms)}`;
    bindLiveSearch(document.getElementById('nav-search-input'));
  } catch (err) {
    app.innerHTML = `<section class="card"><h2>Unable to load TMDB data</h2><p class="muted">${escapeHtml(err.message)}</p></section>`;
  }
}

export async function filmsPage(app, query = '') {
  const search = decodeURIComponent(query || '').trim();
  app.innerHTML = `${heroSection('Discover films', 'Search by title, actor, or director, or browse current standouts.')}
    <section class="card section discover-search-card">
      <form id="discover-form" class="toolbar-form" autocomplete="off">
        <label style="flex:1">
          <input id="nav-search-input" name="q" placeholder="Search films, directors, actors…" value="${escapeHtml(search)}" autocomplete="off" />
        </label>
        <button class="primary" type="submit">Search</button>
      </form>
    </section>
    <p class="muted">Loading…</p>`;

  bindLiveSearch(document.getElementById('nav-search-input'));

  try {
    const payload = search
      ? await apiFetch(`/movies/search?q=${encodeURIComponent(search)}`)
      : await apiFetch('/movies/trending');
    state.tmdbFilms = (payload.results || []).map((m) => normalizeTmdbFilm(m));
    const searchCard = app.querySelector('.discover-search-card');
    const loadingMsg = app.querySelector('.muted');
    if (loadingMsg) loadingMsg.remove();
    app.insertAdjacentHTML('beforeend', filmGrid(state.tmdbFilms));
  } catch (err) {
    app.innerHTML = `<section class="card"><h2>Search failed</h2><p class="muted">${escapeHtml(err.message)}</p></section>`;
  }
}

export async function profilePage(app, username) {
  const isOwner = state.currentUser && state.currentUser.username === username;
  const knownFilms = state.watchlist.map((id) => getFilm(id)).filter(Boolean);

  let profileReviews = [];
  try {
    const payload = await fetchUserReviews(username);
    profileReviews = Array.isArray(payload.reviews) ? payload.reviews.slice(0, PROFILE_REVIEWS_LIMIT) : [];
  } catch {
    profileReviews = [];
  }

  app.innerHTML = `${heroSection(
    `@${username}`,
    isOwner
      ? 'Your profile activity summary updates with your latest watchlist and review momentum.'
      : 'Public profile activity summary from recent watchlist and review updates.',
    `<div class="cluster">
      <span class="stat-pill">${state.watchlist.length} watchlist item${state.watchlist.length === 1 ? '' : 's'}</span>
      <span class="stat-pill">${profileReviews.length} recent review${profileReviews.length === 1 ? '' : 's'}</span>
      ${isOwner ? '<span class="stat-pill">Signed in</span>' : ''}
    </div>`,
  )}
    <p class="muted">${isOwner ? 'Your latest activity appears below.' : 'Public profile preview.'}</p>
  </section>
  <section class="section">
    <h3>Watchlist preview</h3>
    ${knownFilms.length ? filmGrid(knownFilms.slice(0, 6)) : '<p class="muted empty-state">No watchlist films yet. Open a movie card and add one.</p>'}
  </section>
  <section class="section">
    <h3>Recent reviews</h3>
    ${
      profileReviews.length
        ? `<div class="feed">${profileReviews.map((review) => `
      <article class="review-card timeline-item">
        <p class="muted">⭐ ${escapeHtml(Number(review.rating).toFixed(1))} • <a class="inline-link" href="#/film/${encodeURIComponent(review.movieId)}">Film ${escapeHtml(review.movieId)}</a></p>
        <p>${escapeHtml(review.text)}</p>
        <p class="muted">${formatWatchedOn(review.watchedOn)}</p>
      </article>`).join('')}</div>`
        : '<p class="muted empty-state">No reviews yet.</p>'
    }
  </section>`;
}

export function notFound(app) {
  app.innerHTML = '<section class="card"><h2>Page not found</h2></section>';
}
