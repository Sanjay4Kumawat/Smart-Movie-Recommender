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

// Rest of your code exactly as provided... 

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.9;
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const API_KEY = 'a6b600ee182f74ad61627c463ebb75e3';

const MovieCard = ({ movie, onPress }) => {
  const releaseDate = new Date(movie.release_date);
  const today = new Date();
  const daysUntilRelease = Math.ceil((releaseDate - today) / (1000 * 60 * 60 * 24));

  return (
    <TouchableOpacity style={styles.movieCard} onPress={onPress}>
      <Image
        source={{
          uri: movie.backdrop_path
            ? `${IMAGE_BASE_URL}${movie.backdrop_path}`
            : 'https://via.placeholder.com/500x281'
        }}
        style={styles.movieBackdrop}
        resizeMode="cover"
      />
      <View style={styles.overlay}>
        <View style={styles.releaseInfo}>
          <Text style={styles.releaseDate}>
            {releaseDate.toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric'
            })}
          </Text>
          <Text style={styles.daysUntil}>
            {daysUntilRelease > 0 ? `${daysUntilRelease} days until release` : 'Released'}
          </Text>
        </View>
        <View style={styles.movieInfo}>
          <Text style={styles.movieTitle} numberOfLines={2}>
            {movie.title}
          </Text>
          {movie.vote_average > 0 && (
            <View style={styles.ratingContainer}>
              <Icon name="star" size={16} color="#FFD700" />
              <Text style={styles.rating}>{movie.vote_average?.toFixed(1)}</Text>
            </View>
          )}
          <Text style={styles.overview} numberOfLines={3}>
            {movie.overview}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const ComingSoon = ({ navigation }) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUpcomingMovies = async (pageNum = 1, refresh = false) => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}&language=en-US&page=${pageNum}`
      );
      const data = await response.json();
      
      if (data.results) {
        const sortedMovies = data.results.sort((a, b) => 
          new Date(a.release_date) - new Date(b.release_date)
        );
        
        if (refresh || pageNum === 1) {
          setMovies(sortedMovies);
        } else {
          setMovies(prev => [...prev, ...sortedMovies]);
        }
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error fetching upcoming movies:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUpcomingMovies();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUpcomingMovies(1, true);
  };

  const handleLoadMore = () => {
    if (!loading) {
      fetchUpcomingMovies(page + 1);
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
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coming Soon</Text>
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
        contentContainerStyle={styles.movieList}
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
  movieList: {
    padding: 16,
  },
  movieCard: {
    width: CARD_WIDTH,
    height: 280,
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  movieBackdrop: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'space-between',
  },
  releaseInfo: {
    padding: 16,
    backgroundColor: 'rgba(255,55,65,0.9)',
  },
  releaseDate: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  daysUntil: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
  },
  movieInfo: {
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  movieTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    color: '#FFD700',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: 'bold',
  },
  overview: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default ComingSoon; 