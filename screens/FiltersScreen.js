import React, { useState } from 'react';
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

const genres = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 18, name: 'Drama' },
  { id: 14, name: 'Fantasy' },
  { id: 27, name: 'Horror' },
  { id: 9648, name: 'Mystery' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Sci-Fi' },
  { id: 53, name: 'Thriller' },
  { id: 99, name: 'Documentary' },
  { id: 10402, name: 'Musical' },
  { id: 10751, name: 'Family' },
  { id: 37, name: 'Western' }
];

const years = ['2024', '2023', '2022', '2021', '2020', '2019', '2018'];

const ratings = [
  { value: 'all', label: 'All Ratings' },
  { value: '9+', label: '9+ Rating' },
  { value: '8+', label: '8+ Rating' },
  { value: '7+', label: '7+ Rating' },
];

const filmIndustries = [
  { id: 'hollywood', name: 'Hollywood' },
  { id: 'bollywood', name: 'Bollywood' },
  { id: 'tollywood', name: 'Tollywood' },
  { id: 'korean', name: 'Korean' },
  { id: 'japanese', name: 'Japanese' },
  { id: 'french', name: 'French' },
  { id: 'spanish', name: 'Spanish' }
];

const languages = [
  { id: 'en', name: 'English' },
  { id: 'hi', name: 'Hindi' },
  { id: 'te', name: 'Telugu' },
  { id: 'ta', name: 'Tamil' },
  { id: 'ko', name: 'Korean' },
  { id: 'ja', name: 'Japanese' },
  { id: 'fr', name: 'French' },
  { id: 'es', name: 'Spanish' }
];

const sortOptions = [
  { value: 'popularity.desc', label: 'Most Popular' },
  { value: 'vote_average.desc', label: 'Highest Rated' },
  { value: 'release_date.desc', label: 'Latest Release' },
  { value: 'revenue.desc', label: 'Box Office' }
];

const FiltersScreen = () => {
  const navigation = useNavigation();
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedRating, setSelectedRating] = useState('all');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedSort, setSelectedSort] = useState('popularity.desc');

  const resetFilters = () => {
    setSelectedGenres([]);
    setSelectedYear('');
    setSelectedRating('all');
    setSelectedIndustry('');
    setSelectedLanguage('');
    setSelectedSort('popularity.desc');
  };

  const toggleGenre = (genreId) => {
    if (selectedGenres.includes(genreId)) {
      setSelectedGenres(selectedGenres.filter(id => id !== genreId));
    } else {
      setSelectedGenres([...selectedGenres, genreId]);
    }
  };

  const applyFilters = () => {
    const filters = {
      genres: selectedGenres,
      year: selectedYear,
      rating: selectedRating,
      industry: selectedIndustry,
      language: selectedLanguage,
      sortBy: selectedSort
    };
    
    navigation.navigate('FilteredMovies', { filters });
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1F" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Filters</Text>
            <TouchableOpacity 
              onPress={resetFilters}
              style={styles.resetButton}
            >
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Film Industry Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Film Industry</Text>
              <View style={styles.filterGrid}>
                {filmIndustries.map(industry => (
                  <TouchableOpacity
                    key={industry.id}
                    style={[
                      styles.filterButton,
                      selectedIndustry === industry.id && styles.filterButtonActive
                    ]}
                    onPress={() => setSelectedIndustry(industry.id)}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      selectedIndustry === industry.id && styles.filterButtonTextActive
                    ]}>
                      {industry.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Language Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Language</Text>
              <View style={styles.filterGrid}>
                {languages.map(lang => (
                  <TouchableOpacity
                    key={lang.id}
                    style={[
                      styles.filterButton,
                      selectedLanguage === lang.id && styles.filterButtonActive
                    ]}
                    onPress={() => setSelectedLanguage(lang.id)}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      selectedLanguage === lang.id && styles.filterButtonTextActive
                    ]}>
                      {lang.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Genres Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Genres</Text>
              <View style={styles.genreGrid}>
                {genres.map(genre => (
                  <TouchableOpacity
                    key={genre.id}
                    style={[
                      styles.filterButton,
                      selectedGenres.includes(genre.id) && styles.filterButtonActive
                    ]}
                    onPress={() => toggleGenre(genre.id)}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      selectedGenres.includes(genre.id) && styles.filterButtonTextActive
                    ]}>
                      {genre.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Year Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Year</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.yearContainer}>
                  {years.map(year => (
                    <TouchableOpacity
                      key={year}
                      style={[
                        styles.filterButton,
                        selectedYear === year && styles.filterButtonActive
                      ]}
                      onPress={() => setSelectedYear(year)}
                    >
                      <Text style={[
                        styles.filterButtonText,
                        selectedYear === year && styles.filterButtonTextActive
                      ]}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Ratings Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rating</Text>
              <View style={styles.ratingContainer}>
                {ratings.map(rating => (
                  <TouchableOpacity
                    key={rating.value}
                    style={[
                      styles.filterButton,
                      selectedRating === rating.value && styles.filterButtonActive
                    ]}
                    onPress={() => setSelectedRating(rating.value)}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      selectedRating === rating.value && styles.filterButtonTextActive
                    ]}>
                      {rating.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Sort By Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sort By</Text>
              <View style={styles.filterGrid}>
                {sortOptions.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.filterButton,
                      selectedSort === option.value && styles.filterButtonActive
                    ]}
                    onPress={() => setSelectedSort(option.value)}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      selectedSort === option.value && styles.filterButtonTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Apply Button */}
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={applyFilters}
          >
            <Text style={styles.applyButtonText}>
              Apply Filters ({selectedGenres.length + 
                (selectedYear ? 1 : 0) + 
                (selectedRating !== 'all' ? 1 : 0) + 
                (selectedIndustry ? 1 : 0) + 
                (selectedLanguage ? 1 : 0)})
            </Text>
          </TouchableOpacity>
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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  resetButton: {
    padding: 8,
  },
  resetText: {
    color: '#FF3741',
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  genreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  yearContainer: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  filterButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    margin: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#FF3741',
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  filterButtonTextActive: {
    fontWeight: 'bold',
  },
  applyButton: {
    backgroundColor: '#FF3741',
    margin: 20,
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
});

export default FiltersScreen; 