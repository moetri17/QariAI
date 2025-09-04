/**
 * ProfileScreen
 * Shows the user’s account and preferences.
 * - View username and open Analytics.
 * - Set study reminders (frequency, time) and toggle notifications.
 * - Log out or permanently delete the local account and data.
 * - Final step of the guided tour (Finish returns to Home).
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import TutorialOverlay from '../tutorial/TutorialOverlay';
import { useTutorial } from '../tutorial/TutorialContext';

type Nav = NativeStackNavigationProp<AppStackParamList>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FREQUENCY_OPTIONS = [
  { label: '1×/week', value: '1' },
  { label: '2×/week', value: '2' },
  { label: '3×/week', value: '3' },
  { label: 'Daily', value: '7' },
];

const ProfileScreen = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { active, step, finish } = useTutorial();

  const [username, setUsername] = useState('');
  const [frequency, setFrequency] = useState('2');
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const data = await AsyncStorage.getItem('currentUser');
      if (data) {
        const parsed = JSON.parse(data);
        setUsername(parsed?.username ?? parsed?.email ?? '');
      }
      const f = await AsyncStorage.getItem('prefs_frequency');
      if (f) setFrequency(f);
      const n = await AsyncStorage.getItem('prefs_notifications');
      if (n) setNotificationEnabled(n === '1');
      const t = await AsyncStorage.getItem('prefs_reminder_time');
      if (t) setReminderTime(new Date(Number(t)));
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('currentUser');
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

  const handleTimeChange = (_e: any, selected?: Date) => {
    if (selected) {
      setReminderTime(selected);
      AsyncStorage.setItem('prefs_reminder_time', String(selected.getTime()));
    }
    if (Platform.OS === 'android') setShowTimePicker(false);
  };

  const setFreq = async (v: string) => {
    setFrequency(v);
    await AsyncStorage.setItem('prefs_frequency', v);
  };
  const setNotif = async (v: boolean) => {
    setNotificationEnabled(v);
    await AsyncStorage.setItem('prefs_notifications', v ? '1' : '0');
  };

  /** Permanently delete this user's local account + scoped data. */
  const handleDeleteAccount = async () => {
    if (!username) {
      return Alert.alert('No user', 'No account is currently logged in.');
    }

    Alert.alert(
      'Delete account?',
      `This will permanently remove local data for "${username}". This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const normalized = username.trim().toLowerCase();

              // 1) Remove from users map
              const usersRaw = await AsyncStorage.getItem('users');
              if (usersRaw) {
                const users = JSON.parse(usersRaw) as Record<
                  string,
                  { username: string; password: string; createdAt?: string }
                >;
                if (users[normalized]) {
                  delete users[normalized];
                  await AsyncStorage.setItem('users', JSON.stringify(users));
                }
              }

              // 2) Remove known per-user keys (also clear tutorial flags)
              const keys = await AsyncStorage.getAllKeys();
              const toRemove = keys.filter(
                (k) =>
                  k === `seenTutorial:${normalized}` ||
                  k === `tutorialActive:${normalized}` ||
                  k === `tutorialStep:${normalized}` ||
                  k === `progress:${normalized}` ||
                  k === `analytics:${normalized}` ||
                  k.startsWith(`${normalized}:`)
              );
              if (toRemove.length) {
                await AsyncStorage.multiRemove(toRemove);
              }

              // 3) Clear currentUser if it's this one
              const currentRaw = await AsyncStorage.getItem('currentUser');
              if (currentRaw) {
                const current = JSON.parse(currentRaw) as { username?: string };
                if (current?.username?.toLowerCase() === normalized) {
                  await AsyncStorage.removeItem('currentUser');
                }
              }

              Alert.alert('Deleted', 'Your account was removed.');
              navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
            } catch (e) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  const showProfileTutorial = active && step === 'profile';

  const finishTourAndGoHome = async () => {
    await finish();
    navigation.navigate('Main' as any);
  };

  return (
    <LinearGradient colors={['#e0f2ff', '#cce4f6']} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + SCREEN_HEIGHT * 0.02, paddingBottom: insets.bottom + SCREEN_HEIGHT * 0.04 },
        ]}
      >
        <Text style={styles.logo}>QariAI</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>

          <View style={styles.rowBetween}>
            <Text style={styles.label}>Username</Text>
            <Text style={styles.value}>{username || '—'}</Text>
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, { marginTop: 16 }]}
            onPress={() => navigation.navigate('Analytics' as any)}
          >
            <Text style={styles.primaryBtnText}>View Analytics</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Learning Preferences</Text>

          <Text style={[styles.label, { marginBottom: 8 }]}>Frequency</Text>
          <View style={styles.chipsRow}>
            {FREQUENCY_OPTIONS.map((opt) => {
              const active = frequency === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setFreq(opt.value)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.label, { marginTop: 16 }]}>Reminder Time</Text>
          <TouchableOpacity style={styles.timeButton} onPress={() => setShowTimePicker(true)}>
            <Text style={styles.timeText}>
              {reminderTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </TouchableOpacity>

          {showTimePicker && (
            <DateTimePicker value={reminderTime} mode="time" display="default" onChange={handleTimeChange} />
          )}

          <View style={[styles.rowBetween, { marginTop: 16 }]}>
            <Text style={styles.label}>Enable Notifications</Text>
            <Switch value={notificationEnabled} onValueChange={setNotif} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Actions</Text>

          <TouchableOpacity style={styles.dangerBtn} onPress={handleLogout}>
            <Text style={styles.dangerBtnText}>Log Out</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.dangerOutlineBtn, { marginTop: 10 }]} onPress={handleDeleteAccount}>
            <Text style={styles.dangerOutlineBtnText}>Delete Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TutorialOverlay
        visible={showProfileTutorial}
        title="Profile"
        body="Here you can view analytics and log out. You’re all set—tap Finish to begin on your own."
        primaryLabel="Finish"
        onPrimary={finishTourAndGoHome}
        secondaryLabel="Skip"
        onSecondary={finishTourAndGoHome}
      />
    </LinearGradient>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.05,
  },

  logo: {
    fontSize: SCREEN_WIDTH * 0.08,
    fontFamily: 'Tajawal-Bold',
    color: '#1e3a8a',
    marginBottom: SCREEN_HEIGHT * 0.015,
    textAlign: 'center',
  },

  card: {
    width: SCREEN_WIDTH * 0.9,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: SCREEN_HEIGHT * 0.02,
    paddingHorizontal: SCREEN_WIDTH * 0.06,
    marginBottom: SCREEN_HEIGHT * 0.02,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  cardTitle: {
    fontSize: SCREEN_WIDTH * 0.045,
    fontFamily: 'Tajawal-Bold',
    color: '#0F172A',
    marginBottom: SCREEN_HEIGHT * 0.01,
  },

  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SCREEN_HEIGHT * 0.005,
  },
  label: {
    fontSize: SCREEN_WIDTH * 0.035,
    fontFamily: 'Tajawal-Regular',
    color: '#475569',
  },
  value: {
    fontSize: SCREEN_WIDTH * 0.035,
    fontFamily: 'Tajawal-Bold',
    color: '#111827',
  },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  chipText: {
    color: '#334155',
    fontSize: 14,
    fontFamily: 'Tajawal-Bold',
  },
  chipTextActive: {
    color: '#1D4ED8',
  },

  timeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginTop: 6,
  },
  timeText: {
    fontSize: 16,
    color: '#0F172A',
    fontFamily: 'Tajawal-Bold',
  },

  primaryBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: SCREEN_HEIGHT * 0.015,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: SCREEN_WIDTH * 0.035,
    fontFamily: 'Tajawal-Bold',
  },

  dangerBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: SCREEN_HEIGHT * 0.015,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerBtnText: {
    color: '#FFFFFF',
    fontSize: SCREEN_WIDTH * 0.035,
    fontFamily: 'Tajawal-Bold',
  },

  dangerOutlineBtn: {
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingVertical: SCREEN_HEIGHT * 0.015,
    borderRadius: 12,
    alignItems: 'center',
  },
  dangerOutlineBtnText: {
    color: '#EF4444',
    fontSize: SCREEN_WIDTH * 0.035,
    fontFamily: 'Tajawal-Bold',
  },
});
