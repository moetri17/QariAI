// src/screens/HomeScreen.tsx
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { LinearGradient } from 'expo-linear-gradient';
import type { TabParamList } from '../navigation/BottomTabs';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const navigation = useNavigation<BottomTabNavigationProp<TabParamList>>();

  return (
    <LinearGradient colors={['#e0f2ff', '#cce4f6', '#b3daff']} style={styles.container}>
      <Text style={styles.heading}>👋 Welcome to QariAI</Text>
      <Text style={styles.subheading}>Let’s begin reciting beautifully</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎯 Your Journey</Text>
        <Text style={styles.cardContent}>🧠 Letters → Words → Verses</Text>
        <Text style={styles.progress}>Progress: ⭐⭐☆☆</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Levels')} style={styles.cardButton}>
          <Text style={styles.cardButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.badgeRow}>
        <View style={styles.badge}>
          <Ionicons name="flame-outline" size={24} color="#f97316" />
          <Text style={styles.badgeText}>Streak: 3 Days</Text>
        </View>
        <View style={styles.badge}>
          <Ionicons name="ribbon-outline" size={24} color="#3b82f6" />
          <Text style={styles.badgeText}>Badge: Beginner</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.startButton} onPress={() => navigation.navigate('Levels')}>
        <Text style={styles.startButtonText}>🚀 Start Learning</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 90,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  heading: {
    fontSize: 26,
    fontFamily: 'Tajawal-Bold',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 16,
    fontFamily: 'Tajawal-Regular',
    color: '#1e40af',
    marginBottom: 25,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 25,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Tajawal-Bold',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  cardContent: {
    fontSize: 16,
    fontFamily: 'Tajawal-Regular',
    color: '#1e40af',
    marginBottom: 6,
  },
  progress: {
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Tajawal-Regular',
    marginBottom: 12,
  },
  cardButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  cardButtonText: {
    color: '#fff',
    fontFamily: 'Tajawal-Bold',
    fontSize: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
    paddingHorizontal: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontSize: 14,
    fontFamily: 'Tajawal-Regular',
    color: '#334155',
  },
  startButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    paddingHorizontal: 50,
    borderRadius: 12,
  },
  startButtonText: {
    color: '#ffffff',
    fontFamily: 'Tajawal-Bold',
    fontSize: 16,
  },
});
