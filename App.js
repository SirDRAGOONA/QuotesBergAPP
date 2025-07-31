import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  ImageBackground,
  Dimensions,
  Alert,
  Vibration,
  StatusBar,
  ScrollView,
  Share,
  BackHandler,
  PanResponder,
  Image // Add this import
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

const [imageCache, setImageCache] = useState({});

// Add this useEffect after your existing ones
useEffect(() => {
  // Preload all images
  quotes.forEach(quote => {
    if (!imageCache[quote.id]) {
      Image.prefetch(quote.image.uri).then(() => {
        setImageCache(prev => ({ ...prev, [quote.id]: true }));
      });
    }
  });
}, []);


const quotes = [
  {
    id: 1,
    text: "The horizon only expands for those who venture beyond it.",
    author: "Expeditionary Wisdom",
    image: { uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1500&q=80' }
  },
  {
    id: 2,
    text: "Adventure is not about the destination, but the courage to seek the unknown.",
    author: "Explorer's Code",
    image: { uri: 'https://images.unsplash.com/photo-1464822759843-ad069f7e1c93?auto=format&fit=crop&w=1500&q=80' }
  },
  {
    id: 3,
    text: "Let the maps end. Let curiosity begin.",
    author: "Anonymous Traveler",
    image: { uri: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1500&q=80' }
  },
  {
    id: 4,
    text: "Remote places reveal what we hide from in ourselves.",
    author: "Wilderness Guide",
    image: { uri: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1500&q=80' }
  },
  {
    id: 5,
    text: "In each step away from comfort, there is a world anew.",
    author: "Modern Nomad",
    image: { uri: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1500&q=80' }
  },
  {
    id: 6,
    text: "The wild welcomes those who greet it with respect.",
    author: "Ancient Wisdom",
    image: { uri: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1500&q=80' }
  },
  {
    id: 7,
    text: "To travel is not to escape life, but to find it truly lived.",
    author: "E.M. Forster",
    image: { uri: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1500&q=80' }
  },
  {
    id: 8,
    text: "Mountains teach patience, seas teach humility.",
    author: "Nature's Lessons",
    image: { uri: 'https://images.unsplash.com/photo-1464822759843-ad069f7e1c93?auto=format&fit=crop&w=1500&q=80' }
  },
  {
    id: 9,
    text: "We are all just visitors beneath ancient skies.",
    author: "Cosmic Perspective",
    image: { uri: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&w=1500&q=80' }
  },
  {
    id: 10,
    text: "Let your journey be long, your mind open, your heart at rest.",
    author: "Traveler's Blessing",
    image: { uri: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1500&q=80' }
  }
];

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([0]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [stats, setStats] = useState({ viewed: 0, favorites: 0, authors: 0 });
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const likeAnim = useRef(new Animated.Value(0)).current;
  const menuAnim = useRef(new Animated.Value(-300)).current;
  
  // Sound
  const [sound, setSound] = useState();

  useEffect(() => {
    loadStoredData();
    setupBackHandler();
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    updateStats();
    saveData();
  }, [favorites, currentIndex]);

  const setupBackHandler = () => {
    const backAction = () => {
      if (menuVisible) {
        toggleMenu();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  };

  const loadStoredData = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem('favorites');
      const storedStats = await AsyncStorage.getItem('stats');
      
      if (storedFavorites) {
        setFavorites(JSON.parse(storedFavorites));
      }
      if (storedStats) {
        setStats(JSON.parse(storedStats));
      }
    } catch (error) {
      console.log('Error loading data:', error);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
      await AsyncStorage.setItem('stats', JSON.stringify(stats));
    } catch (error) {
      console.log('Error saving data:', error);
    }
  };

  const updateStats = () => {
    const uniqueAuthors = new Set(history.map(index => quotes[index].author));
    setStats({
      viewed: history.length,
      favorites: favorites.length,
      authors: uniqueAuthors.size
    });
  };

  const playLikeSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.wav' }
      );
      setSound(sound);
      await sound.playAsync();
    } catch (error) {
      // Fallback to vibration if sound fails
      Vibration.vibrate(100);
    }
  };

  const animateTransition = (callback) => {
  Animated.sequence([
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150, // Faster fade out
      useNativeDriver: true,
    }),
    Animated.timing(slideAnim, {
      toValue: 30, // Smaller slide distance
      duration: 0,
      useNativeDriver: true,
    })
  ]).start(() => {
    callback();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300, // Faster fade in
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300, // Faster slide back
        useNativeDriver: true,
      })
    ]).start();
  });
};

  const generateQuote = () => {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * quotes.length);
    } while (newIndex === currentIndex && quotes.length > 1);
    
    animateTransition(() => {
      setCurrentIndex(newIndex);
      setHistory(prev => [...prev, newIndex]);
    });
  };

  const previousQuote = () => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      const prevIndex = newHistory[newHistory.length - 1];
      
      animateTransition(() => {
        setCurrentIndex(prevIndex);
        setHistory(newHistory);
      });
    } else {
      Alert.alert('Info', 'No previous quotes in history');
    }
  };

