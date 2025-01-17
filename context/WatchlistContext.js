import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WatchlistContext = createContext();

const WATCHLIST_KEY = '@moviemate_watchlist';

export const WatchlistProvider = ({ children }) => {
  const [watchlist, setWatchlist] = useState({ movies: [], tvShows: [] });

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    try {
      const saved = await AsyncStorage.getItem(WATCHLIST_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Handle legacy format (backwards compatibility)
        if (Array.isArray(parsed)) {
          setWatchlist({ movies: parsed, tvShows: [] });
        } else {
          setWatchlist(parsed);
        }
      }
    } catch (error) {
      console.error('Error loading watchlist:', error);
    }
  };

  const saveWatchlist = async (newWatchlist) => {
    try {
      await AsyncStorage.setItem(WATCHLIST_KEY, JSON.stringify(newWatchlist));
      setWatchlist(newWatchlist);
    } catch (error) {
      console.error('Error saving watchlist:', error);
    }
  };

  const isInWatchlist = (id, type = 'movie') => {
    const list = type === 'tv' ? watchlist.tvShows : watchlist.movies;
    return list.includes(Number(id));
  };

  const addToWatchlist = async (id, type = 'movie') => {
    const list = type === 'tv' ? 'tvShows' : 'movies';
    const numericId = Number(id);
    
    if (!watchlist[list].includes(numericId)) {
      const newWatchlist = {
        ...watchlist,
        [list]: [...watchlist[list], numericId]
      };
      await saveWatchlist(newWatchlist);
    }
  };

  const removeFromWatchlist = async (id, type = 'movie') => {
    const list = type === 'tv' ? 'tvShows' : 'movies';
    const numericId = Number(id);
    
    const newWatchlist = {
      ...watchlist,
      [list]: watchlist[list].filter(item => item !== numericId)
    };
    await saveWatchlist(newWatchlist);
  };

  return (
    <WatchlistContext.Provider 
      value={{ 
        watchlist, 
        isInWatchlist,
        addToWatchlist,
        removeFromWatchlist,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
};

export const useWatchlist = () => useContext(WatchlistContext); 