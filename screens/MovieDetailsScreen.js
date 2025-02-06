import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Share,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useWatchlist } from '../context/WatchlistContext';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');

// TMDB API Configuration
const API_KEY = 'a6b600ee182f74ad61627c463ebb75e3';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';
const WATCHLIST_KEY = '@moviemate_watchlist';
const USER_PREFERENCES_KEY = '@moviemate_preferences';
const WATCH_HISTORY_KEY = '@moviemate_history';

const STREAMING_PLATFORMS = [
  {
    id: 'netflix',
    name: 'Netflix',
    icon: 'netflix',
    color: '#E50914',
    url: 'netflix://title/',
    webUrl: 'https://www.netflix.com/title/'
  },
  {
    id: 'prime',
    name: 'Prime Video',
    icon: 'amazon',
    color: '#00A8E1',
    url: 'primevideo://app/detail/',
    webUrl: 'https://www.amazon.com/gp/video/detail/'
  },
  {
    id: 'disney',
    name: 'Disney+',
    icon: 'disney-plus',
    color: '#0063E5',
    url: 'disneyplus://video/',
    webUrl: 'https://www.disneyplus.com/movies/'
  },
  {
    id: 'hbo',
    name: 'HBO Max',
    icon: 'play-network',
    color: '#991EEB',
    url: 'hbomax://page/movie/',
    webUrl: 'https://play.hbomax.com/page/movie/'
  }
];

