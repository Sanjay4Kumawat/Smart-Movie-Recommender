import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import GetStarted from './screens/GetStarted';
import HomeScreen from './screens/HomeScreen';
import FiltersScreen from './screens/FiltersScreen';
import FilteredMoviesScreen from './screens/FilteredMoviesScreen';
import MovieDetailsScreen from './screens/MovieDetailsScreen';
import TrendingMoviesScreen from './screens/TrendingMoviesScreen';
import TopRatedMoviesScreen from './screens/TopRatedMoviesScreen';
import SearchScreen from './screens/SearchScreen';
import WatchList from './screens/WatchList';
import ComingSoon from './screens/ComingSoon';
import { WatchlistProvider } from './context/WatchlistContext';
import TvDetails from './screens/TvDetailsScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <WatchlistProvider>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="GetStarted"
            screenOptions={{
              headerShown: false
            }}
          >
            <Stack.Screen name="GetStarted" component={GetStarted} />
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Filters" component={FiltersScreen} />
            <Stack.Screen name="FilteredMovies" component={FilteredMoviesScreen} />
            <Stack.Screen name="MovieDetails" component={MovieDetailsScreen} />
            <Stack.Screen name="WatchList" component={WatchList} />
            <Stack.Screen name="Trending" component={TrendingMoviesScreen} />
            <Stack.Screen name="TopRated" component={TopRatedMoviesScreen} />
            <Stack.Screen name="ComingSoon" component={ComingSoon} />
            <Stack.Screen name="Search" component={SearchScreen} />
            <Stack.Screen name="TvDetails" component={TvDetails} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </WatchlistProvider>
  );
};

export default App;
