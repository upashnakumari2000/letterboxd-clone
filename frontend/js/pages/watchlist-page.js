import { apiFetch } from '../services/api-client.js';
import { normalizeTmdbFilm } from '../services/movies-service.js';
import { state, getFilm, navigate } from '../app/state.js';
import { filmGrid } from '../components/movie-card.js';
import { escapeHtml } from '../utils/dom.js';

function heroSection(title, subtitle) {
  return `<section class="hero">
    <div class="hero-content">
      <h2 class="page-title hero-title">${escapeHtml(title)}</h2>
      <p class="muted hero-subtitle">${escapeHtml(subtitle)}</p>
    </div>
  </section>`;
}

export async function watchlistPage(app) {
  if (!state.currentUser) return navigate('/signin');

  app.innerHTML = `${heroSection('Your watchlist', 'Keep tabs on queued titles and track what is still waiting for movie night.')}<p class="muted">Loading watchlist…</p>`;

  const uniqueIds = [...new Set(state.watchlist.map((id) => String(id)))];

  await Promise.all(
    uniqueIds.map(async (id) => {
      if (getFilm(id)) return;
      if (!/^\d+$/.test(id)) return;
      try {
        const payload = await apiFetch(`/movies/${encodeURIComponent(id)}`);
        const film = normalizeTmdbFilm(payload);
        if (!state.tmdbFilms.some((f) => String(f.id) === String(film.id))) state.tmdbFilms.push(film);
      } catch { }
    }),
  );

  const films = uniqueIds.map((id) => getFilm(id)).filter(Boolean);
  app.innerHTML = `${heroSection('Your watchlist', 'Keep tabs on queued titles and track what is still waiting for movie night.')}${
    films.length ? filmGrid(films) : '<p class="muted empty-state">Your watchlist is empty. Add films from a movie card.</p>'
  }`;
}
