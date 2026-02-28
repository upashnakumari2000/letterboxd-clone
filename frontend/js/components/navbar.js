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

  const authLinks = state.currentUser
    ? `<li>${navLink(`#/profile/${encodeURIComponent(state.currentUser.username)}`, 'Profile')}</li>
       <li>${navLink('#/watchlist', 'Watchlist')}</li>
       <li><button type="button" data-action="signout">Sign out</button></li>`
    : `<li>${navLink('#/signin', 'Sign in')}</li><li>${navLink('#/signup', 'Sign up')}</li>`;

  nav.innerHTML = `<li>${navLink('#/', 'Home')}</li><li>${navLink('#/films', 'Films')}</li>${authLinks}`;
}
