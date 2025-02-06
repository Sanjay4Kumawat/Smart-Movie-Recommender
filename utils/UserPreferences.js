import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage Keys
const STORAGE_KEYS = {
  LIKED_MOVIES: '@moviemate_liked_movies',
  WATCH_HISTORY: '@moviemate_watch_history',
  PREFERRED_GENRES: '@moviemate_preferred_genres',
  USER_PREFERENCES: '@moviemate_user_preferences',
  LAST_VIEWED: '@moviemate_last_viewed',
  SEARCH_HISTORY: '@moviemate_search_history',
  VIEW_HISTORY: '@moviemate_view_history',
  GENRE_PREFERENCES: '@moviemate_genre_preferences',
};

// Maximum items to store
const MAX_HISTORY_ITEMS = 50;
const MAX_LIKED_MOVIES = 100;

const API_KEY = 'a6b600ee182f74ad61627c463ebb75e3';
const BASE_URL = 'https://api.themoviedb.org/3';
const USER_PREFERENCES_KEY = '@moviemate_preferences';
const WATCH_HISTORY_KEY = '@moviemate_history';

class UserPreferences {
  // Add new storage keys
  static STORAGE_KEYS = {
    ...STORAGE_KEYS,
    FREQUENT_VIEWS: '@moviemate_frequent_views',
    SEARCH_PATTERNS: '@moviemate_search_patterns',
    INDUSTRY_PREFERENCES: '@moviemate_industry_preferences'
  };

  // Like/Unlike a movie
  static async toggleLikedMovie(movieId) {
    try {
      const likedMovies = await this.getLikedMovies();
      const isLiked = likedMovies.includes(movieId);
      
      if (isLiked) {
        const updatedLikes = likedMovies.filter(id => id !== movieId);
        await AsyncStorage.setItem(STORAGE_KEYS.LIKED_MOVIES, JSON.stringify(updatedLikes));
      } else {
        const updatedLikes = [movieId, ...likedMovies].slice(0, MAX_LIKED_MOVIES);
        await AsyncStorage.setItem(STORAGE_KEYS.LIKED_MOVIES, JSON.stringify(updatedLikes));
      }
      return !isLiked;
    } catch (error) {
      console.error('Error toggling liked movie:', error);
      return false;
    }
  }

  // Get all liked movies
  static async getLikedMovies() {
    try {
      const likes = await AsyncStorage.getItem(STORAGE_KEYS.LIKED_MOVIES);
      return likes ? JSON.parse(likes) : [];
    } catch (error) {
      console.error('Error getting liked movies:', error);
      return [];
    }
  }

