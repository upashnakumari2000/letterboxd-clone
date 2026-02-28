export function validateReviewPayload(payload) {
  const rating = Number(payload.rating);
  const text = String(payload.text || '').trim();
  const watchedOn = String(payload.watchedOn || '').trim();

  if (!Number.isFinite(rating) || rating < 0.5 || rating > 5 || (rating * 10) % 5 !== 0) {
    throw new Error('Rating must be between 0.5 and 5 in 0.5 steps.');
  }

  if (!text || text.length > 2000) {
    throw new Error('Review text is required and must be 1-2000 characters.');
  }

  if (watchedOn && !/^\d{4}-\d{2}-\d{2}$/.test(watchedOn)) {
    throw new Error('Watched date must use YYYY-MM-DD format.');
  }

  return { rating, text, watchedOn: watchedOn || null };
}
