import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useWatchlist } from '../context/WatchlistContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const API_KEY = 'a6b600ee182f74ad61627c463ebb75e3';

const WatchList = ({ navigation }) => {
  const { watchlist, removeFromWatchlist } = useWatchlist();
  const [movies, setMovies] = useState([]);
  const [tvShows, setTvShows] = useState([]);
  const [activeTab, setActiveTab] = useState('movies'); // 'movies' or 'tv'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWatchlistItems();
  }, [watchlist]);

  const fetchWatchlistItems = async () => {
    try {
      const moviePromises = watchlist.movies.map(id =>
        fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=${API_KEY}`)
          .then(res => res.json())
      );

      const tvPromises = watchlist.tvShows.map(id =>
        fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${API_KEY}`)
          .then(res => res.json())
      );

      const movieResults = await Promise.all(moviePromises);
      const tvResults = await Promise.all(tvPromises);

      setMovies(movieResults.filter(item => !item.hasOwnProperty('success')));
      setTvShows(tvResults.filter(item => !item.hasOwnProperty('success')));
    } catch (error) {
      console.error('Error fetching watchlist items:', error);
    } finally {
      setLoading(false);
    }
  };

  const TabSelector = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'movies' && styles.activeTab]}
        onPress={() => setActiveTab('movies')}
      >
        <Icon 
          name="movie" 
          size={20} 
          color={activeTab === 'movies' ? '#FF3741' : '#FFFFFF'} 
        />
        <Text style={[styles.tabText, activeTab === 'movies' && styles.activeTabText]}>
          Movies ({movies.length})
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'tv' && styles.activeTab]}
        onPress={() => setActiveTab('tv')}
      >
        <Icon 
          name="television-classic" 
          size={20} 
          color={activeTab === 'tv' ? '#FF3741' : '#FFFFFF'} 
        />
        <Text style={[styles.tabText, activeTab === 'tv' && styles.activeTabText]}>
          TV Shows ({tvShows.length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        if (activeTab === 'tv') {
          navigation.navigate('TvDetails', { showId: item.id });
        } else {
          navigation.navigate('MovieDetails', { movieId: item.id });
        }
      }}
    >
      <Image
        source={{
          uri: item.poster_path
            ? `${IMAGE_BASE_URL}${item.poster_path}`
            : 'https://via.placeholder.com/300x450'
        }}
        style={styles.cardPoster}
      />
      <View style={styles.cardInfo}>
        <Text style={styles.title} numberOfLines={2}>
          {activeTab === 'tv' ? item.name : item.title}
        </Text>
        <View style={styles.metaInfo}>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={16} color="#FFD700" />
            <Text style={styles.rating}>{item.vote_average?.toFixed(1)}</Text>
          </View>
          <Text style={styles.year}>
            {(activeTab === 'tv' ? item.first_air_date : item.release_date)?.split('-')[0] || 'N/A'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const EmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon 
        name={activeTab === 'tv' ? 'television-classic' : 'movie-search'} 
        size={64} 
        color="#8E8E93" 
      />
      <Text style={styles.emptyText}>
        No {activeTab === 'tv' ? 'TV shows' : 'movies'} in your watchlist
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1F" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Watchlist</Text>
      </View>

      <TabSelector />

      <FlatList
        data={activeTab === 'movies' ? movies : tvShows}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        numColumns={2}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={EmptyList}
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
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  activeTab: {
    backgroundColor: 'rgba(255,55,65,0.1)',
  },
  tabText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
  },
  activeTabText: {
    color: '#FF3741',
    fontWeight: 'bold',
  },
  gridContainer: {
    padding: 16,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    width: CARD_WIDTH,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardPoster: {
    width: '100%',
    height: CARD_WIDTH * 1.5,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  cardInfo: {
    padding: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metaInfo: {
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
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});

export default WatchList; 










