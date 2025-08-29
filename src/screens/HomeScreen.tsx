// src/screens/HomeScreen.tsx
/**
 * Screen: Home
 * Purpose: Landing page with resume, quick practice, and section entry
 * Tutorial: Shows first overlay; Next → navigate to Levels
 * Routes: Home → Levels → Practice → Profile (tutorial-driven path)
 */

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TutorialOverlay from '../tutorial/TutorialOverlay';
import { useTutorial } from '../tutorial/TutorialContext';

import type { AppStackParamList } from '../navigation/AppNavigator';

const { width } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<AppStackParamList>;

const STORAGE_KEYS = {
  LAST_SESSION: 'qariai:last_session',
  DAILY_XP: 'qariai:daily_xp',
  DAILY_GOAL: 'qariai:daily_goal',
  STREAK_DAYS: 'qariai:streak_days',
};

type LastSession =
  | {
      section: 'Letters' | 'Words' | 'Verses';
      unitId: string;
      title: string;
      progress: number;
    }
  | null;

const HomeScreen = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { active, step, next } = useTutorial(); // tutorial state

  const [lastSession, setLastSession] = useState<LastSession>(null);
  const [dailyXP, setDailyXP] = useState<number>(0);
  const [dailyGoal, setDailyGoal] = useState<number>(30);
  const [streak, setStreak] = useState<number>(0);

  useEffect(() => {
    /** Load persisted dashboard metrics + last session. */
    (async () => {
      try {
        const [ls, xp, goal, st] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.LAST_SESSION),
          AsyncStorage.getItem(STORAGE_KEYS.DAILY_XP),
          AsyncStorage.getItem(STORAGE_KEYS.DAILY_GOAL),
          AsyncStorage.getItem(STORAGE_KEYS.STREAK_DAYS),
        ]);
        if (ls) setLastSession(JSON.parse(ls));
        if (xp) setDailyXP(Number(xp));
        if (goal) setDailyGoal(Number(goal));
        if (st) setStreak(Number(st));
      } catch (e) {
        console.warn('Home load error', e);
      }
    })();
  }, []);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const progressPercent = useMemo(() => {
    const p = Math.max(0, Math.min(1, dailyXP / Math.max(1, dailyGoal)));
    return Math.round(p * 100);
  }, [dailyXP, dailyGoal]);

  /** Resume last session or send user to Levels when none. */
  const goContinue = useCallback(() => {
    if (!lastSession) {
      navigation.navigate('Levels');
      return;
    }
    navigation.navigate('Practice', {
      level: parseInt(lastSession.unitId),
    });
  }, [lastSession, navigation]);

  /** Entry into a section from the grid. */
  const startSection = useCallback(
    (section: 'Letters' | 'Words' | 'Verses') => {
      navigation.navigate('Levels');
    },
    [navigation]
  );

  /** Quick practice launcher (small, timed sets). */
  const startQuickPractice = useCallback(
    (id: string) => {
      navigation.navigate('Practice', {
        level: 1,
      });
    },
    [navigation]
  );

  /** Open analytics from header icon. */
  const openAnalytics = useCallback(() => {
    navigation.navigate('Analytics');
  }, [navigation]);

  const ProgressBar = ({ value }: { value: number }) => {
    const clamped = Math.max(0, Math.min(100, value));
    return (
      <View style={styles.progressWrap}>
        <View style={[styles.progressFill, { width: `${clamped}%` }]} />
      </View>
    );
  };

  const SectionCard = ({
    title,
    subtitle,
    icon,
    onPress,
  }: {
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    onPress: () => void;
  }) => (
    <TouchableOpacity onPress={onPress} style={styles.sectionCard}>
      <View style={styles.sectionIconWrap}>
        <Ionicons name={icon} size={24} color="#1e3a8a" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionCardTitle}>{title}</Text>
        <Text style={styles.sectionCardSub}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#1e3a8a" />
    </TouchableOpacity>
  );

  // Tutorial visibility for this screen
  const showHomeTutorial = active && step === 'home';

  return (
    <LinearGradient colors={['#e0f2ff', '#cce4f6', '#b3daff']} style={styles.flex1}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12, paddingBottom: 36 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>QariAI</Text>

          <TouchableOpacity style={styles.iconButtonTop} onPress={openAnalytics}>
            <Ionicons name="stats-chart-outline" size={22} color="#1e3a8a" />
          </TouchableOpacity>
        </View>

        <Text style={styles.heading}>{greeting} 👋</Text>
        <Text style={styles.subheading}>Let’s strengthen your recitation today</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 Continue where you left off</Text>
          {lastSession ? (
            <>
              <Text style={styles.cardSubtitle}>
                {lastSession.section} · {lastSession.title}
              </Text>
              <Text style={styles.progressLabel}>
                Progress: {Math.round((lastSession.progress || 0) * 100)}%
              </Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={goContinue}>
                <Text style={styles.primaryBtnText}>Resume</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.cardSubtitle}>No recent session found.</Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => navigation.navigate('Levels' as never)}
              >
                <Text style={styles.primaryBtnText}>Start Learning</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.row}>
          <View style={[styles.smallCard, { marginRight: 10 }]}>
            <Text style={styles.smallTitle}>🎯 Daily Goal</Text>
            <Text style={styles.bigNumber}>
              {dailyXP}/{dailyGoal} XP
            </Text>
            <ProgressBar value={progressPercent} />
            <Text style={styles.subtleText}>{progressPercent}% complete</Text>
          </View>

          <View style={[styles.smallCard, { marginLeft: 10 }]}>
            <Text style={styles.smallTitle}>🔥 Streak</Text>
            <Text style={styles.bigNumber}>{streak} days</Text>
            <Text style={styles.subtleText}>Keep it going!</Text>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>⚡ Quick Practice</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Practice', { level: 1 })}
          >
            <Text style={styles.linkText}>See all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 4 }}
        >
          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => startQuickPractice('letters_bta')}
          >
            <View style={styles.quickIconWrap}>
              <Ionicons name="school-outline" size={22} color="#1e3a8a" />
            </View>
            <Text style={styles.quickTitle}>Letters: ب · ت · ث</Text>
            <Text style={styles.quickSub}>3 examples · ~1 min</Text>
            <View style={styles.quickFooterRow}>
              <Text style={styles.quickCta}>Start</Text>
              <Ionicons name="chevron-forward" size={18} color="#1e3a8a" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => startQuickPractice('harakat_fatha')}
          >
            <View style={styles.quickIconWrap}>
              <Ionicons name="library-outline" size={22} color="#1e3a8a" />
            </View>
            <Text style={styles.quickTitle}>Harakāt: فَ · كَ · مَ</Text>
            <Text style={styles.quickSub}>3 examples · ~1 min</Text>
            <View style={styles.quickFooterRow}>
              <Text style={styles.quickCta}>Start</Text>
              <Ionicons name="chevron-forward" size={18} color="#1e3a8a" />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickCard}
            onPress={() => startQuickPractice('words_easy')}
          >
            <View style={styles.quickIconWrap}>
              <Ionicons name="book-outline" size={22} color="#1e3a8a" />
            </View>
            <Text style={styles.quickTitle}>Words: باب · تمَ</Text>
            <Text style={styles.quickSub}>3 examples · ~1 min</Text>
            <View style={styles.quickFooterRow}>
              <Text style={styles.quickCta}>Start</Text>
              <Ionicons name="chevron-forward" size={18} color="#1e3a8a" />
            </View>
          </TouchableOpacity>
        </ScrollView>

        <View style={{ marginTop: 24 }}>
          <Text style={styles.sectionTitle}>🧭 Start a new section</Text>

          <View style={styles.sectionGrid}>
            <SectionCard
              title="Letters"
              subtitle="Arabic alphabet · Harakāt"
              icon="grid-outline"
              onPress={() => startSection('Letters')}
            />
            <SectionCard
              title="Words"
              subtitle="Short words · Common patterns"
              icon="text-outline"
              onPress={() => startSection('Words')}
            />
            <SectionCard
              title="Verses"
              subtitle="Short āyāt · Tajwīd focus"
              icon="musical-notes-outline"
              onPress={() => startSection('Verses')}
            />
          </View>
        </View>

        <View style={styles.footerActions}>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Levels' as never)}
          >
            <Ionicons name="map-outline" size={18} color="#1e3a8a" />
            <Text style={styles.secondaryBtnText}>Go to Levels</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() =>
              navigation.navigate('Practice', {
                level: 1,
              })
            }
          >
            <Ionicons name="flash-outline" size={18} color="#1e3a8a" />
            <Text style={styles.secondaryBtnText}>Quick 4</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Tutorial overlay for HOME: explain the screen, Next → Levels */}
      <TutorialOverlay
        visible={showHomeTutorial}
        title="Home"
        body="This is your Home screen: resume practice, quick drills, and sections."
        primaryLabel="Next"
        onPrimary={() => {
          next(); // advance tutorial step to 'levels'
          navigation.navigate('Levels' as never);
        }}
        secondaryLabel="Skip tour"
        onSecondary={() => {
          // optional: still navigate to Levels to keep the flow
          navigation.navigate('Levels' as never);
        }}
      />
    </LinearGradient>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 18,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  logo: {
    fontSize: 28,
    fontFamily: 'Tajawal-Bold',
    color: '#1e3a8a',
  },
  iconButtonTop: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  logoCircleLg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    marginBottom: 6,
  },
  brandTextLg: {
    fontSize: 20,
    color: '#1e3a8a',
    fontFamily: 'Tajawal-Bold',
    letterSpacing: 0.3,
  },

  heading: {
    fontSize: 26,
    fontFamily: 'Tajawal-Bold',
    color: '#1e3a8a',
    marginTop: 8,
    marginBottom: 2,
    textAlign: 'left',
  },
  subheading: {
    fontSize: 15,
    fontFamily: 'Tajawal-Regular',
    color: '#1e40af',
    marginBottom: 16,
    textAlign: 'left',
  },

  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    marginBottom: 18,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Tajawal-Bold',
    color: '#1e3a8a',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 15,
    fontFamily: 'Tajawal-Regular',
    color: '#1e40af',
    marginBottom: 10,
  },
  progressLabel: {
    fontSize: 13,
    color: '#64748b',
    fontFamily: 'Tajawal-Regular',
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontFamily: 'Tajawal-Bold',
    fontSize: 15,
  },

  row: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 6,
  },
  smallCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  smallTitle: {
    fontSize: 14,
    fontFamily: 'Tajawal-Bold',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  bigNumber: {
    fontSize: 20,
    fontFamily: 'Tajawal-Bold',
    color: '#1e40af',
    marginBottom: 10,
  },
  subtleText: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Tajawal-Regular',
    marginTop: 6,
  },

  progressWrap: {
    width: '100%',
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
  },

  sectionHeaderRow: {
    marginTop: 16,
    marginBottom: 8,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Tajawal-Bold',
    color: '#1e3a8a',
  },
  linkText: {
    fontSize: 13,
    color: '#1e3a8a',
    fontFamily: 'Tajawal-Bold',
  },
  quickCard: {
    width: width * 0.6,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    marginRight: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  quickIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#eef6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickTitle: {
    fontSize: 16,
    fontFamily: 'Tajawal-Bold',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  quickSub: {
    fontSize: 13,
    color: '#64748b',
    fontFamily: 'Tajawal-Regular',
    marginBottom: 10,
  },
  quickFooterRow: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
  },
  quickCta: {
    fontSize: 14,
    color: '#1e3a8a',
    fontFamily: 'Tajawal-Bold',
  },

  sectionGrid: {
    marginTop: 10,
    gap: 12,
  },
  sectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    minHeight: 84,
  },
  sectionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#eef6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionCardTitle: {
    fontSize: 16,
    fontFamily: 'Tajawal-Bold',
    color: '#1e3a8a',
    marginBottom: 2,
  },
  sectionCardSub: {
    fontSize: 13,
    fontFamily: 'Tajawal-Regular',
    color: '#1e40af',
  },

  footerActions: {
    marginTop: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  secondaryBtnText: {
    color: '#1e3a8a',
    fontFamily: 'Tajawal-Bold',
    fontSize: 14,
  },
});