const toggleFavorite = () => {
  const isFavorited = favorites.includes(currentIndex);
  let newFavorites;
  
  if (isFavorited) {
    newFavorites = favorites.filter(item => item !== currentIndex);
    // Simple visual feedback instead of dialog
    Vibration.vibrate(50);
  } else {
    newFavorites = [...favorites, currentIndex];
    playLikeSound();
    animateLike(); // This shows the heart animation
    Vibration.vibrate([50, 100, 50]); // Double vibration pattern
  }
  
  setFavorites(newFavorites);
};


const animateLike = () => {
  likeAnim.setValue(0);
  Animated.sequence([
    Animated.timing(likeAnim, {
      toValue: 1,
      duration: 300, // Slightly longer animation
      useNativeDriver: true,
    }),
    Animated.timing(likeAnim, {
      toValue: 0,
      duration: 1200, // Longer fade out
      useNativeDriver: true,
    })
  ]).start();
};


  const shareQuote = async () => {
    try {
      const quote = quotes[currentIndex];
      await Share.share({
        message: `"${quote.text}" — ${quote.author}\n\nShared from Expedition Quotes`,
        title: 'Inspirational Quote'
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share quote');
    }
  };

  const toggleMenu = () => {
    const toValue = menuVisible ? -300 : 0;
    setMenuVisible(!menuVisible);
    
    Animated.timing(menuAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const showFavorites = () => {
    if (favorites.length === 0) {
      Alert.alert('No Favorites', 'You haven\'t favorited any quotes yet!');
      return;
    }
    
    Alert.alert(
      'Your Favorites',
      `You have ${favorites.length} favorite quotes`,
      [
        { text: 'View Random', onPress: () => {
          const randomFav = favorites[Math.floor(Math.random() * favorites.length)];
          animateTransition(() => {
            setCurrentIndex(randomFav);
            setHistory(prev => [...prev, randomFav]);
          });
          toggleMenu();
        }},
        { text: 'Close' }
      ]
    );
  };

  // Swipe gestures
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 20;
    },
    onPanResponderMove: (evt, gestureState) => {
      // Optional: Add visual feedback during swipe
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dx > 50) {
        previousQuote();
      } else if (gestureState.dx < -50) {
        generateQuote();
      }
    },
  });

  const currentQuote = quotes[currentIndex];
  const isFavorited = favorites.includes(currentIndex);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <ImageBackground
        source={currentQuote.image}
        style={styles.background}
        imageStyle={styles.backgroundImage}
        resizeMode="cover"
      >
        <View style={styles.overlay} />
        
        {/* Menu Button */}
        <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
          <Text style={styles.menuButtonText}>☰</Text>
        </TouchableOpacity>

        {/* Stats Corner */}
        <View style={styles.statsCorner}>
          <Text style={styles.statsNumber}>{stats.favorites}</Text>
          <Text style={styles.statsLabel}>Favorites</Text>
        </View>

        {/* Main Content */}
        <Animated.View 
          style={[
            styles.quoteContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
          {...panResponder.panHandlers}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.quoteText}>"{currentQuote.text}"</Text>
            <Text style={styles.authorText}>— {currentQuote.author}</Text>
          </ScrollView>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={previousQuote}>
              <Text style={styles.buttonText}>← Previous</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.button} onPress={generateQuote}>
              <Text style={styles.buttonText}>New Quote</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, isFavorited && styles.favoriteButton]} 
              onPress={toggleFavorite}
            >
              <Text style={styles.buttonText}>
                {isFavorited ? '❤️ Liked' : '🤍 Like'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.shareButton} onPress={shareQuote}>
            <Text style={styles.shareButtonText}>📤 Share Quote</Text>
          </TouchableOpacity>

          <Text style={styles.statusText}>
            Quote {history.length} | {stats.favorites} favorites | {stats.authors} authors
          </Text>
        </Animated.View>

        {/* Like Animation */}
        <Animated.View 
          style={[
            styles.likeAnimation,
            {
              opacity: likeAnim,
              transform: [{
                scale: likeAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 1.5, 0]
                })
              }]
            }
          ]}
        >
          <Text style={styles.likeAnimationText}>❤️</Text>
        </Animated.View>

        {/* Side Menu */}
        <Animated.View 
          style={[
            styles.sideMenu,
            { transform: [{ translateX: menuAnim }] }
          ]}
        >
          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>📊 Your Stats</Text>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Quotes Viewed:</Text>
              <Text style={styles.statValue}>{stats.viewed}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Favorites:</Text>
              <Text style={styles.statValue}>{stats.favorites}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Authors Discovered:</Text>
              <Text style={styles.statValue}>{stats.authors}</Text>
            </View>

            <TouchableOpacity style={styles.menuButton2} onPress={showFavorites}>
              <Text style={styles.menuButtonText2}>⭐ View Favorites</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuButton2} onPress={toggleMenu}>
              <Text style={styles.menuButtonText2}>✕ Close Menu</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: windowWidth,
    height: windowHeight,
  },
  backgroundImage: {
    opacity: 0.8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(26, 24, 35, 0.4)',
  },
