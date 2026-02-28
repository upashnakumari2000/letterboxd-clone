import { escapeHtml } from '../utils/dom.js';
import { navigate } from '../app/state.js';
import { normalizeTmdbFilm } from '../services/movies-service.js';

let _debounceTimer = null;
let _currentQuery = '';

function debounce(fn, delay) {
  return (...args) => {
    clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => fn(...args), delay);
  };
}

function createDropdown() {
  let el = document.getElementById('live-search-dropdown');
  if (!el) {
    el = document.createElement('div');
    el.id = 'live-search-dropdown';
    el.className = 'search-dropdown';
    el.setAttribute('role', 'listbox');
    document.body.appendChild(el);
  }
  return el;
}

function positionDropdown(input) {
  const dropdown = document.getElementById('live-search-dropdown');
  if (!dropdown) return;
  const rect = input.getBoundingClientRect();
  dropdown.style.top = `${rect.bottom + window.scrollY + 4}px`;
  dropdown.style.left = `${rect.left + window.scrollX}px`;
  dropdown.style.width = `${rect.width}px`;
}

function hideDropdown() {
  const el = document.getElementById('live-search-dropdown');
  if (el) el.remove();
}

function renderResults(results, query) {
  const dropdown = createDropdown();

  if (!results.length) {
    dropdown.innerHTML = `<div class="search-dropdown-empty">No results for "${escapeHtml(query)}"</div>`;
    return;
  }

  dropdown.innerHTML = results.slice(0, 8).map((film) => {
    const poster = film.poster_path
      ? `<img src="https://image.tmdb.org/t/p/w92${film.poster_path}" alt="" class="search-result-poster" />`
      : `<div class="search-result-poster search-result-poster--placeholder"></div>`;
    const title = escapeHtml(film.title || film.name || '');
    const year = film.release_date ? film.release_date.slice(0, 4) : '';
    return `<div class="search-result-item" role="option" data-film-id="${escapeHtml(film.id)}" tabindex="0">
      ${poster}
      <div class="search-result-info">
        <strong>${title}</strong>
        ${year ? `<span class="muted">${year}</span>` : ''}
      </div>
    </div>`;
  }).join('') + `<div class="search-dropdown-footer">
    <button class="search-see-all link-btn" data-query="${escapeHtml(query)}">See all results for "${escapeHtml(query)}"</button>
  </div>`;

  dropdown.addEventListener('click', (e) => {
    const item = e.target.closest('[data-film-id]');
    if (item) {
      hideDropdown();
      navigate(`/film/${encodeURIComponent(item.dataset.filmId)}`);
      return;
    }
    const seeAll = e.target.closest('.search-see-all');
    if (seeAll) {
      hideDropdown();
      navigate(`/films/${encodeURIComponent(seeAll.dataset.query)}`);
    }
  });
}

async function doSearch(query, input) {
  if (!query.trim()) { hideDropdown(); return; }
  _currentQuery = query;

  const dropdown = createDropdown();
  dropdown.innerHTML = `<div class="search-dropdown-loading">Searching…</div>`;
  positionDropdown(input);

  try {
    const res = await fetch(`/api/v1/movies/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search failed');
    const data = await res.json();
    // only render if query hasn't changed
    if (query === _currentQuery) {
      renderResults(data.results || [], query);
      positionDropdown(input);
    }
  } catch {
    if (query === _currentQuery) {
      dropdown.innerHTML = `<div class="search-dropdown-empty">Search failed. Try again.</div>`;
    }
  }
}

const debouncedSearch = debounce(doSearch, 300);

export function bindLiveSearch(input) {
  if (!input) return;

  input.addEventListener('input', (e) => {
    const q = e.target.value.trim();
    if (!q) { hideDropdown(); return; }
    createDropdown();
    positionDropdown(input);
    debouncedSearch(q, input);
  });

  input.addEventListener('focus', (e) => {
    if (e.target.value.trim()) debouncedSearch(e.target.value.trim(), input);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideDropdown();
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (q) { hideDropdown(); navigate(`/films/${encodeURIComponent(q)}`); }
    }
  });

  // close on outside click
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !document.getElementById('live-search-dropdown')?.contains(e.target)) {
      hideDropdown();
    }
  });

  window.addEventListener('resize', () => positionDropdown(input));
  window.addEventListener('scroll', () => positionDropdown(input), { passive: true });
}

export { hideDropdown };
