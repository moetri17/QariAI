/**
 * SplashScreen
 * Initial launch screen of the app.
 * - Shows the QariAI logo and slogan with a gradient background.
 * - After 2 seconds automatically redirects to the Auth screen.
 */

import React, { useEffect } from 'react';
import { StyleSheet} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Text } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import { LinearGradient } from 'expo-linear-gradient';

const SplashScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  useEffect(() => {
    const timeout = setTimeout(() => {
      navigation.replace('Auth');
    }, 2000);

    return () => clearTimeout(timeout);
  }, []);

  return (
    <LinearGradient colors={['#e0f2ff', '#cce4f6', '#b3daff']} style={styles.container}>
      <Text style={styles.title}>QariAI</Text>
      <Text style={styles.slogan}>Learn to recite beautifully.</Text>
    </LinearGradient>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#3b82f6',
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    fontFamily: 'Tajawal-Bold',
  },
  slogan: {
    marginTop: 10,
    fontSize: 18,
    color: '#1e40af',
    fontFamily: 'Tajawal-Regular',
  },
});
