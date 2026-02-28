export function normalizeTmdbFilm(movie) {
  const cast = Array.isArray(movie.credits?.cast)
    ? movie.credits.cast.slice(0, 8).map((person) => ({
        id: person.id,
        name: person.name,
        character: person.character || '—',
      }))
    : [];

  const crew = Array.isArray(movie.credits?.crew)
    ? movie.credits.crew
        .filter((person) =>
          ['Director', 'Writer', 'Screenplay', 'Producer', 'Original Music Composer'].includes(person.job),
        )
        .slice(0, 10)
        .map((person) => ({ id: `${person.id}-${person.job}`, name: person.name, job: person.job }))
    : [];

  const directorNames = Array.isArray(movie.credits?.crew)
    ? movie.credits.crew.filter((p) => p.job === 'Director').map((p) => p.name)
    : [];

  const releaseEntry = Array.isArray(movie.release_dates?.results)
    ? movie.release_dates.results.find((e) => e.iso_3166_1 === 'US') || movie.release_dates.results[0]
    : null;

  const releases = Array.isArray(releaseEntry?.release_dates)
    ? releaseEntry.release_dates.slice(0, 5).map((item) => ({
        date: item.release_date,
        certification: item.certification || 'Unrated',
        type: item.type,
        country: releaseEntry.iso_3166_1,
      }))
    : [];

  const watchProvidersEntry = movie['watch/providers']?.results
    ? movie['watch/providers'].results.US || Object.values(movie['watch/providers'].results)[0]
    : null;

  const watchProviders = ['flatrate', 'rent', 'buy', 'ads', 'free']
    .flatMap((key) => (Array.isArray(watchProvidersEntry?.[key]) ? watchProvidersEntry[key] : []))
    .reduce((acc, provider) => {
      const providerName = String(provider.provider_name || '').trim();
      const nameKey = providerName.toLowerCase();
      const hasProvider = acc.some(
        (item) => item.providerId === provider.provider_id || item.name.toLowerCase() === nameKey,
      );
      if (!providerName || hasProvider) return acc;
      return [...acc, { providerId: provider.provider_id, name: providerName }];
    }, []);

  return {
    id: movie.id,
    title: movie.title,
    year: Number(String(movie.release_date || '').slice(0, 4)) || '—',
    director: directorNames.length ? directorNames.join(', ') : 'Unknown',
    runtime: movie.runtime || '—',
    genres: (movie.genres || []).map((g) => g.name),
    avgRating: Number(movie.vote_average || 0) / 2,
    poster: movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : movie.title,
    backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : '',
    overview: movie.overview || '',
    status: movie.status || 'Unknown',
    originalLanguage: movie.original_language || '—',
    spokenLanguages: Array.isArray(movie.spoken_languages) ? movie.spoken_languages.map((l) => l.english_name) : [],
    countries: Array.isArray(movie.production_countries) ? movie.production_countries.map((c) => c.name) : [],
    cast,
    crew,
    releases,
    watchProviders,
  };
}
