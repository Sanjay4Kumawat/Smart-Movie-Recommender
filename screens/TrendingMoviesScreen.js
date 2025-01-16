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
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.42;
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const API_KEY = 'a6b600ee182f74ad61627c463ebb75e3';

const MovieCard = ({ movie, onPress }) => (
  <TouchableOpacity style={styles.movieCard} onPress={onPress}>
    <Image
      source={{
        uri: movie.poster_path
          ? `${IMAGE_BASE_URL}${movie.poster_path}`
          : 'https://via.placeholder.com/300x450'
      }}
      style={styles.moviePoster}
      resizeMode="cover"
    />
    <View style={styles.movieInfo}>
      <Text style={styles.movieTitle} numberOfLines={2}>
        {movie.title}
      </Text>
      <View style={styles.movieMeta}>
        <View style={styles.ratingContainer}>
          <Icon name="star" size={16} color="#FFD700" />
          <Text style={styles.rating}>{movie.vote_average?.toFixed(1)}</Text>
        </View>
        <Text style={styles.year}>
          {movie.release_date?.split('-')[0] || 'N/A'}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

const Trending = ({ navigation }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrendingMovies = async (pageNum = 1, refresh = false) => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}&page=${pageNum}`
      );
      const data = await response.json();
      
      if (data.results) {
        if (refresh || pageNum === 1) {
          setMovies(data.results);
        } else {
          setMovies(prev => [...prev, ...data.results]);
        }
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching trending movies:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrendingMovies();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTrendingMovies(1, true);
  };

  const handleLoadMore = () => {
    if (!loading) {
      fetchTrendingMovies(page + 1);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF3741" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1F" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trending Movies</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={movies}
        renderItem={({ item }) => (
          <MovieCard
            movie={item}
            onPress={() => navigation.navigate('MovieDetails', { movieId: item.id })}
          />
        )}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.movieGrid}
        showsVerticalScrollIndicator={false}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => (
          loading && movies.length > 0 ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#FF3741" />
            </View>
          ) : null
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  movieGrid: {
    padding: 8,
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default Trending; 