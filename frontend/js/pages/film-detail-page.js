import { apiFetch } from '../services/api-client.js';
import { fetchMovieReviews } from '../services/reviews-service.js';
import { normalizeTmdbFilm } from '../services/movies-service.js';
import { state, getFilm } from '../app/state.js';
import { filmPoster } from '../components/movie-card.js';
import { renderReviewForm, renderReviewList } from '../components/review-item.js';
import { escapeHtml } from '../utils/dom.js';
import { formatFilmRating } from '../utils/format.js';

function renderFilmGenres(genres) {
  if (!Array.isArray(genres) || !genres.length) return '<span class="meta-chip">Genre unknown</span>';
  return genres.map((genre) => `<span class="meta-chip">${escapeHtml(genre)}</span>`).join('');
}

function renderSearchLink(label) {
  const value = String(label || '').trim();
  if (!value) return '';
  return `<a class="person-link" href="#/films/${encodeURIComponent(value)}">${escapeHtml(value)}</a>`;
}

function renderCastList(cast) {
  if (!Array.isArray(cast) || !cast.length) return '<p class="muted empty-state">No cast details available.</p>';
  return `<ul class="detail-list compact-detail-list">${cast
    .map(
      (person) =>
        `<li class="detail-row compact-detail-row"><span class="muted">${escapeHtml(person.character)}</span><strong>${renderSearchLink(person.name)}</strong></li>`,
    )
    .join('')}</ul>`;
}

function renderCrewList(crew) {
  if (!Array.isArray(crew) || !crew.length) return '<p class="muted empty-state">No crew details available.</p>';
  return `<ul class="detail-list compact-detail-list">${crew
    .map(
      (person) =>
        `<li class="detail-row compact-detail-row"><span class="muted">${escapeHtml(person.job)}</span><strong>${renderSearchLink(person.name)}</strong></li>`,
    )
    .join('')}</ul>`;
}

function renderWatchProviders(film) {
  const providerMarkup =
    Array.isArray(film.watchProviders) && film.watchProviders.length
      ? `<div class="film-card-meta where-to-watch-chips">${film.watchProviders
          .map((p) => `<span class="meta-chip">${escapeHtml(p.name)}</span>`)
          .join('')}</div>`
      : '<p class="muted empty-state">No streaming providers listed.</p>';

  return `<div class="where-to-watch-content">${providerMarkup}</div>`;
}

export async function filmDetailPage(app, id) {
  app.innerHTML = '<section class="card"><h2>Loading film…</h2></section>';

  try {
    // Fetch movie data and reviews in parallel
    const isNumericId = /^\d+$/.test(String(id));

    const [moviePayload, reviewPayload] = await Promise.all([
      isNumericId ? apiFetch(`/movies/${encodeURIComponent(id)}`) : Promise.resolve(null),
      fetchMovieReviews(id).catch(() => ({ reviews: [] })),
    ]);

    // Try to get film from API response, then fall back to cache
    let film = null;
    if (moviePayload && moviePayload.id) {
      film = normalizeTmdbFilm(moviePayload);
    } else if (moviePayload && moviePayload.title) {
      // handle unexpected response shape
      film = normalizeTmdbFilm(moviePayload);
    } else {
      film = getFilm(id);
    }

    if (!film) throw new Error('Film not found. It may have been removed from TMDB.');

    // Cache it for watchlist lookups
    if (!state.tmdbFilms.some((f) => String(f.id) === String(film.id))) {
      state.tmdbFilms.push(film);
    }

    const reviews = Array.isArray(reviewPayload.reviews) ? reviewPayload.reviews : [];
    const inWatchlist = state.watchlist.includes(String(film.id));
    const backdropStyle = film.backdrop
      ? ` style="background-image: linear-gradient(to bottom, rgba(20,24,28,0.55) 0%, rgba(20,24,28,0.92) 100%), url('${escapeHtml(film.backdrop)}')"` : '';

    app.innerHTML = `
      <article class="card film-page-hero"${backdropStyle}>
        <div class="film-layout">
          <div class="film-detail-poster">${filmPoster(film)}</div>
          <div class="film-meta film-meta-rich">
            <p class="film-kicker">Film</p>
            <h2 class="page-title film-title">${escapeHtml(film.title)} <span class="muted">(${escapeHtml(String(film.year))})</span></h2>
            <p class="film-director-line">Directed by ${
              String(film.director || '').toLowerCase() === 'unknown'
                ? '<span class="muted">Unknown</span>'
                : film.director.split(',').map((name) => renderSearchLink(name.trim())).filter(Boolean).join('<span class="muted">, </span>')
            }</p>
            <div class="film-card-meta">${renderFilmGenres(film.genres)}</div>
            <div class="film-stat-row">
              <span class="stat-pill">★ ${escapeHtml(formatFilmRating(film.avgRating))}</span>
              <span class="stat-pill">⏱ ${escapeHtml(String(film.runtime))} min</span>
            </div>
            <p class="film-overview">${escapeHtml(film.overview || 'No overview available.')}</p>
            <div class="cluster film-actions">
              <button class="primary" data-action="toggle-watchlist" data-film="${escapeHtml(String(film.id))}">${inWatchlist ? '✓ In watchlist' : '+ Add to watchlist'}</button>
            </div>
          </div>
        </div>
      </article>
      <section class="card section">
        <h3>Write a review</h3>
        <p id="review-message" class="muted"></p>
        ${renderReviewForm(film.id)}
      </section>
      <section class="section cast-crew-layout">
        <article class="card compact-info-card">
          <h3>Cast</h3>
          ${renderCastList(film.cast)}
        </article>
        <article class="card compact-info-card">
          <h3>Crew</h3>
          ${renderCrewList(film.crew)}
        </article>
      </section>
      <section class="section">
        <h3>Details</h3>
        <div class="film-card-meta">
          <span class="meta-chip">Status: ${escapeHtml(film.status || 'Unknown')}</span>
          <span class="meta-chip">Language: ${escapeHtml(String(film.originalLanguage || '—').toUpperCase())}</span>
          <span class="meta-chip">Countries: ${escapeHtml((film.countries || []).join(', ') || '—')}</span>
          <span class="meta-chip">Spoken: ${escapeHtml((film.spokenLanguages || []).join(', ') || '—')}</span>
        </div>
      </section>
      <section class="section">
        <h3>Genres</h3>
        <div class="film-card-meta">${renderFilmGenres(film.genres)}</div>
      </section>
      <section class="section">
        <h3>Where to watch</h3>
        ${renderWatchProviders(film)}
      </section>
      <section class="section">
        <h3>Recent reviews</h3>
        ${renderReviewList(reviews, { currentUsername: state.currentUser?.username, movieId: String(film.id) })}
      </section>`;
  } catch (err) {
    app.innerHTML = `<section class="card"><h2>Film unavailable</h2><p class="muted">${escapeHtml(err.message)}</p></section>`;
  }
}
