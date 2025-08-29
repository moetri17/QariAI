import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { TutorialProvider } from './src/tutorial/TutorialContext';

export default function App() {
  return (
    <TutorialProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </TutorialProvider>

  );
}