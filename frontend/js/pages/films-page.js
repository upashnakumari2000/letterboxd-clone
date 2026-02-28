import { apiFetch } from '../services/api-client.js';
import { fetchUserReviews, PROFILE_REVIEWS_LIMIT } from '../services/reviews-service.js';
import { normalizeTmdbFilm } from '../services/movies-service.js';
import { state, getFilm } from '../app/state.js';
import { filmGrid } from '../components/movie-card.js';
import { escapeHtml } from '../utils/dom.js';
import { formatWatchedOn } from '../utils/format.js';
import { bindLiveSearch } from '../components/live-search.js';

const GENRES = [
  { id: 28, name: 'Action' },
  { id: 35, name: 'Comedy' },
  { id: 18, name: 'Drama' },
  { id: 27, name: 'Horror' },
  { id: 878, name: 'Sci-Fi' },
  { id: 10749, name: 'Romance' },
  { id: 53, name: 'Thriller' },
  { id: 16, name: 'Animation' },
  { id: 99, name: 'Documentary' },
  { id: 14, name: 'Fantasy' },
];

// id (string) → name
const GENRE_ID_TO_NAME = Object.fromEntries(GENRES.map(g => [String(g.id), g.name]));
// name → id (string) — used in featured banner to get the id from a name string
const GENRE_NAME_TO_ID = Object.fromEntries(GENRES.map(g => [g.name, String(g.id)]));

function resolveGenreNames(film) {
  // after normalizeTmdbFilm, film.genres is already string[] if movies-service is updated
  if (Array.isArray(film.genres) && film.genres.length && typeof film.genres[0] === 'string') {
    return film.genres;
  }
  // fallback: raw TMDB object has genre_ids (number[])
  if (Array.isArray(film.genre_ids)) {
    return film.genre_ids.map(id => GENRE_ID_TO_NAME[String(id)]).filter(Boolean);
  }
  return [];
}

function featuredBanner(film) {
  if (!film) return '';
  const backdropStyle = film.backdrop
    ? `style="background-image: linear-gradient(to right, rgba(14,18,24,0.97) 35%, rgba(14,18,24,0.55) 100%), url('${escapeHtml(film.backdrop)}'); background-size: cover; background-position: center;"`
    : '';

  // genreNames is string[] e.g. ["Action", "Drama"]
  const genreNames = resolveGenreNames(film);

  // for each name, look up its numeric id so clicking the chip can trigger the genre fetch
  const genreChips = genreNames.slice(0, 3).map(name => {
    const id = GENRE_NAME_TO_ID[name] || '';
    return `<button class="genre-chip featured-genre-chip" data-genre="${id}">${escapeHtml(name)}</button>`;
  }).join('');

  return `
    <section class="featured-banner card" ${backdropStyle}>
      <div class="featured-content">
        <p class="film-kicker">Featured film</p>
        <h2 class="featured-title">${escapeHtml(film.title)} <span class="muted">(${escapeHtml(String(film.year))})</span></h2>
        <p class="featured-overview muted">${escapeHtml((film.overview || '').slice(0, 180))}${(film.overview || '').length > 180 ? '…' : ''}</p>
        <div class="cluster" style="margin-top: 12px">
          <span class="stat-pill">★ ${escapeHtml(film.avgRating.toFixed(1))}</span>
          ${genreChips}
        </div>
        <div style="margin-top: 16px">
          <a class="btn-featured" href="#/film/${encodeURIComponent(film.id)}">View film →</a>
        </div>
      </div>
    </section>`;
}

function genreBar() {
  return `
    <div class="genre-bar">
      <button class="genre-chip genre-chip--active" data-genre="">Trending</button>
      ${GENRES.map(g => `<button class="genre-chip" data-genre="${g.id}">${escapeHtml(g.name)}</button>`).join('')}
    </div>`;
}

function setGridLoading() {
  const container = document.getElementById('film-grid-container');
  if (container) container.innerHTML = '<p class="muted" style="padding: 8px 0">Loading…</p>';
}

function setGridContent(films) {
  const container = document.getElementById('film-grid-container');
  if (container) {
    container.innerHTML = films.length
      ? filmGrid(films)
      : '<p class="muted empty-state">No films found for this genre.</p>';
  }
}

