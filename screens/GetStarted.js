import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

const GetStarted = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <SafeAreaView style={styles.container}>
        <View style={styles.background}>
          {/* Cinema reel decoration */}
          <View style={styles.reelDecoration}>
            <Icon name="filmstrip" size={150} color="rgba(255, 55, 65, 0.05)" />
          </View>
          
          <View style={styles.contentContainer}>
            <View style={styles.headerContainer}>
              <Icon name="movie-open" size={60} color="#FF3741" />
              <Text style={styles.title}>SMR</Text>
              <Text style={styles.subtitle}>
                Your Personal Movie Curator
              </Text>
              <Text style={styles.description}>
                Discover movies tailored to your taste. Get personalized recommendations, 
                reviews, and find your next favorite film.
              </Text>
            </View>

            <View style={styles.featureContainer}>
              <View style={styles.featureItem}>
                <Icon name="star" size={24} color="#FFD700" />
                <Text style={styles.featureText}>Personalized Recommendations</Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="playlist-play" size={24} color="#FFD700" />
                <Text style={styles.featureText}>Curated Watchlists</Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('Home')}
            >
              <Text style={styles.buttonText}>Get Started</Text>
              <Icon name="arrow-right" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    backgroundColor: '#1A1A1F', // Dark theater-like background
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 30,
    backgroundColor: 'transparent',
  },
  reelDecoration: {
    position: 'absolute',
    top: '20%',
    right: -30,
    opacity: 0.5,
    transform: [{ rotate: '45deg' }],
  },
  headerContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: 2,
    textShadowColor: '#FF3741',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 20,
    color: '#FF3741', // Cinema red
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#AAAAAA',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featureContainer: {
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  featureText: {
    color: '#FFFFFF',
    marginLeft: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF3741', // Cinema red
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
    marginBottom: 50,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#FF3741',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginRight: 10,
  },
  buttonIcon: {
    marginLeft: 5,
  },
});

export default GetStarted; 