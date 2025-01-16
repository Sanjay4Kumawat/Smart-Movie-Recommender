import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
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
const CARD_WIDTH = (width - 48) / 2;
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const API_KEY = 'a6b600ee182f74ad61627c463ebb75e3';
const SEARCH_HISTORY_KEY = '@moviemate_search_history';
const MAX_HISTORY_ITEMS = 10;
const RECENT_SEARCHES_KEY = '@moviemate_recent_searches';
const MAX_RECENT_SEARCHES = 10;

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

const Search = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('movies');

  useEffect(() => {
    loadHistory();
    fetchTrending();
  }, []);

  const loadHistory = async () => {
    try {
      const saved = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const saveHistory = async (movie) => {
    try {
      const newHistory = [movie, ...history.filter(m => m.id !== movie.id)]
        .slice(0, MAX_HISTORY_ITEMS);
      setHistory(newHistory);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  const clearHistory = async () => {
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
      setHistory([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  };

  const fetchTrending = async () => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/trending/movie/day?api_key=${API_KEY}`
      );
      const data = await response.json();
      if (data.results) {
        setTrending(data.results);
      }
    } catch (error) {
      console.error('Error fetching trending:', error);
    }
  };

  const handleSearch = async (text) => {
    setQuery(text);
    if (text.length > 2) {
      try {
        setLoading(true);
        const response = await fetch(
          `https://api.themoviedb.org/3/search/${activeTab === 'tv' ? 'tv' : 'movie'}?api_key=${API_KEY}&query=${encodeURIComponent(text)}`
        );
        const data = await response.json();
        
        const transformedResults = data.results.map(item => ({
          ...item,
          title: activeTab === 'tv' ? item.name : item.title,
          release_date: activeTab === 'tv' ? item.first_air_date : item.release_date,
          id: item.id,
          name: item.name,
          first_air_date: item.first_air_date,
          poster_path: item.poster_path,
          backdrop_path: item.backdrop_path,
          vote_average: item.vote_average,
          overview: item.overview
        }));

        setResults(transformedResults);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setResults([]);
    }
  };

  const handleMoviePress = (movie) => {
    saveHistory(movie);
    navigation.navigate('MovieDetails', { movie });
  };

  const TabSelector = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'movies' && styles.activeTab]}
        onPress={() => {
          setActiveTab('movies');
          if (query.length > 2) handleSearch(query);
        }}
      >
        <Icon 
          name="movie" 
          size={20} 
          color={activeTab === 'movies' ? '#FF3741' : '#FFFFFF'} 
        />
        <Text style={[styles.tabText, activeTab === 'movies' && styles.activeTabText]}>
          Movies
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'tv' && styles.activeTab]}
        onPress={() => {
          setActiveTab('tv');
          if (query.length > 2) handleSearch(query);
        }}
      >
        <Icon 
          name="television-classic" 
          size={20} 
          color={activeTab === 'tv' ? '#FF3741' : '#FFFFFF'} 
        />
        <Text style={[styles.tabText, activeTab === 'tv' && styles.activeTabText]}>
          TV Shows
        </Text>
      </TouchableOpacity>
    </View>
  );

  const saveRecentSearch = async (item) => {
    try {
      const savedSearches = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      let recentSearches = savedSearches ? JSON.parse(savedSearches) : [];
      
      recentSearches = recentSearches.filter(search => search.id !== item.id);
      recentSearches.unshift(item);
      
      if (recentSearches.length > MAX_RECENT_SEARCHES) {
        recentSearches = recentSearches.slice(0, MAX_RECENT_SEARCHES);
      }
      
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recentSearches));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        saveRecentSearch(item);
        if (activeTab === 'tv') {
          navigation.push('TvDetails', {
            showId: item.id,
          });
        } else {
          navigation.push('MovieDetails', { 
            movieId: item.id 
          });
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
        resizeMode="cover"
      />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {activeTab === 'tv' ? item.name : item.title}
        </Text>
        <View style={styles.cardMeta}>
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

  const RecentSearches = () => {
    const [recentSearches, setRecentSearches] = useState([]);

    useEffect(() => {
      loadRecentSearches();
    }, []);

    const loadRecentSearches = async () => {
      try {
        const saved = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
        if (saved) {
          setRecentSearches(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    };

    if (recentSearches.length === 0 || query.length > 2) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Searches</Text>
          <TouchableOpacity
            onPress={async () => {
              await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
              setRecentSearches([]);
            }}
          >
            <Text style={styles.clearButton}>Clear All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={recentSearches}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.row}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1F" />
      
      <View style={styles.searchBar}>
        <Icon name="magnify" size={24} color="#8E8E93" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search movies..."
          placeholderTextColor="#8E8E93"
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Icon name="close" size={24} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>

      <TabSelector />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF3741" />
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderItem}
          keyExtractor={item => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.row}
          ListEmptyComponent={() => (
            query.length > 2 ? (
              <View style={styles.emptyContainer}>
                <Icon 
                  name={activeTab === 'tv' ? 'television-classic' : 'movie-search'} 
                  size={64} 
                  color="#8E8E93" 
                />
                <Text style={styles.emptyText}>
                  No {activeTab === 'tv' ? 'TV shows' : 'movies'} found
                </Text>
              </View>
            ) : (
              <RecentSearches />
            )
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1F',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    margin: 16,
    padding: 12,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    marginLeft: 8,
    marginRight: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  clearButton: {
    color: '#FF3741',
    fontSize: 14,
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
  historyList: {
    paddingHorizontal: 8,
  },
  historyItem: {
    width: 100,
    marginHorizontal: 8,
  },
  historyPoster: {
    width: 100,
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  historyTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
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
  resultsList: {
    padding: 8,
  },
  resultItem: {
    width: CARD_WIDTH,
    margin: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  posterImage: {
    width: '100%',
    height: CARD_WIDTH * 1.5,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  itemInfo: {
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
  cardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardMeta: {
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
});

export default Search; 