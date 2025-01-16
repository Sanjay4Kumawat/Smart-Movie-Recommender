import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
  const navigation = useNavigation();

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

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1F" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Icon name="movie-open" size={30} color="#FF3741" />
            <Text style={styles.headerTitle}>MovieMate</Text>
            <TouchableOpacity>
              <Icon name="account-circle" size={30} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.mainContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
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
    marginBottom: 25,
  },
  categoryCard: {
    width: '50%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryTitle: {
    color: '#FFFFFF',
    marginTop: 10,
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
});

export default HomeScreen; 