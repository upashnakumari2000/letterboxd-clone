import { bindEvents } from '../services/watchlist-service.js';
import { bootstrapAuth } from '../services/api-client.js';
import { parseRoute } from './router.js';
import { renderNav } from '../components/navbar.js';

const app = document.getElementById('main-content');
const nav = document.getElementById('primary-nav');

bindEvents(app, nav);

(async () => {
  await bootstrapAuth();
  renderNav(nav);
  parseRoute(app);
})();
