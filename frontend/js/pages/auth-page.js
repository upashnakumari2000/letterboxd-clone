import { escapeHtml } from '../utils/dom.js';
import { openModal, closeModal, updateModalContent } from '../components/modal.js';
import { apiFetch, hydrateWatchlistForSignedInUser } from '../services/api-client.js';
import { state, saveState, navigate, syncStateForActiveUser } from '../app/state.js';
import { renderNav } from '../components/navbar.js';
import { validateReviewPayload } from '../utils/validation.js';

function authFormHtml(type) {
  const isUp = type === 'signup';
  return `
    <div class="modal-auth">
      <h2 class="modal-title">${isUp ? 'Create account' : 'Welcome back'}</h2>
      <p class="modal-subtitle muted">${isUp ? 'Join to track films and write reviews.' : 'Sign in to your account.'}</p>
      <form id="auth-form" data-type="${isUp ? 'signup' : 'signin'}" class="auth-form">
        <label>
          Username
          <input name="username" required autocomplete="username" minlength="3" placeholder="e.g. filmfan42" />
        </label>
        <label>
          Password
          <input name="password" type="password" required minlength="8" autocomplete="${isUp ? 'new-password' : 'current-password'}" placeholder="${isUp ? 'At least 8 characters' : 'Your password'}" />
        </label>
        ${isUp ? `<label>
          Confirm password
          <input name="confirm" type="password" required minlength="8" autocomplete="new-password" placeholder="Repeat password" />
        </label>` : ''}
        <p id="auth-message" class="auth-message" aria-live="polite"></p>
        <button class="primary auth-submit" type="submit">${isUp ? 'Create account' : 'Sign in'}</button>
      </form>
      <p class="auth-switch muted">
        ${isUp
          ? `Already have an account? <button class="link-btn" data-auth-switch="signin">Sign in</button>`
          : `No account yet? <button class="link-btn" data-auth-switch="signup">Sign up</button>`
        }
      </p>
    </div>
  `;
}

export function openAuthModal(type = 'signin', nav) {
  openModal(authFormHtml(type));

  // switch between signin/signup without closing modal
  document.addEventListener('click', function handler(e) {
    const switchType = e.target?.dataset?.authSwitch;
    if (switchType) {
      updateModalContent(authFormHtml(switchType).replace('<div class="modal-auth">', '').replace('</div>', ''));
      // re-render entire modal content
      const mc = document.querySelector('.modal-content');
      if (mc) mc.innerHTML = authFormHtml(switchType);
    }
    if (!document.querySelector('.modal-overlay')) {
      document.removeEventListener('click', handler);
    }
  });
}

// Keep route-based pages as thin wrappers that open the modal
export function authPage(app, type) {
  // render a minimal placeholder so the route isn't blank
  app.innerHTML = '';
  openAuthModal(type);
}

export async function handleAuthSubmit(form, nav) {
  const fd = new FormData(form);
  const username = String(fd.get('username') || '').trim().toLowerCase();
  const password = String(fd.get('password') || '');
  const confirm = String(fd.get('confirm') || '');
  const type = form.dataset.type;
  const msg = document.getElementById('auth-message');
  const btn = form.querySelector('.auth-submit');

  const setError = (text) => {
    if (msg) { msg.textContent = text; msg.style.color = 'var(--danger)'; }
  };

  // client-side validation
  if (!username || username.length < 3) return setError('Username must be at least 3 characters.');
  if (!password || password.length < 8) return setError('Password must be at least 8 characters.');
  if (type === 'signup' && password !== confirm) return setError('Passwords do not match.');

  if (btn) { btn.disabled = true; btn.textContent = type === 'signup' ? 'Creating…' : 'Signing in…'; }

  try {
    if (type === 'signup') {
      await apiFetch('/auth/signup', { method: 'POST', body: JSON.stringify({ username, password }) });
    }
    const payload = await apiFetch('/auth/signin', { method: 'POST', body: JSON.stringify({ username, password }) });
    const previousUsername = state.currentUser?.username || null;
    state.currentUser = payload.user;
    state.token = payload.token;
    if (previousUsername !== state.currentUser?.username) syncStateForActiveUser();
    await hydrateWatchlistForSignedInUser();
    saveState();
    renderNav(nav);
    closeModal();
    navigate(`/profile/${encodeURIComponent(payload.user.username)}`);
  } catch (err) {
    setError(err.message);
    if (btn) { btn.disabled = false; btn.textContent = type === 'signup' ? 'Create account' : 'Sign in'; }
  }
}
