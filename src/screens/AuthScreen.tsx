/**
 * AuthScreen
 * Local sign-in / sign-up screen for the app.
 * - Creates or logs in a user with a username + password (stored locally).
 * - Passwords are SHA-256 hashed; current user is saved to AsyncStorage.
 * - Validates usernames (3–20 chars: letters, numbers, underscore).
 * - On first sign-up, starts the guided tutorial, then navigates to the main app.
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import { useTutorial } from '../tutorial/TutorialContext';

const { width } = Dimensions.get('window');

type StoredUsers = Record<string, { username: string; password: string; createdAt?: string }>;

const AuthScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { start } = useTutorial();

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [allUsers, setAllUsers] = useState<StoredUsers>({});

  useEffect(() => {
    /** Load saved users into memory. */
    const loadUsers = async () => {
      const users = await AsyncStorage.getItem('users');
      if (users) setAllUsers(JSON.parse(users));
    };
    loadUsers();
  }, []);

  const normalizeUsername = (u: string) => u.trim().toLowerCase();
  const isValidUsername = (u: string) => /^[a-zA-Z0-9_]{3,20}$/.test(u);
  const hashPassword = async (pwd: string) =>
    Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pwd);

  /** Handle sign-in / sign-up; on sign-up start tutorial (Home → ...) */
  const handleSubmit = async () => {
    if (!username || !password) {
      return Alert.alert('Error', 'Please fill in all fields');
    }
    if (!isValidUsername(username)) {
      return Alert.alert('Invalid username', 'Use 3–20 characters: letters, numbers, or underscore.');
    }

    const users: StoredUsers = { ...allUsers };
    const key = normalizeUsername(username);

    if (isLogin) {
      // --- Sign In ---
      if (!users[key]) return Alert.alert('Error', 'Account not found');

      const hashedInput = await hashPassword(password);
      if (users[key].password !== hashedInput) {
        return Alert.alert('Error', 'Incorrect password');
      }

      await AsyncStorage.setItem('currentUser', JSON.stringify({ username: users[key].username }));
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    } else {
      // --- Create Account ---
      if (!confirmPassword || confirmPassword !== password) {
        return Alert.alert('Error', 'Passwords do not match');
      }
      if (users[key]) return Alert.alert('Error', 'Username already taken');

      const hashed = await hashPassword(password);
      users[key] = {
        username: username.trim(),
        password: hashed,
        createdAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem('users', JSON.stringify(users));
      await AsyncStorage.setItem('currentUser', JSON.stringify({ username: users[key].username }));
      setAllUsers(users);

      // Start guided tour for this user and go to Home
      await start(users[key].username);
      navigation.reset({ index: 0, routes: [{ name: 'Main' }] });
    }
  };

  return (
    <LinearGradient colors={['#e0f2ff', '#cce7ff']} style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.cardWrapper}>
        <View style={styles.card}>
          <Text style={styles.title}>{isLogin ? 'Sign In' : 'Create Account'}</Text>

          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Choose a username (e.g., qari_student)"
            placeholderTextColor="#aaa"
            autoCapitalize="none"
            value={username}
            onChangeText={setUsername}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#aaa"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {!isLogin && (
            <>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter your password"
                placeholderTextColor="#aaa"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
            </>
          )}

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.toggleText}>
              {isLogin ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default AuthScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  cardWrapper: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    width: width * 0.85,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  title: { fontSize: 26, fontWeight: 'bold', color: '#007AFF', marginBottom: 25, textAlign: 'center' },
  label: { fontSize: 16, color: '#333', marginBottom: 6, marginTop: 12 },
  input: {
    height: 48, borderWidth: 1, borderColor: '#ccc', borderRadius: 10, paddingHorizontal: 14, fontSize: 16, backgroundColor: '#fff',
  },
  submitButton: {
    backgroundColor: '#007AFF', marginTop: 25, paddingVertical: 14, borderRadius: 12, alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
  toggleText: { color: '#007AFF', fontSize: 14, marginTop: 18, textAlign: 'center' },
});
