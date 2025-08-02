// src/navigation/AppNavigator.tsx
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SplashScreen from '../screens/SplashScreen';
import BottomTabs from './BottomTabs';
import LevelsScreen from '../screens/LevelsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PracticeScreen from '../screens/PracticeScreen';

export type AppStackParamList = {
  Splash: undefined;
  Main: undefined;
  Levels: undefined;
  Profile: undefined;
  Practice: undefined;
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
    </Stack.Navigator>
  );
};

export default AppNavigator;
