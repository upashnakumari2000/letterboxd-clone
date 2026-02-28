export function formatWatchedOn(value) {
  if (!value) return 'Watched date not set';
  return `Watched ${value}`;
}

export function formatFilmRating(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return 'No TMDB rating yet';
  return `${numeric.toFixed(1)} / 5`;
}