const MovieDetails = ({ route, navigation }) => {
  const { movieId } = route.params;
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useWatchlist() || {};
  const [inWatchlist, setInWatchlist] = useState(false);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarMovies, setSimilarMovies] = useState([]);

  useEffect(() => {
    if (isInWatchlist) {
      setInWatchlist(isInWatchlist(movieId));
    }
  }, [movieId, isInWatchlist]);

  useEffect(() => {
    if (movieId) {
      Promise.all([
        fetchMovieDetails(),
        fetchRecommendedMovies()
      ]).catch(error => {
        console.error('Error in data fetching:', error);
      });
    }
  }, [movieId]);

  const fetchMovieDetails = async () => {
    setLoading(true);
    try {
      // Fetch movie details with additional data
      const response = await fetch(
        `${BASE_URL}/movie/${movieId}?api_key=${API_KEY}&append_to_response=credits,videos,watch/providers`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch movie details');
      }
      
      const data = await response.json();
      setDetails(data);
      
    } catch (error) {
      console.error('Error fetching movie details:', error);
      Alert.alert(
        'Error',
        'Failed to load movie details. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPreferences = async () => {
    try {
      const preferences = await AsyncStorage.getItem(USER_PREFERENCES_KEY);
      const watchHistory = await AsyncStorage.getItem(WATCH_HISTORY_KEY);
      return {
        preferences: preferences ? JSON.parse(preferences) : null,
        watchHistory: watchHistory ? JSON.parse(watchHistory) : []
      };
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return { preferences: null, watchHistory: [] };
    }
  };

  const fetchRecommendedMovies = async () => {
    try {
      // First ensure we have movie details
      if (!details) {
        console.log('Waiting for movie details to load...');
        return;
      }

      const { watchHistory } = await fetchUserPreferences();
      
      // First try to fetch exact matches
      const [similarResponse, languageResponse, genreResponse] = await Promise.all([
        fetch(`${BASE_URL}/movie/${movieId}/similar?api_key=${API_KEY}&language=en-US&page=1`),
        // Only include genres if we have them
        fetch(
          `${BASE_URL}/discover/movie?api_key=${API_KEY}` +
          `&with_original_language=${details.original_language}` +
          (details.genres?.length ? `&with_genres=${details.genres.map(g => g.id).join(',')}` : '') +
          `&sort_by=popularity.desc&page=1`
        ),
        // Fallback genre request
        fetch(
          `${BASE_URL}/discover/movie?api_key=${API_KEY}` +
          (details.genres?.length ? `&with_genres=${details.genres.map(g => g.id).join(',')}` : '') +
          `&sort_by=popularity.desc&page=1`
        )
      ]);

      const similarData = await similarResponse.json();
      const languageData = await languageResponse.json();
      const genreData = await genreResponse.json();

      // Combine all results
      let recommendedMovies = [
        ...similarData.results,
        ...languageData.results,
        ...genreData.results
      ]
      .filter((movie, index, self) => 
        index === self.findIndex(m => m.id === movie.id))
      .filter(movie => movie.id !== movieId)
      .filter(movie => !watchHistory.includes(movie.id));

      // Calculate scores and sort
      recommendedMovies = recommendedMovies.map(movie => ({
        ...movie,
        relevanceScore: calculateRelevanceScore(movie, details)
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 10);

      setSimilarMovies(recommendedMovies);
      
      // Save this movie's characteristics to user preferences
      await updateUserPreferences(details);
      
    } catch (error) {
      console.error('Error fetching recommended movies:', error);
      // Fallback to similar movies only if everything fails
      try {
        const similarResponse = await fetch(
          `${BASE_URL}/movie/${movieId}/similar?api_key=${API_KEY}&language=en-US&page=1`
        );
        const similarData = await similarResponse.json();
        setSimilarMovies(similarData.results.slice(0, 10));
      } catch (e) {
        setSimilarMovies([]);
      }
    }
  };

  const calculateRelevanceScore = (movie, currentMovie) => {
    let score = 0;

    // Industry matching (based on language and production countries)
    if (movie.original_language === currentMovie?.original_language) {
      score += 10;
    }

    // Genre matching
    const matchingGenres = movie.genre_ids?.filter(genreId => 
      currentMovie?.genres?.some(g => g.id === genreId)
    ).length || 0;
    score += matchingGenres * 5;

    // Release date proximity
    const currentMovieYear = new Date(currentMovie?.release_date).getFullYear();
    const movieYear = new Date(movie.release_date).getFullYear();
    const yearDiff = Math.abs(currentMovieYear - movieYear);
    if (yearDiff <= 2) score += 8;
    else if (yearDiff <= 5) score += 5;
    else if (yearDiff <= 10) score += 3;

    // Title similarity (for movie series/franchises)
    if (movie.title?.includes(currentMovie?.title) || 
        currentMovie?.title?.includes(movie.title)) {
      score += 15;
    }

    // Production company matching
    const currentCompanies = currentMovie?.production_companies?.map(c => c.id) || [];
    if (movie.production_companies?.some(c => currentCompanies.includes(c.id))) {
      score += 7;
    }

    return score;
  };

  const updateUserPreferences = async (movieDetails) => {
    try {
      const prefsString = await AsyncStorage.getItem(USER_PREFERENCES_KEY);
      let prefs = prefsString ? JSON.parse(prefsString) : {
        genres: {},
        languages: {},
        companies: {},
        watchedGenres: []
      };

      // Update genre preferences
      movieDetails.genres?.forEach(genre => {
        prefs.genres[genre.id] = (prefs.genres[genre.id] || 0) + 1;
        if (!prefs.watchedGenres.includes(genre.id)) {
          prefs.watchedGenres.push(genre.id);
        }
      });

      // Update language preferences
      const lang = movieDetails.original_language;
      prefs.languages[lang] = (prefs.languages[lang] || 0) + 1;

      // Update production company preferences
      movieDetails.production_companies?.forEach(company => {
        prefs.companies[company.id] = (prefs.companies[company.id] || 0) + 1;
      });

      // Save updated preferences
      await AsyncStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(prefs));
    } catch (error) {
      console.error('Error updating user preferences:', error);
    }
  };

  const handleWatchlistToggle = async () => {
    if (!addToWatchlist || !removeFromWatchlist) return;
    
    try {
      if (inWatchlist) {
        await removeFromWatchlist(movieId);
      } else {
        await addToWatchlist(movieId);
      }
      setInWatchlist(!inWatchlist);

      Alert.alert(
        inWatchlist ? '🎬 Removed from Watchlist' : '🎬 Added to Watchlist',
        inWatchlist
          ? `${details.title} has been removed from your watchlist`
          : `${details.title} has been added to your watchlist`,
        [
          {
            text: 'OK',
            style: 'default',
            onPress: () => {},
            color: '#FF3741'
          }
        ],
        {
          cancelable: true,
          overlayStyle: {
            backgroundColor: 'rgba(26, 26, 31, 0.9)'
          },
          contentContainerStyle: {
            backgroundColor: '#2A2A30',
            borderRadius: 16,
            borderWidth: 2,
            borderColor: '#FF3741',
            padding: 20,
            shadowColor: '#FF3741',
            shadowOffset: {
              width: 0,
              height: 2
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5
          },
          titleStyle: {
            color: '#FF3741',
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 10
          },
          messageStyle: {
            color: '#FFFFFF',
            fontSize: 16,
            textAlign: 'center',
            lineHeight: 22
          }
        }
      );
    } catch (error) {
      console.error('Error toggling watchlist:', error);
      Alert.alert(
        '❌ Error',
        'Failed to update watchlist',
        [{ text: 'OK', color: '#FF3741' }],
        {
          cancelable: true,
          overlayStyle: {
            backgroundColor: 'rgba(26, 26, 31, 0.9)'
          },
          contentContainerStyle: {
            backgroundColor: '#2A2A30',
            borderRadius: 16,
            borderWidth: 2,
            borderColor: '#FF3741',
            padding: 20
          },
          titleStyle: {
            color: '#FF3741',
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'center'
          },
          messageStyle: {
            color: '#FFFFFF',
            fontSize: 16,
            textAlign: 'center'
          }
        }
      );
    }
  };

  const shareMovie = async () => {
    try {
      await Share.share({
        message: `Check out ${details.title}!\n\n${details.overview}`,
        title: details.title,
      });
    } catch (error) {
      console.error('Error sharing movie:', error);
    }
  };

  const handleDownloadMovie = async () => {
    if (details?.title) {
      const movieTitle = encodeURIComponent(details.title); // Encode the title for a URL-safe format

      // List of websites to search for the movie
      const websites = [
        `https://moviesmod.org.im/search?q=${movieTitle}`,
        `https://movies4u.cash/search?q=${movieTitle}`,
        `https://bollyvid.lol/search?q=${movieTitle}`,
        `https://zeefliz.my/search?q=${movieTitle}`,
      ];

      try {
        for (let i = 0; i < websites.length; i++) {
          const supported = await Linking.canOpenURL(websites[i]);
          if (supported) {
            await Linking.openURL(websites[i]);
            return; // Stop after successfully opening a link
          }
        }

        // If no link is supported
        Alert.alert('Error', 'Unable to open any of the download links.');
      } catch (error) {
        console.error('Error opening download link:', error);
        Alert.alert(
          'Error',
          'An unexpected error occurred while trying to open the download links.'
        );
      }
    } else {
      Alert.alert('Error', 'Movie title not found.');
    }
  };

  const openStreamingApp = async (platform, movieId) => {
    try {
      const appUrl = `${platform.url}${movieId}`;
      const webUrl = `${platform.webUrl}${movieId}`;

      const canOpenApp = await Linking.canOpenURL(appUrl);
      if (canOpenApp) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch (error) {
      console.error('Error opening streaming platform:', error);
      Alert.alert(
        'Error',
        `Unable to open ${platform.name}. Please check if the app is installed.`
      );
    }
  };

  const updateWatchHistory = async (movieId) => {
    try {
      const history = await AsyncStorage.getItem(WATCH_HISTORY_KEY);
      const watchHistory = history ? JSON.parse(history) : [];
      
      if (!watchHistory.includes(movieId)) {
        watchHistory.push(movieId);
        await AsyncStorage.setItem(WATCH_HISTORY_KEY, JSON.stringify(watchHistory));
      }
    } catch (error) {
      console.error('Error updating watch history:', error);
    }
  };

  useEffect(() => {
    if (movieId) {
      updateWatchHistory(movieId);
    }
  }, [movieId]);

  // Update the useEffect to wait for details
  useEffect(() => {
    if (movieId && details) { // Only fetch recommendations when we have details
      fetchRecommendedMovies().catch(error => {
        console.error('Error in recommendation fetching:', error);
      });
    }
  }, [movieId, details]); // Add details as a dependency

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3741" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Backdrop Section */}
          <View style={styles.backdropContainer}>
            <Image
              source={{
                uri: details?.backdrop_path
                  ? `${IMAGE_BASE_URL}${details.backdrop_path}`
                  : `${IMAGE_BASE_URL}${details?.poster_path}`,
              }}
              style={styles.backdropImage}
            />
            <LinearGradient
              colors={['transparent', '#1A1A1F']}
              style={styles.gradientOverlay}
            />
          </View>

          {/* Content Section */}
          <View style={styles.contentContainer}>
            {/* Poster and Basic Info */}
            <View style={styles.posterContainer}>
              <Image
                source={{
                  uri: details?.poster_path
                    ? `${IMAGE_BASE_URL}${details.poster_path}`
                    : 'https://via.placeholder.com/300x450',
                }}
                style={styles.posterImage}
              />
              <View style={styles.basicInfo}>
                <Text style={styles.title}>{details?.title}</Text>
                <View style={styles.metaInfo}>
                  <Text style={styles.year}>
                    {details?.release_date?.split('-')[0]}
                  </Text>
                  <Text style={styles.dot}>•</Text>
                  <Text style={styles.runtime}>
                    {details?.runtime} min
                  </Text>
                  <Text style={styles.dot}>•</Text>
                  <View style={styles.ratingContainer}>
                    <Icon name="star" size={16} color="#FFD700" />
                    <Text style={styles.rating}>
                      {details?.vote_average?.toFixed(1)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Genres */}
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.genresContainer}
            >
              {details?.genres?.map(genre => (
                <View key={genre.id} style={styles.genreTag}>
                  <Text style={styles.genreText}>{genre.name}</Text>
                </View>
              ))}
            </ScrollView>

            {/* Overview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overview</Text>
              <Text style={styles.overview}>{details?.overview}</Text>
            </View>

            {/* Movie Info Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Movie Info</Text>
              <View style={styles.infoContainer}>
                {/* Budget */}
                <View style={styles.infoItem}>
                  <Icon name="cash" size={20} color="#00C853" />
                  <Text style={styles.infoLabel}>Budget</Text>
                  <Text style={styles.infoValue}>
                    {details?.budget ? `$${(details.budget / 1000000).toFixed(1)}M` : 'N/A'}
                  </Text>
                </View>

                {/* Revenue */}
                <View style={styles.infoItem}>
                  <Icon name="chart-line" size={20} color="#2196F3" />
                  <Text style={styles.infoLabel}>Revenue</Text>
                  <Text style={styles.infoValue}>
                    {details?.revenue ? `$${(details.revenue / 1000000).toFixed(1)}M` : 'N/A'}
                  </Text>
                </View>

                {/* Status */}
                <View style={styles.infoItem}>
                  <Icon name="information" size={20} color="#FFC107" />
                  <Text style={styles.infoLabel}>Status</Text>
                  <Text style={styles.infoValue}>{details?.status || 'N/A'}</Text>
                </View>

                {/* Original Language */}
                <View style={styles.infoItem}>
                  <Icon name="translate" size={20} color="#E91E63" />
                  <Text style={styles.infoLabel}>Language</Text>
                  <Text style={styles.infoValue}>
                    {details?.original_language?.toUpperCase() || 'N/A'}
                  </Text>
                </View>

                {/* Production Companies */}
                {details?.production_companies?.length > 0 && (
                  <View style={styles.infoItem}>
                    <Icon name="office-building" size={20} color="#9C27B0" />
                    <Text style={styles.infoLabel}>Production</Text>
                    <Text style={styles.infoValue}>
                      {details.production_companies.map(company => company.name).join(', ')}
                    </Text>
                  </View>
                )}

                {/* Release Date */}
                <View style={styles.infoItem}>
                  <Icon name="calendar" size={20} color="#FF5722" />
                  <Text style={styles.infoLabel}>Release Date</Text>
                  <Text style={styles.infoValue}>
                    {new Date(details?.release_date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                </View>
              </View>
            </View>

            {/* Cast */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cast</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.castContainer}
              >
                {details?.credits?.cast?.slice(0, 10).map(actor => (
                  <View key={actor.id} style={styles.castCard}>
                    <Image
                      source={{
                        uri: actor.profile_path
                          ? `${IMAGE_BASE_URL}${actor.profile_path}`
                          : 'https://via.placeholder.com/150',
                      }}
                      style={styles.castImage}
                    />
                    <Text style={styles.castName} numberOfLines={2}>
                      {actor.name}
                    </Text>
                    <Text style={styles.character} numberOfLines={1}>
                      {actor.character}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Watch Options */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Available On</Text>
              <View style={styles.streamingContainer}>
                {STREAMING_PLATFORMS.map(platform => (
                  <TouchableOpacity
                    key={platform.id}
                    style={[styles.platformButton, { backgroundColor: platform.color }]}
                    onPress={() => openStreamingApp(platform, details?.id)}
                  >
                    <Icon name={platform.icon} size={24} color="#FFFFFF" />
                    <Text style={styles.platformText}>{platform.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Similar Movies Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Similar Movies</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.similarMoviesContainer}
              >
                {similarMovies.map(movie => (
                  <TouchableOpacity
                    key={movie.id}
                    style={styles.similarMovieCard}
                    onPress={() => {
                      navigation.push('MovieDetails', { movieId: movie.id });
                    }}
                  >
                    <Image
                      source={{
                        uri: movie.poster_path
                          ? `${IMAGE_BASE_URL}${movie.poster_path}`
                          : 'https://via.placeholder.com/150x225'
                      }}
                      style={styles.similarMoviePoster}
                    />
                    <View style={styles.similarMovieInfo}>
                      <Text style={styles.similarMovieTitle} numberOfLines={2}>
                        {movie.title}
                      </Text>
                      <View style={styles.similarMovieMeta}>
                        <Icon name="star" size={14} color="#FFD700" />
                        <Text style={styles.similarMovieRating}>
                          {movie.vote_average?.toFixed(1)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </ScrollView>

        {/* Header Actions - Fixed on top */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.rightActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleWatchlistToggle}
            >
              <Icon
                name={inWatchlist ? "bookmark" : "bookmark-outline"}
                size={24}
                color="#FFFFFF"
              />
              <Text style={styles.actionButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={shareMovie}
            >
              <Icon name="share-variant" size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1A1A1F',
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  backdropContainer: {
    height: 250,
    width: '100%',
  },
  backdropImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  headerActions: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 2,
  },
  headerButton: {
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  rightActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
    marginTop: -40,
  },
  posterContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  posterImage: {
    width: 120,
    height: 180,
    borderRadius: 12,
  },
  basicInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  year: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  dot: {
    color: '#FFFFFF',
    marginHorizontal: 8,
  },
  runtime: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  genresContainer: {
    marginBottom: 20,
  },
  genreTag: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  genreText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  overview: {
    color: '#CCCCCC',
    fontSize: 14,
    lineHeight: 22,
  },
  castContainer: {
    marginTop: 8,
  },
  castCard: {
    width: 100,
    marginRight: 12,
  },
  castImage: {
    width: 100,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  castName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  character: {
    color: '#AAAAAA',
    fontSize: 11,
  },
  streamingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  platformButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    flex: 1,
    minWidth: '45%',
  },
  platformText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1F',
  },
  infoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  infoLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  similarMoviesContainer: {
    marginTop: 12,
  },
  similarMovieCard: {
    width: 120,
    marginRight: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  similarMoviePoster: {
    width: '100%',
    height: 180,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  similarMovieInfo: {
    padding: 8,
  },
  similarMovieTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  similarMovieMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  similarMovieRating: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});

export default MovieDetails;