  // Add to watch history
  static async addToWatchHistory(movieId) {
    try {
      const history = await this.getWatchHistory();
      const updatedHistory = [
        { movieId, timestamp: Date.now() },
        ...history.filter(item => item.movieId !== movieId)
      ].slice(0, MAX_HISTORY_ITEMS);
      
      await AsyncStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, JSON.stringify(updatedHistory));
      return true;
    } catch (error) {
      console.error('Error adding to watch history:', error);
      return false;
    }
  }

  // Get watch history
  static async getWatchHistory() {
    try {
      const history = await AsyncStorage.getItem(STORAGE_KEYS.WATCH_HISTORY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error getting watch history:', error);
      return [];
    }
  }

  // Update preferred genres
  static async updatePreferredGenres(genres) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PREFERRED_GENRES, JSON.stringify(genres));
      return true;
    } catch (error) {
      console.error('Error updating preferred genres:', error);
      return false;
    }
  }

  // Get preferred genres
  static async getPreferredGenres() {
    try {
      const genres = await AsyncStorage.getItem(STORAGE_KEYS.PREFERRED_GENRES);
      return genres ? JSON.parse(genres) : [];
    } catch (error) {
      console.error('Error getting preferred genres:', error);
      return [];
    }
  }

  // Update last viewed movie/show
  static async updateLastViewed(mediaId, mediaType = 'movie') {
    try {
      const lastViewed = {
        id: mediaId,
        type: mediaType,
        timestamp: Date.now()
      };
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_VIEWED, JSON.stringify(lastViewed));
      return true;
    } catch (error) {
      console.error('Error updating last viewed:', error);
      return false;
    }
  }

  // Clear all preferences
  static async clearAllPreferences() {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (error) {
      console.error('Error clearing preferences:', error);
      return false;
    }
  }

  static async trackSearchQuery(query) {
    try {
      const searches = await AsyncStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY) || '[]';
      const searchHistory = JSON.parse(searches);
      searchHistory.unshift({ query, timestamp: Date.now() });
      await AsyncStorage.setItem(
        STORAGE_KEYS.SEARCH_HISTORY, 
        JSON.stringify(searchHistory.slice(0, 20))
      );
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  }

  static async trackMovieView(movieDetails) {
    try {
      // Update view count
      const views = await AsyncStorage.getItem(STORAGE_KEYS.VIEW_HISTORY) || '{}';
      const viewHistory = JSON.parse(views);
      viewHistory[movieDetails.id] = (viewHistory[movieDetails.id] || 0) + 1;
      await AsyncStorage.setItem(STORAGE_KEYS.VIEW_HISTORY, JSON.stringify(viewHistory));

      // Update preferences based on viewed movie
      await this.updatePreferences(movieDetails);
    } catch (error) {
      console.error('Error tracking movie view:', error);
    }
  }

  static async updatePreferences(movieDetails) {
    try {
      const prefsString = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      let prefs = prefsString ? JSON.parse(prefsString) : {
        genres: {},
        languages: {},
        actors: {},
        directors: {},
        keywords: {},
        viewCounts: {}
      };

      // Update genre preferences
      movieDetails.genres?.forEach(genre => {
        prefs.genres[genre.id] = (prefs.genres[genre.id] || 0) + 1;
      });

      // Update language preference
      if (movieDetails.original_language) {
        prefs.languages[movieDetails.original_language] = 
          (prefs.languages[movieDetails.original_language] || 0) + 1;
      }

      // Update actor preferences
      movieDetails.credits?.cast?.slice(0, 5).forEach(actor => {
        prefs.actors[actor.id] = (prefs.actors[actor.id] || 0) + 1;
      });

      // Update director preferences
      const director = movieDetails.credits?.crew?.find(c => c.job === 'Director');
      if (director) {
        prefs.directors[director.id] = (prefs.directors[director.id] || 0) + 1;
      }

      // Update keywords
      movieDetails.keywords?.keywords?.forEach(keyword => {
        prefs.keywords[keyword.id] = (prefs.keywords[keyword.id] || 0) + 1;
      });

      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(prefs));
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  }

  static async getRecommendedMovies() {
    try {
      // Get all user data
      const [prefs, watchlist, viewHistory, searchHistory, frequentViews] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES),
        AsyncStorage.getItem(STORAGE_KEYS.LIKED_MOVIES),
        AsyncStorage.getItem(STORAGE_KEYS.VIEW_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY),
        AsyncStorage.getItem(this.STORAGE_KEYS.FREQUENT_VIEWS)
      ]);

      const userPrefs = prefs ? JSON.parse(prefs) : null;
      const userWatchlist = watchlist ? JSON.parse(watchlist) : [];
      const watchedMovies = viewHistory ? JSON.parse(viewHistory) : {};
      const searches = searchHistory ? JSON.parse(searchHistory) : [];
      const frequentlyViewed = frequentViews ? JSON.parse(frequentViews) : {};

      // Prepare API calls based on user behavior
      const apiCalls = [];

      // 1. Get recommendations from watchlist
      if (userWatchlist.length > 0) {
        apiCalls.push(
          ...userWatchlist.slice(-3).map(id =>
            fetch(`${BASE_URL}/movie/${id}/recommendations?api_key=${API_KEY}`)
          )
        );
      }

      // 2. Get similar movies based on frequently viewed
      const topFrequent = Object.entries(frequentlyViewed)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 3)
        .map(([id]) => id);

      apiCalls.push(
        ...topFrequent.map(id =>
          fetch(`${BASE_URL}/movie/${id}/similar?api_key=${API_KEY}`)
        )
      );

      // 3. Get movies based on search history
      if (searches.length > 0) {
        const recentSearches = searches
          .slice(0, 3)
          .map(s => s.query)
          .join('|');

        apiCalls.push(
          fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${recentSearches}`)
        );
      }

      // 4. Get movies based on preferred genres
      if (userPrefs?.genres) {
        const topGenres = Object.entries(userPrefs.genres)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([id]) => id);

        apiCalls.push(
          fetch(
            `${BASE_URL}/discover/movie?api_key=${API_KEY}` +
            `&with_genres=${topGenres.join(',')}` +
            `&sort_by=popularity.desc`
          )
        );
      }

      // Fetch all recommendations
      const responses = await Promise.all(apiCalls);
      const results = await Promise.all(responses.map(r => r.json()));

      // Process and score recommendations
      let recommendations = [];

      for (const result of results) {
        if (result.results) {
          for (const movie of result.results) {
            if (!Object.keys(watchedMovies).includes(String(movie.id)) &&
                !recommendations.some(r => r.id === movie.id)) {
              
              let score = 0;

              // Watchlist similarity bonus
              if (userWatchlist.includes(movie.id)) {
                score += 10;
              }

              // Frequently viewed genre matching
              const movieGenres = new Set(movie.genre_ids);
              Object.values(frequentlyViewed).forEach(viewed => {
                if (viewed.genres?.some(g => movieGenres.has(g.id))) {
                  score += viewed.count * 2;
                }
              });

              // Search history matching
              searches.forEach(search => {
                if (movie.title.toLowerCase().includes(search.query.toLowerCase())) {
                  score += 5;
                }
              });

              // Genre preferences
              movie.genre_ids?.forEach(genreId => {
                if (userPrefs?.genres[genreId]) {
                  score += userPrefs.genres[genreId] * 2;
                }
              });

              // Language preferences
              if (userPrefs?.languages[movie.original_language]) {
                score += userPrefs.languages[movie.original_language] * 3;
              }

              // Recent and popular bonus
              const yearDiff = new Date().getFullYear() - 
                new Date(movie.release_date).getFullYear();
              if (yearDiff <= 1) score += 3;
              score += Math.min(movie.popularity || 0, 100) / 20;
              score += (movie.vote_average || 0) / 2;

              recommendations.push({
                ...movie,
                relevanceScore: score
              });
            }
          }
        }
      }

      // Sort by relevance and return top recommendations
      recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
      return recommendations.slice(0, 20);

    } catch (error) {
      console.error('Error getting recommendations:', error);
      return this.getFallbackRecommendations();
    }
  }

  static async getFallbackRecommendations() {
    try {
      const response = await fetch(
        `${BASE_URL}/movie/popular?api_key=${API_KEY}&page=1`
      );
      const data = await response.json();
      return data.results;
    } catch (error) {
      console.error('Error getting fallback recommendations:', error);
      return [];
    }
  }

  // Track movie view with timestamp and duration
  static async trackMovieView(movieData) {
    try {
      const history = await this.getWatchHistory();
      const newView = {
        movieId: movieData.id,
        timestamp: Date.now(),
        genres: movieData.genres || [],
        title: movieData.title,
      };
      
      const updatedHistory = [newView, ...history].slice(0, 50); // Keep last 50 views
      await AsyncStorage.setItem(STORAGE_KEYS.WATCH_HISTORY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error tracking movie view:', error);
    }
  }

  // Track search queries
  static async trackSearch(query, selectedMovie = null) {
    try {
      const searches = await this.getSearchHistory();
      const newSearch = {
        query,
        timestamp: Date.now(),
        selectedMovie, // Track if user selected a movie from search
      };
      
      const updatedSearches = [newSearch, ...searches].slice(0, 30);
      await AsyncStorage.setItem(STORAGE_KEYS.SEARCH_HISTORY, JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  }

  // Update genre preferences based on user interactions
  static async updateGenrePreferences(genres) {
    try {
      const currentPreferences = await this.getGenrePreferences();
      const updatedPreferences = { ...currentPreferences };
      
      genres.forEach(genreId => {
        updatedPreferences[genreId] = (updatedPreferences[genreId] || 0) + 1;
      });
      
      await AsyncStorage.setItem(STORAGE_KEYS.GENRE_PREFERENCES, JSON.stringify(updatedPreferences));
    } catch (error) {
      console.error('Error updating genre preferences:', error);
    }
  }

  // Get all user activity data
  static async getUserActivity() {
    try {
      const [watchHistory, searchHistory, likedMovies, genrePreferences] = await Promise.all([
        this.getWatchHistory(),
        this.getSearchHistory(),
        this.getLikedMovies(),
        this.getGenrePreferences(),
      ]);
      
      return {
        watchHistory,
        searchHistory,
        likedMovies,
        genrePreferences,
      };
    } catch (error) {
      console.error('Error getting user activity:', error);
      return {};
    }
  }

  // Helper methods to get stored data
  static async getSearchHistory() {
    const searches = await AsyncStorage.getItem(STORAGE_KEYS.SEARCH_HISTORY);
    return searches ? JSON.parse(searches) : [];
  }

  static async getGenrePreferences() {
    const preferences = await AsyncStorage.getItem(STORAGE_KEYS.GENRE_PREFERENCES);
    return preferences ? JSON.parse(preferences) : {};
  }
}

// Export the class methods bound to the class
export const getLikedMovies = UserPreferences.getLikedMovies.bind(UserPreferences);
export const getRecommendedMovies = UserPreferences.getRecommendedMovies.bind(UserPreferences);
export const trackMovieView = UserPreferences.trackMovieView.bind(UserPreferences);

export default UserPreferences;