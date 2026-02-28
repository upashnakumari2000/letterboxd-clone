import { escapeHtml } from '../utils/dom.js';

export function authPage(app, type) {
  const isUp = type === 'signup';
  app.innerHTML = `<section class="card">
    <h2 class="page-title">${isUp ? 'Create account' : 'Sign in'}</h2>
    <form id="auth-form" data-type="${isUp ? 'signup' : 'signin'}">
      <label>Username<input name="username" required autocomplete="username" minlength="3" /></label>
      <label>Password<input name="password" type="password" required minlength="8" autocomplete="current-password" /></label>
      <button class="primary" type="submit">${isUp ? 'Sign up' : 'Sign in'}</button>
    </form>
    <p id="auth-message" class="muted"></p>
  </section>`;
}
