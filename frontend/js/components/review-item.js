import { escapeHtml } from '../utils/dom.js';
import { formatWatchedOn } from '../utils/format.js';
import { state } from '../app/state.js';

export function renderReviewForm(movieId) {
  if (!state.currentUser || !state.token) {
    return `<p class="muted">Sign in to write a review.</p>`;
  }

  return `<form id="movie-review-form">
    <input type="hidden" name="movieId" value="${escapeHtml(movieId)}" />
    <label>Rating
      <div class="star-rating" aria-label="Rating">
        <input type="hidden" name="rating" value="" required />
        ${[1, 2, 3, 4, 5]
          .map(
            (value) =>
              `<button class="star-btn" type="button" data-action="set-review-rating" data-rating-value="${value}" aria-pressed="false" aria-label="${value} star${value === 1 ? '' : 's'}">★</button>`,
          )
          .join('')}
      </div>
    </label>
    <label>Review
      <textarea name="text" maxlength="2000" required placeholder="Share your thoughts…"></textarea>
    </label>
    <label>Watched on
      <input name="watchedOn" type="date" />
    </label>
    <button class="primary" type="submit">Post review</button>
  </form>`;
}

export function renderReviewList(reviews, { currentUsername, movieId }) {
  if (!Array.isArray(reviews) || !reviews.length) {
    return '<p class="muted empty-state">No reviews yet.</p>';
  }

  return `<div class="feed">${reviews
    .map((review) => {
      const isOwner = currentUsername && currentUsername === review.username;
      return `<article class="review-card timeline-item">
      <div class="review-head">
        <strong>@${escapeHtml(review.username)}</strong>
        <span class="muted">⭐ ${escapeHtml(Number(review.rating).toFixed(1))}</span>
      </div>
      <p>${escapeHtml(review.text)}</p>
      <p class="muted">${formatWatchedOn(review.watchedOn)}</p>
      ${
        isOwner
          ? `<div class="cluster">
          <button class="secondary" data-action="toggle-review-edit" data-review-id="${escapeHtml(review.id)}">Edit</button>
          <button class="danger" data-action="delete-review" data-movie-id="${escapeHtml(movieId)}" data-review-id="${escapeHtml(review.id)}">Delete</button>
        </div>
        <form id="edit-review-${escapeHtml(review.id)}" data-review-edit-form hidden>
          <input type="hidden" name="movieId" value="${escapeHtml(movieId)}" />
          <input type="hidden" name="reviewId" value="${escapeHtml(review.id)}" />
          <label>Rating
            <input name="rating" type="number" min="0.5" max="5" step="0.5" value="${escapeHtml(review.rating)}" required />
          </label>
          <label>Review
            <textarea name="text" maxlength="2000" required>${escapeHtml(review.text)}</textarea>
          </label>
          <label>Watched on
            <input name="watchedOn" type="date" value="${escapeHtml(review.watchedOn || '')}" />
          </label>
          <button class="primary" type="submit">Save changes</button>
        </form>`
          : ''
      }
    </article>`;
    })
    .join('')}</div>`;
}
