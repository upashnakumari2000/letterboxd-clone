import { getRuntimeApiBase } from '../config/runtime-config.js';

export const API_BASE = getRuntimeApiBase();

export const demoFilms = [
  { id: 'arrival', title: 'Arrival', year: 2016, director: 'Denis Villeneuve', runtime: 116, genres: ['Sci-Fi', 'Drama'], avgRating: 4.2, poster: 'Arrival' },
  { id: 'in-the-mood-for-love', title: 'In the Mood for Love', year: 2000, director: 'Wong Kar-wai', runtime: 98, genres: ['Romance', 'Drama'], avgRating: 4.5, poster: 'Mood for Love' },
];

function parseStoredJson(key, fallback) {
  const value = localStorage.getItem(key);
  if (value == null) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

function toUsernameKey(username) {
  return String(username || '').trim().toLowerCase();
}

function getWatchlistKey(username) {
  return `lb-watchlist:${toUsernameKey(username)}`;
}

function getFollowingKey(username) {
  return `lb-following:${toUsernameKey(username)}`;
}

function readUserScopedState(username) {
  if (!username) {
    return {
      watchlist: parseStoredJson('lb-watchlist:guest', []),
      following: [],
    };
  }
  return {
    watchlist: parseStoredJson(getWatchlistKey(username), []),
    following: parseStoredJson(getFollowingKey(username), []),
  };
}

function applyUserScopedState(username) {
  const scopedState = readUserScopedState(username);
  state.watchlist = Array.isArray(scopedState.watchlist) ? scopedState.watchlist : [];
  state.following = new Set(Array.isArray(scopedState.following) ? scopedState.following : []);
}

const parsedUser = parseStoredJson('lb-user', null);
const parsedToken = localStorage.getItem('lb-token');
const parsedUsername = parsedUser?.username || null;
const parsedUserScoped = readUserScopedState(parsedUsername);

export const state = {
  currentUser: parsedUser,
  token: parsedToken,
  watchlist: Array.isArray(parsedUserScoped.watchlist) ? parsedUserScoped.watchlist : [],
  following: new Set(Array.isArray(parsedUserScoped.following) ? parsedUserScoped.following : []),
  tmdbFilms: [],
};

export function syncStateForActiveUser() {
  applyUserScopedState(state.currentUser?.username);
}

export const saveState = () => {
  localStorage.setItem('lb-user', JSON.stringify(state.currentUser));

  if (state.currentUser?.username) {
    localStorage.setItem(getWatchlistKey(state.currentUser.username), JSON.stringify(state.watchlist));
    localStorage.setItem(getFollowingKey(state.currentUser.username), JSON.stringify([...state.following]));
  } else {
    localStorage.setItem('lb-watchlist:guest', JSON.stringify(state.watchlist));
  }

  if (state.token) localStorage.setItem('lb-token', state.token);
  else localStorage.removeItem('lb-token');
};

export function getFilm(id) {
  return demoFilms.find((f) => String(f.id) === String(id))
    || state.tmdbFilms.find((f) => String(f.id) === String(id));
}

export function navigate(path) {
  window.location.hash = `#${path}`;
}