menuButton: {
  position: 'absolute',
  top: 60, // Increased for better touch area
  left: 20,
  backgroundColor: 'rgba(42, 39, 50, 0.9)',
  borderRadius: 12,
  padding: 16, // Increased padding for better touch
  zIndex: 1000, // Higher z-index
  elevation: 10, // For Android
},
  menuButtonText: {
    color: '#d4af37',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsCorner: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(42, 39, 50, 0.9)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    zIndex: 100,
  },
  statsNumber: {
    color: '#d4af37',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsLabel: {
    color: '#e8e3d3',
    fontSize: 12,
    opacity: 0.8,
  },
  quoteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 100,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  quoteText: {
    fontSize: 26,
    color: '#e8e3d3',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 24,
    fontFamily: 'serif',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  authorText: {
    fontSize: 18,
    color: '#d4af37',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 40,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#d4af37',
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 14,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  favoriteButton: {
    backgroundColor: '#ff3040',
  },
  buttonText: {
    color: '#1a1823',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
  },
  shareButton: {
    backgroundColor: 'rgba(212, 175, 55, 0.3)',
    borderWidth: 2,
    borderColor: '#d4af37',
    paddingVertical: 12,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  shareButtonText: {
    color: '#d4af37',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statusText: {
    color: '#e8e3d3',
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.8,
  },
  likeAnimation: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -25,
    marginLeft: -25,
    zIndex: 1000,
  },
  likeAnimationText: {
    fontSize: 50,
  },
  sideMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 300,
    height: '100%',
    backgroundColor: 'rgba(26, 24, 35, 0.95)',
    zIndex: 200,
  },
  menuContent: {
    flex: 1,
    paddingTop: 100,
    paddingHorizontal: 24,
  },
  menuTitle: {
    color: '#d4af37',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    color: '#e8e3d3',
    fontSize: 16,
  },
  statValue: {
    color: '#d4af37',
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuButton2: {
    backgroundColor: '#d4af37',
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  menuButtonText2: {
    color: '#1a1823',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
