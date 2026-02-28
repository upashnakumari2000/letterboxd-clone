import { state } from '../app/state.js';
import { escapeHtml } from '../utils/dom.js';

export function renderNav(nav) {
  const currentHash = window.location.hash || '#/';

  const isActiveRoute = (targetHash) =>
    targetHash === '#/'
      ? currentHash === '#/' || currentHash === '#'
      : currentHash === targetHash || currentHash.startsWith(`${targetHash}/`);

  const navLink = (href, label) => {
    const active = isActiveRoute(href);
    const activeClass = active ? ' class="is-active"' : '';
    const activeAttr = active ? ' aria-current="page"' : '';
    return `<a href="${href}"${activeClass}${activeAttr}>${label}</a>`;
  };

  const watchlistCount = state.watchlist.length;
  const watchlistLabel = watchlistCount > 0 ? `Watchlist <span class="nav-badge">${watchlistCount}</span>` : 'Watchlist';

  const authLinks = state.currentUser
    ? `<li>${navLink(`#/profile/${encodeURIComponent(state.currentUser.username)}`, `@${escapeHtml(state.currentUser.username)}`)}</li>
       <li>${navLink('#/watchlist', watchlistLabel)}</li>
       <li><button type="button" data-action="signout">Sign out</button></li>`
    : `<li><button type="button" data-action="open-signin">Sign in</button></li>
       <li><button type="button" data-action="open-signup" class="nav-signup-btn">Sign up</button></li>`;

  nav.innerHTML = `
    <li>${navLink('#/', 'Home')}</li>
    <li>${navLink('#/films', 'Films')}</li>
    ${authLinks}
  `;
}
