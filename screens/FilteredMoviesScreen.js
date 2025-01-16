import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const API_KEY = 'a6b600ee182f74ad61627c463ebb75e3'; // Replace with your API key

const FilteredMovies = ({ route, navigation }) => {
  const { filters } = route.params;
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const fetchFilteredMovies = async (pageNum = 1, loadMore = false) => {
    try {
      console.log('Fetching with filters:', filters); // Debug log

      // Base URL
      let url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&page=${pageNum}`;

      // Add filters
      if (filters.genres && filters.genres.length > 0) {
        url += `&with_genres=${filters.genres.join(',')}`;
      }
      if (filters.year) {
        url += `&primary_release_year=${filters.year}`;
      }
      if (filters.rating && filters.rating !== 'all') {
        const minRating = parseInt(filters.rating);
        url += `&vote_average.gte=${minRating}`;
      }
      if (filters.language) {
        url += `&with_original_language=${filters.language}`;
      }
      if (filters.sortBy) {
        url += `&sort_by=${filters.sortBy}`;
      }

      // Industry/Region mapping
      if (filters.industry) {
        const regionMap = {
          'hollywood': 'US',
          'bollywood': 'IN',
          'korean': 'KR',
          'japanese': 'JP',
          'french': 'FR',
          'spanish': 'ES',
          'tollywood': 'IN' // You might want to handle this differently
        };
        if (regionMap[filters.industry]) {
          url += `&with_origin_country=${regionMap[filters.industry]}`;
        }
      }

      console.log('Fetching URL:', url); // Debug log

      const response = await fetch(url);
      const data = await response.json();

      console.log('API Response:', data); // Debug log

      if (data.results) {
        if (loadMore) {
          setMovies(prev => [...prev, ...data.results]);
        } else {
          setMovies(data.results);
        }
        setTotalPages(data.total_pages);
      }
    } catch (error) {
      console.error('Error fetching filtered movies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setPage(1);
    fetchFilteredMovies(1, false);
  }, [filters]);

  const handleLoadMore = () => {
    if (page < totalPages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFilteredMovies(nextPage, true);
    }
  };

  const renderMovie = ({ item }) => (
    <TouchableOpacity
      style={styles.movieCard}
      onPress={() => navigation.navigate('MovieDetails', { movieId: item.id })}
    >
      <Image
        source={{
          uri: item.poster_path
            ? `${IMAGE_BASE_URL}${item.poster_path}`
            : 'https://via.placeholder.com/300x450'
        }}
        style={styles.moviePoster}
        resizeMode="cover"
      />
      <View style={styles.movieInfo}>
        <Text style={styles.movieTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.movieMeta}>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>{item.vote_average?.toFixed(1)}</Text>
          </View>
          <Text style={styles.year}>
            {item.release_date?.split('-')[0] || 'N/A'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!loading || page === 1) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="large" color="#FF3741" />
      </View>
    );
  };

  if (loading && page === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filtered Movies</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3741" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {movies.length > 0 ? `${movies.length} Movies Found` : 'Filtered Movies'}
        </Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={movies}
        renderItem={renderMovie}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.movieGrid}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Icon name="movie-search" size={64} color="#8E8E93" />
            <Text style={styles.emptyText}>No movies found with these filters</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  movieGrid: {
    padding: 16,
  },
  movieCard: {
    width: CARD_WIDTH,
    margin: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  moviePoster: {
    width: '100%',
    height: CARD_WIDTH * 1.5,
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
  },
  movieMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    color: '#FFD700',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: 'bold',
  },
  year: {
    color: '#8E8E93',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 100,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default FilteredMovies; 