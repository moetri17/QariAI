/**
 * BottomTabs
 * Provides the app’s bottom navigation bar with icons for Home, Levels, and Profile.
 * Uses a clean, label-free design, adapts height to the device’s safe area,
 * and applies active/inactive colours for clear feedback.
 */

import React from 'react';
import {
  Dimensions,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import LevelsScreen from '../screens/LevelsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export type TabParamList = {
  Home: undefined;
  Levels: undefined;
  Profile: undefined;
  Practice: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function BottomTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: {
          height: SCREEN_HEIGHT * 0.04 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : SCREEN_HEIGHT * 0.015,
          paddingTop: 6,
          backgroundColor: '#ffffff',
          borderTopWidth: 0.5,
          borderTopColor: '#e0e0e0',
        },
        tabBarButton: (props) => {
          const safeProps = Object.fromEntries(
            Object.entries(props).filter(([_, value]) => value !== null)
          );
          return (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.tabButton}
              {...safeProps}
            />
          );
        },
        tabBarIcon: ({ color, size }) => {
          const iconName =
            route.name === 'Home'
              ? 'home-outline'
              : route.name === 'Levels'
              ? 'book-outline'
              : 'person-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Levels" component={LevelsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
