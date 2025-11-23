const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';

async function getMovies(sort, page = 1) {
    if (!API_KEY) {
        console.error("TMDB_API_KEY is missing in .env");
        return [];
    }

    let sortBy = 'popularity.desc';
    if (sort === 'release_date') {
        sortBy = 'primary_release_date.desc';
    }

    try {
        const response = await axios.get(`${BASE_URL}/discover/movie`, {
            params: {
                api_key: API_KEY,
                with_original_language: 'ml',
                watch_region: 'IN',
                with_watch_monetization_types: 'flatrate',
                sort_by: sortBy,
                page: page
            }
        });

        const movies = response.data.results;

        // Fetch IMDb IDs for each movie in parallel
        const moviesWithImdb = await Promise.all(movies.map(async (movie) => {
            try {
                const details = await axios.get(`${BASE_URL}/movie/${movie.id}/external_ids`, {
                    params: { api_key: API_KEY }
                });
                const imdbId = details.data.imdb_id;

                if (!imdbId) return null;

                return {
                    id: imdbId, // Use IMDb ID
                    type: 'movie',
                    name: movie.title,
                    poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
                    description: movie.overview,
                    releaseInfo: movie.release_date ? movie.release_date.split('-')[0] : '',
                };
            } catch (e) {
                return null;
            }
        }));

        return moviesWithImdb.filter(m => m !== null);

    } catch (error) {
        console.error("Error fetching movies:", error.message);
        return [];
    }
}

async function getMovieDetails(id) {
    if (!API_KEY) return {};

    try {
        let tmdbId = id;

        // If it's an IMDb ID, find the TMDB ID first
        if (id.startsWith('tt')) {
            const find = await axios.get(`${BASE_URL}/find/${id}`, {
                params: {
                    api_key: API_KEY,
                    external_source: 'imdb_id'
                }
            });

            if (find.data.movie_results && find.data.movie_results.length > 0) {
                tmdbId = find.data.movie_results[0].id;
            } else {
                return {};
            }
        } else if (id.startsWith('tmdb:')) {
            tmdbId = id.split(':')[1];
        }

        const response = await axios.get(`${BASE_URL}/movie/${tmdbId}`, {
            params: { api_key: API_KEY }
        });
        const movie = response.data;
        return {
            id: id, // Return the requested ID (IMDb)
            type: 'movie',
            name: movie.title,
            poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
            background: `https://image.tmdb.org/t/p/original${movie.backdrop_path}`,
            description: movie.overview,
            releaseInfo: movie.release_date ? movie.release_date.split('-')[0] : '',
            genres: movie.genres.map(g => g.name),
        };
    } catch (error) {
        console.error("Error fetching movie details:", error.message);
        return {};
    }
}

module.exports = { getMovies, getMovieDetails };
