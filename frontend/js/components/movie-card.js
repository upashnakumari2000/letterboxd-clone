import { escapeHtml } from '../utils/dom.js';

export function filmPoster(film) {
  if (String(film.poster).startsWith('http')) {
    return `<img class="poster-image" src="${escapeHtml(film.poster)}" alt="${escapeHtml(film.title)} poster" />`;
  }
  const placeholderText =
    String(film.poster || '').trim() && String(film.poster).trim() !== String(film.title).trim()
      ? film.poster
      : 'No poster available';
  return `<div class="poster" role="img" aria-label="${escapeHtml(film.title)} poster placeholder">${escapeHtml(placeholderText)}</div>`;
}

export function filmGrid(films) {
  if (!films.length) return '<p class="muted">No films found.</p>';
  return `<section class="grid" aria-label="Film grid">
    ${films
      .map(
        (film) => `<article class="film-card">
      <a href="#/film/${encodeURIComponent(film.id)}">
        <div class="film-card-media">
          ${filmPoster(film)}
          <span class="film-card-overlay">Open details</span>
        </div>
        <div class="film-card-content">
          <strong>${escapeHtml(film.title)}</strong>
          <div class="film-card-meta">
            <span class="meta-chip">⭐ ${escapeHtml(film.avgRating.toFixed(1))}</span>
            <span class="meta-chip">${escapeHtml(film.year)}</span>
          </div>
        </div>
      </a>
    </article>`,
      )
      .join('')}
  </section>`;
}
