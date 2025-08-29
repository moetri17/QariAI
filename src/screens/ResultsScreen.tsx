import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { AppStackParamList } from '../navigation/AppNavigator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type ResultsRoute = RouteProp<AppStackParamList, 'Results'>;
type Nav = NativeStackNavigationProp<AppStackParamList>;

const formatDuration = (ms: number) => {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const ResultsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<ResultsRoute>();
  const { levelId, levelTitleAr, totalItems, correctItems, bestStreak, durationMs, xpEarned, mistakes } = route.params;

  const accuracy = useMemo(() => (totalItems ? Math.round((correctItems / totalItems) * 100) : 0), [totalItems, correctItems]);
  const timeStr = useMemo(() => formatDuration(durationMs), [durationMs]);

  const handleBackToLevels = () => navigation.replace('Main');
  const handleRetryMistakes = () => navigation.replace('Practice', { level: levelId });

  return (
    <LinearGradient colors={['#e0f2ff', '#cce4f6']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Level Complete</Text>
          <Text style={styles.subtitle}>{levelTitleAr}</Text>

          <View style={styles.xpPill}>
            <Ionicons name="star" size={16} color="#fff" />
            <Text style={styles.xpText}>+{xpEarned} XP</Text>
          </View>
        </View>

        <View style={styles.ringWrap}>
          <View style={styles.ringBg}>
            <Text style={styles.ringMain}>{accuracy}%</Text>
            <Text style={styles.ringSub}>{correctItems}/{totalItems} correct</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.card}>
            <Ionicons name="flame" size={22} color="#ef4444" />
            <Text style={styles.cardTop}>{bestStreak}</Text>
            <Text style={styles.cardLabel}>Best streak</Text>
          </View>

          <View style={styles.card}>
            <Ionicons name="time" size={22} color="#3b82f6" />
            <Text style={styles.cardTop}>{timeStr}</Text>
            <Text style={styles.cardLabel}>Time</Text>
          </View>

          <View style={styles.card}>
            <Ionicons name="trophy" size={22} color="#22c55e" />
            <Text style={styles.cardTop}>+{xpEarned}</Text>
            <Text style={styles.cardLabel}>XP earned</Text>
          </View>
        </View>

        <View style={styles.mistakeBlock}>
          <Text style={styles.blockTitle}>Review mistakes</Text>
          {(!mistakes || mistakes.length === 0) ? (
            <Text style={styles.emptyText}>No mistakes this time — ممتاز!</Text>
          ) : (
            <View style={styles.mistakeGrid}>
              {mistakes.map((g, idx) => (
                <View key={`${g}-${idx}`} style={styles.mistakeItem}>
                  <Text style={styles.mistakeGlyph}>{g}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleRetryMistakes}>
            <Ionicons name="repeat" size={18} color="#fff" />
            <Text style={styles.primaryText}>Practice again</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleBackToLevels}>
            <Ionicons name="home" size={18} color="#1e3a8a" />
            <Text style={styles.secondaryText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default ResultsScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingTop: SCREEN_HEIGHT * 0.07, paddingHorizontal: SCREEN_WIDTH * 0.06, paddingBottom: 28 },
  header: { alignItems: 'center', marginBottom: 18 },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  subtitle: { fontSize: 14, color: '#334155', marginTop: 4, textAlign: 'center' },
  xpPill: {
    marginTop: 10, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#1e3a8a',
    borderRadius: 999, flexDirection: 'row', alignItems: 'center', columnGap: 6,
  },
  xpText: { color: '#fff', fontWeight: '700' },

  ringWrap: { alignItems: 'center', marginVertical: 14 },
  ringBg: {
    width: SCREEN_WIDTH * 0.55, height: SCREEN_WIDTH * 0.55, borderRadius: 999,
    backgroundColor: '#ffffff', justifyContent: 'center', alignItems: 'center',
    elevation: 5, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    borderWidth: 8, borderColor: '#cfe5ff',
  },
  ringMain: { fontSize: 40, fontWeight: '900', color: '#1e3a8a' },
  ringSub: { fontSize: 14, color: '#475569', marginTop: 6 },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', columnGap: 12, marginTop: 18 },
  card: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, paddingVertical: 12, alignItems: 'center',
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  cardTop: { marginTop: 6, fontSize: 18, fontWeight: '800', color: '#0f172a' },
  cardLabel: { fontSize: 12, color: '#475569', marginTop: 2 },

  mistakeBlock: { marginTop: 22 },
  blockTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 10 },
  emptyText: { color: '#16a34a', fontWeight: '700' },
  mistakeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mistakeItem: {
    width: 56, height: 56, borderRadius: 14, backgroundColor: '#eef2ff',
    justifyContent: 'center', alignItems: 'center',
  },
  mistakeGlyph: { fontSize: 28, color: '#1e3a8a' },

  actions: { marginTop: 26, rowGap: 12 },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', columnGap: 8,
    backgroundColor: '#22c55e', paddingVertical: 12, borderRadius: 14,
  },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', columnGap: 8,
    backgroundColor: '#ffffff', paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: '#cfe5ff',
  },
  secondaryText: { color: '#1e3a8a', fontSize: 16, fontWeight: '800' },
});