function bindGenreFilter(app, trendingFilms) {
  // select both genre bar chips and featured banner chips
  const allChips = Array.from(app.querySelectorAll('.genre-chip'));
  const barChips = Array.from(app.querySelectorAll('.genre-bar .genre-chip'));

  allChips.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const genreId = String(btn.dataset.genre || '');

      // update active state only on the genre bar (not the featured banner chips)
      barChips.forEach(b => {
        b.classList.toggle('genre-chip--active', String(b.dataset.genre) === genreId);
      });

      if (!genreId) {
        state.tmdbFilms = trendingFilms;
        setGridContent(trendingFilms);
        return;
      }

      setGridLoading();
      document.getElementById('film-grid-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

      try {
        const payload = await fetch(`/api/v1/movies/genre?id=${genreId}`).then(r => r.json());
        const films = (payload.results || []).map(m => normalizeTmdbFilm(m));
        setGridContent(films);
      } catch {
        setGridContent([]);
      }
    });
  });
}

export async function homePage(app) {
  app.innerHTML = `<p class="muted" style="padding: 20px">Loading from TMDB…</p>`;

  try {
    const payload = await apiFetch('/movies/trending');
    const trendingFilms = (payload.results || []).map((m) => normalizeTmdbFilm(m));
    state.tmdbFilms = trendingFilms;

    const withBackdrop = trendingFilms.filter(f => f.backdrop);
    const featured = withBackdrop[Math.floor(Math.random() * withBackdrop.length)] || trendingFilms[0];

    app.innerHTML = `
      ${featuredBanner(featured)}
      <div class="home-section">
        <h3 class="section-heading">Browse films</h3>
        ${genreBar()}
        <div id="film-grid-container">
          ${filmGrid(trendingFilms)}
        </div>
      </div>`;

    bindGenreFilter(app, trendingFilms);
  } catch (err) {
    app.innerHTML = `<section class="card"><h2>Unable to load TMDB data</h2><p class="muted">${escapeHtml(err.message)}</p></section>`;
  }
}

export async function filmsPage(app, query = '') {
  const search = decodeURIComponent(query || '').trim();

  app.innerHTML = `
    <section class="hero">
      <div class="hero-content">
        <h2 class="page-title hero-title">Discover films</h2>
        <p class="muted hero-subtitle">Search by title, actor, or director.</p>
      </div>
    </section>
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

    app.innerHTML = `
      <section class="hero">
        <div class="hero-content">
          <h2 class="page-title hero-title">Discover films</h2>
          <p class="muted hero-subtitle">Search by title, actor, or director.</p>
        </div>
      </section>
      <section class="card section discover-search-card">
        <form id="discover-form" class="toolbar-form" autocomplete="off">
          <label style="flex:1">
            <input id="nav-search-input" name="q" placeholder="Search films, directors, actors…" value="${escapeHtml(search)}" autocomplete="off" />
          </label>
          <button class="primary" type="submit">Search</button>
        </form>
      </section>
      ${search ? `<p class="muted" style="margin-bottom: 8px">${state.tmdbFilms.length} result${state.tmdbFilms.length === 1 ? '' : 's'} for "<strong>${escapeHtml(search)}</strong>"</p>` : ''}
      ${filmGrid(state.tmdbFilms)}`;

    bindLiveSearch(document.getElementById('nav-search-input'));
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

  app.innerHTML = `
    <section class="hero">
      <div class="hero-content">
        <h2 class="page-title hero-title">@${escapeHtml(username)}</h2>
        <p class="muted hero-subtitle">${isOwner ? 'Your profile.' : 'Public profile.'}</p>
        <div class="cluster">
          <span class="stat-pill">${state.watchlist.length} watchlist item${state.watchlist.length === 1 ? '' : 's'}</span>
          <span class="stat-pill">${profileReviews.length} recent review${profileReviews.length === 1 ? '' : 's'}</span>
          ${isOwner ? '<span class="stat-pill">Signed in</span>' : ''}
        </div>
      </div>
    </section>
    <section class="section">
      <h3>Watchlist preview</h3>
      ${knownFilms.length ? filmGrid(knownFilms.slice(0, 6)) : '<p class="muted empty-state">No watchlist films yet.</p>'}
    </section>
    <section class="section">
      <h3>Recent reviews</h3>
      ${profileReviews.length
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