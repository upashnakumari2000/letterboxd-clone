import { escapeHtml } from '../utils/dom.js';

export function filmPoster(film) {
  if (String(film.poster).startsWith('http')) {
    return `<img class="poster-image" src="${escapeHtml(film.poster)}" alt="${escapeHtml(film.title)} poster" loading="lazy" />`;
  }
  return `<div class="poster" role="img" aria-label="${escapeHtml(film.title)} poster placeholder">${escapeHtml(film.title)}</div>`;
}

export function filmGrid(films) {
  if (!films.length) return '<p class="muted">No films found.</p>';

  return `<section class="grid" aria-label="Film grid">
    ${films.map((film) => {
      const rating = Number(film.avgRating || 0).toFixed(1);
      const year = film.year ? String(film.year) : '';
      const director = film.director && film.director !== 'Unknown' ? film.director.split(',')[0].trim() : '';
      const genres = Array.isArray(film.genres) ? film.genres.slice(0, 2) : [];

      return `<article class="film-card">
        <a href="#/film/${encodeURIComponent(film.id)}" aria-label="${escapeHtml(film.title)}">
          <div class="film-card-media">
            ${filmPoster(film)}
            <!-- Rating badge always visible -->
            <div class="film-card-rating-badge" aria-label="Rating ${rating}">
              ★ ${escapeHtml(rating)}
            </div>
            <!-- Hover overlay with genres + year -->
            <div class="film-card-overlay" aria-hidden="true">
              ${year ? `<span class="film-card-overlay-year">${escapeHtml(year)}</span>` : ''}
              ${genres.length ? `<div class="film-card-overlay-genres">
                ${genres.map(g => `<span class="film-card-overlay-chip">${escapeHtml(g)}</span>`).join('')}
              </div>` : ''}
            </div>
          </div>
          <div class="film-card-content">
            <span class="film-card-title">${escapeHtml(film.title)}</span>
            ${director ? `<span class="film-card-director">${escapeHtml(director)}</span>` : ''}
          </div>
        </a>
      </article>`;
    }).join('')}
  </section>`;
}
