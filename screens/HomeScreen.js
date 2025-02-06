import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Image,
  ActivityIndicator,
  Linking,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import UserPreferences from '../utils/UserPreferences';
import { getRecommendedMovies } from '../utils/UserPreferences';

const NEWS_API_KEY = '4c9f0dea0e6f4f1d8c3f8b6e9c2b5a9d'; // You'll need to get an API key from NewsAPI
const NEWS_BASE_URL = 'https://newsapi.org/v2';

const API_KEY = 'a6b600ee182f74ad61627c463ebb75e3';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

const MovieNews = ({ navigation }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovieUpdates();
  }, []);

  const fetchMovieUpdates = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/movie/upcoming?api_key=${API_KEY}&language=en-US&page=1`
      );
      const data = await response.json();
      
      if (data.results) {
        const newsItems = data.results.map(movie => ({
          id: movie.id,
          title: `'${movie.title}' Coming to Theaters`,
          image: movie.backdrop_path 
            ? `${IMAGE_BASE_URL}${movie.backdrop_path}`
            : movie.poster_path 
              ? `${IMAGE_BASE_URL}${movie.poster_path}`
              : 'https://via.placeholder.com/300x200',
          date: movie.release_date,
          description: movie.overview,
          type: 'upcoming'
        }));
        setNews(newsItems);
      }
    } catch (error) {
      console.error('Error fetching movie updates:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.newsLoadingContainer}>
        <ActivityIndicator size="small" color="#FF3741" />
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Movie Updates</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.newsContainer}
      >
        {news.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.newsCard}
            onPress={() => navigation.navigate('MovieDetails', { movieId: item.id })}
          >
            <Image
              source={{ uri: item.image }}
              style={styles.newsImage}
            />
            <View style={styles.newsContent}>
              <Text style={styles.newsType}>Upcoming Release</Text>
              <Text style={styles.newsTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.newsDate}>
                {new Date(item.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userActivity, setUserActivity] = useState({
    recentlyViewed: [],
    searchHistory: [],
    watchlist: []
  });

  const movieCategories = [
    { id: 1, title: 'Trending Movies', icon: 'fire' },
    { id: 2, title: 'Top Rated', icon: 'star' },
    { id: 3, title: 'Coming Soon', icon: 'calendar-clock' },
    { id: 4, title: 'My Watchlist', icon: 'playlist-play' },
  ];

  const handleMenuItemPress = (item) => {
    switch (item.id) {
      case 1:
        navigation.navigate('Trending');
        break;
      case 2:
        navigation.navigate('TopRated');
        break;
      case 3:
        navigation.navigate('ComingSoon');
        break;
      case 4:
        navigation.navigate('WatchList');
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    loadInitialRecommendations();
  }, []);

  useEffect(() => {
    if (userActivity.recentlyViewed.length > 0) {
      loadRecommendations();
    }
  }, [userActivity]);

  const loadInitialRecommendations = async () => {
    try {
      setLoading(true);
      const watchlist = await UserPreferences.getLikedMovies();
      const recommendations = await UserPreferences.getRecommendedMovies();
      setRecommendedMovies(recommendations);
    } catch (error) {
      console.error('Error loading initial recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const recommendations = await getRecommendedMovies();
      setRecommendedMovies(recommendations);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    }
  };

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await loadRecommendations();
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleMoviePress = async (movieId) => {
    try {
      await UserPreferences.trackMovieView({ id: movieId });
      navigation.navigate('MovieDetails', { movieId });
    } catch (error) {
      console.error('Error handling movie press:', error);
      navigation.navigate('MovieDetails', { movieId });
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1F" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Icon name="movie-open" size={30} color="#FF3741" />
            <Text style={styles.headerTitle}>SMR</Text>
            <TouchableOpacity>
              <Icon name="account-circle" size={30} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.mainContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FF3741"
                colors={["#FF3741"]}
              />
            }
          >

            {/* Search Bar */}
            <TouchableOpacity 
              style={styles.searchBar}
              onPress={() => navigation.navigate('Search')}
            >
              <Icon name="magnify" size={24} color="#8E8E93" />
              <Text style={styles.searchPlaceholder}>Search movies...</Text>
            </TouchableOpacity>

            {/* Categories Grid */}
            <View style={styles.categoriesGrid}>
              {movieCategories.map((category) => (
                <TouchableOpacity 
                  key={category.id}
                  style={styles.categoryCard}
                  onPress={() => handleMenuItemPress(category)}
                >
                  <Icon name={category.icon} size={32} color="#FF3741" />
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Featured Section */}
            <View style={styles.featuredSection}>
              <Text style={styles.sectionTitle}>Featured Today</Text>
              <TouchableOpacity 
                style={styles.featuredCard}
                onPress={() => navigation.navigate('Filters')}
              >
                <View style={styles.featuredContent}>
                  <Icon name="play-circle-outline" size={50} color="#FF3741" />
                  <Text style={styles.featuredText}>Start Exploring</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Recommendations Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recommended For You</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {recommendedMovies.map(movie => (
                  <TouchableOpacity
                    key={movie.id}
                    style={styles.movieCard}
                    onPress={() => navigation.navigate('MovieDetails', { movieId: movie.id })}
                  >
                    <Image
                      source={{
                        uri: movie.poster_path
                          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                          : 'https://via.placeholder.com/150x225'
                      }}
                      style={styles.moviePoster}
                    />
                    <View style={styles.movieInfo}>
                      <Text style={styles.movieTitle} numberOfLines={2}>
                        {movie.title}
                      </Text>
                      <View style={styles.ratingContainer}>
                        <Icon name="star" size={16} color="#FFD700" />
                        <Text style={styles.rating}>{movie.vote_average?.toFixed(1)}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Movie Updates Section */}
            <MovieNews navigation={navigation} />

          </ScrollView>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1A1A1F',
  },
  container: {
    flex: 1,
    backgroundColor: '#1A1A1F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#1A1A1F',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  mainContent: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  welcomeSection: {
    marginBottom: 25,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  searchPlaceholder: {
    color: '#8E8E93',
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    color: '#FFFFFF',
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  featuredSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  featuredCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  featuredContent: {
    padding: 30,
    alignItems: 'center',
  },
  featuredText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 15,
  },
  newsLoadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newsContainer: {
    paddingHorizontal: 16,
  },
  newsCard: {
    width: 300,
    marginRight: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  newsImage: {
    width: '100%',
    height: 150,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  newsContent: {
    padding: 12,
  },
  newsSource: {
    color: '#FF3741',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  newsTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 20,
  },
  newsDate: {
    color: '#8E8E93',
    fontSize: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  newsType: {
    color: '#FF3741',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  movieCard: {
    width: 150,
    marginRight: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  moviePoster: {
    width: '100%',
    height: 225,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  movieInfo: {
    padding: 12,
  },
  movieTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 20,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
});

export default HomeScreen; 





  

























