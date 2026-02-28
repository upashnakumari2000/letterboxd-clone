import { authPage } from '../pages/auth-page.js';
import { filmDetailPage } from '../pages/film-detail-page.js';
import { filmsPage, homePage, profilePage, notFound } from '../pages/films-page.js';
import { watchlistPage } from '../pages/watchlist-page.js';

export async function parseRoute(app) {
  const route = window.location.hash.replace(/^#/, '') || '/';
  const parts = route.split('/').filter(Boolean);
  const section = parts[0] || '';
  const paramRaw = parts.slice(1).join('/');

  if (route === '/') return homePage(app);
  if (section === 'films') return filmsPage(app, paramRaw);
  if (section === 'film' && paramRaw) return filmDetailPage(app, decodeURIComponent(paramRaw));
  if (section === 'profile' && paramRaw) return profilePage(app, decodeURIComponent(paramRaw));
  if (section === 'watchlist') return watchlistPage(app);
  if (section === 'signin') return authPage(app, 'signin');
  if (section === 'signup') return authPage(app, 'signup');
  return notFound(app);
}
