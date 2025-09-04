/**
 * AppNavigator
 * Defines the main navigation flow of the application using a stack navigator.
 * Controls transitions between all core screens (Splash, Auth, Practice, Levels,
 * Results, Analytics, Profile, and the main BottomTabs).
 * Sets SplashScreen as the initial route and hides default headers for a
 * custom app design.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import BottomTabs from './BottomTabs';
import LevelsScreen from '../screens/LevelsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PracticeScreen from '../screens/PracticeScreen';
import AuthScreen from '../screens/AuthScreen';
import ResultsScreen from '../screens/ResultsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';

export type AppStackParamList = {
  Splash: undefined;
  Main: undefined;
  Levels: undefined;
  Profile: undefined;
  Practice: { level: number; tutorial?: boolean };
  Auth: undefined;
  Results: {
    levelId: number;
    levelTitleAr: string;
    totalItems: number;
    correctItems: number;
    bestStreak?: number;
    durationMs?: number;
    xpEarned?: number;
    mistakes?: string[];
  };
  Analytics: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Main" component={BottomTabs} />
      <Stack.Screen name="Levels" component={LevelsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Practice" component={PracticeScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />

    </Stack.Navigator>
  );
};

export default AppNavigator;
