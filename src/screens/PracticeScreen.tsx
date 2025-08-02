import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const letters = ['بَ', 'بِ', 'بُ', 'تَ', 'تِ', 'تُ'];

const PracticeScreen = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [xp, setXp] = useState(120);

  const currentLetter = letters[currentIndex];
  const progress = (currentIndex + 1) / letters.length;

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < letters.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const toggleRecording = () => {
    setRecording(!recording);
    // TODO: Add actual audio logic later
  };

  return (
    <LinearGradient colors={['#e0f2ff', '#cce4f6']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.xpText}>⭐ XP: {xp}</Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <View style={styles.letterCard}>
        <Text style={styles.letterText}>{currentLetter}</Text>
      </View>

      <Text style={styles.feedbackText}>🎉 Well done!</Text>

      <TouchableOpacity style={styles.recordButton} onPress={toggleRecording}>
        <Ionicons name={recording ? 'stop-circle' : 'mic-circle'} size={80} color="#3b82f6" />
        <Text style={styles.recordLabel}>
          {recording ? 'Recording...' : 'Tap to Record'}
        </Text>
      </TouchableOpacity>

      <View style={styles.navRow}>
        <TouchableOpacity onPress={handlePrev} disabled={currentIndex === 0}>
          <Ionicons
            name="arrow-back-circle"
            size={50}
            color={currentIndex === 0 ? '#cbd5e1' : '#3b82f6'}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleNext} disabled={currentIndex === letters.length - 1}>
          <Ionicons
            name="arrow-forward-circle"
            size={50}
            color={currentIndex === letters.length - 1 ? '#cbd5e1' : '#3b82f6'}
          />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default PracticeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: SCREEN_HEIGHT * 0.07,
    paddingHorizontal: SCREEN_WIDTH * 0.06,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    marginBottom: SCREEN_HEIGHT * 0.03,
  },
  xpText: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontFamily: Platform.select({
      ios: 'Arial',
      android: 'sans-serif-medium',
    }),
    color: '#1e3a8a',
    marginBottom: 8,
  },
  progressBarBackground: {
    width: '100%',
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 50,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 50,
  },
  letterCard: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.6,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    marginBottom: 20,
  },
  letterText: {
    fontSize: SCREEN_WIDTH * 0.2,
    fontFamily: Platform.select({
      ios: 'Geeza Pro',
      android: 'sans-serif',
    }),
    color: '#1e3a8a',
    lineHeight: SCREEN_WIDTH * 0.27,
  },
  feedbackText: {
    fontSize: SCREEN_WIDTH * 0.045,
    fontFamily: Platform.select({
      ios: 'Arial',
      android: 'sans-serif',
    }),
    color: '#16a34a',
    marginBottom: 20,
  },
  recordButton: {
    alignItems: 'center',
    marginBottom: 30,
  },
  recordLabel: {
    marginTop: 10,
    fontSize: SCREEN_WIDTH * 0.04,
    fontFamily: Platform.select({
      ios: 'Arial',
      android: 'sans-serif',
    }),
    color: '#1e40af',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '60%',
    marginTop: 10,
  },
});
