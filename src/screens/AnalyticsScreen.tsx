/**
 * AnalyticsScreen
 * Presents the learner’s performance in a clear dashboard:
 *  - Overall attempts and accuracy, plus per-level summary and last-7-days trend.
 *  - Per-letter accuracy bars filtered by the selected level.
 *  - Pull-to-refresh to recompute stats and level progression.
 *  - Export options to share results as CSV or PDF (local generation for privacy).
 * Intended to help users and markers see progress at a glance.
 */

import * as React from 'react';
import {
  View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, Alert,
  Dimensions, ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ensureLocalUser } from '../services/user';
import {
  getPerLetterStats, getTotals, computeAndUpdateLevel, getCurrentLevel, getLast7DaysForLetters
} from '../services/data';
import { LETTERS } from '../constants/letters';
import { LEVELS } from '../constants/levels';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import BackButton from '../components/BackButton';
import Sparkline from '../components/Sparkline';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Row = { ar: string; n: number; correct: number; acc: number };

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();

  const [userId, setUserId] = React.useState<string | null>(null);
  const [rows, setRows] = React.useState<Row[]>([]);
  const [totals, setTotals] = React.useState({ n: 0, correct: 0, acc: 0 });
  const [level, setLevel] = React.useState<number>(1);
  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedLevel, setSelectedLevel] = React.useState<number>(1);
  const [last7, setLast7] = React.useState<{ day: string; n: number; acc: number }[]>([]);

  const refresh = React.useCallback(() => {
    if (!userId) return;
    setRefreshing(true);
    try {
      const r = getPerLetterStats(userId);
      const t = getTotals(userId);
      setRows(r);
      setTotals(t);
      const newLvl = computeAndUpdateLevel(userId);
      setLevel(newLvl);
      const ALL_AR = LETTERS.map(L => L.ar);
      const levelLetters = (LEVELS.find(L => L.level === selectedLevel)?.letters || ALL_AR);
      const l7 = getLast7DaysForLetters(userId, levelLetters);
      setLast7(l7);
      if (!LEVELS.find(L => L.level === selectedLevel)) setSelectedLevel(newLvl || 1);
    } catch (e: any) {
      console.warn(e?.message || e);
    } finally {
      setRefreshing(false);
    }
  }, [userId, selectedLevel]);

  React.useEffect(() => {
    ensureLocalUser().then((id) => {
      setUserId(id);
      const curr = getCurrentLevel(id);
      setLevel(curr);
      if (LEVELS.find(L => L.level === curr)) setSelectedLevel(curr);
    });
  }, []);

  React.useEffect(() => { if (userId) refresh(); }, [userId, refresh]);
  React.useEffect(() => { if (userId) refresh(); }, [selectedLevel]);

  const ALL_AR = LETTERS.map(L => L.ar);
  const LEVEL_AR_SET = new Set(
    (LEVELS.find(L => L.level === selectedLevel)?.letters || ALL_AR)
  );

  const merged: Row[] = LETTERS
    .map(L => rows.find(r => r.ar === L.ar) ?? { ar: L.ar, n: 0, correct: 0, acc: 0 })
    .filter(r => LEVEL_AR_SET.has(r.ar));

  const perLevelTotals = merged.reduce((acc, r) => {
    acc.n += r.n; acc.correct += r.correct;
    return acc;
  }, { n: 0, correct: 0 });
  const perLevelAcc = perLevelTotals.n ? perLevelTotals.correct / perLevelTotals.n : 0;

  function rowsToCSV(username: string) {
    const header = ['Letter', 'Attempts', 'Correct', 'Accuracy%'].join(',');
    const body = merged.map(r =>
      [r.ar, r.n, r.correct, Math.round(r.acc * 100)].join(',')
    ).join('\n');
    const meta =
      `User,${username}\nLevel,${selectedLevel}\nTotal Attempts,${perLevelTotals.n}\nAccuracy%,${Math.round(perLevelAcc * 100)}\n`;
    return [`# QariAI Analytics`, meta, header, body].join('\n');
  }

  async function exportCSV() {
    try {
      const user = userId || 'user';
      const fileUri = FileSystem.cacheDirectory! + `qariai_analytics_L${selectedLevel}.csv`;
      await FileSystem.writeAsStringAsync(fileUri, rowsToCSV(user), { encoding: FileSystem.EncodingType.UTF8 });
      await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'Share Analytics CSV' });
    } catch (e: any) {
      Alert.alert('Export failed', e?.message ?? 'Unknown error');
    }
  }

  function rowsToHTML(username: string) {
    const tr = merged.map(r =>
      `<tr><td>${r.ar}</td><td>${r.n}</td><td>${r.correct}</td><td>${Math.round(r.acc * 100)}%</td></tr>`
    ).join('');
    return `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>QariAI Analytics</title>
          <style>
            body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial; color:#0F172A; }
            h1 { color:#1D4ED8; }
            table { width:100%; border-collapse: collapse; margin-top:12px; }
            th, td { border:1px solid #E5E7EB; padding:8px; text-align:center; }
            th { background:#F8FAFC; }
            .meta { color:#475569; }
          </style>
        </head>
        <body>
          <h1>QariAI — Analytics</h1>
          <p class="meta"><strong>User:</strong> ${username} &nbsp;&nbsp; <strong>Level:</strong> ${selectedLevel}</p>
          <p class="meta"><strong>Total Attempts:</strong> ${perLevelTotals.n} &nbsp;&nbsp; <strong>Accuracy:</strong> ${Math.round(perLevelAcc * 100)}%</p>
          <table>
            <thead><tr><th>Letter</th><th>Attempts</th><th>Correct</th><th>Accuracy</th></tr></thead>
            <tbody>${tr}</tbody>
          </table>
        </body>
      </html>
    `;
  }

  async function exportPDF() {
    try {
      const user = userId || 'user';
      const { uri } = await Print.printToFileAsync({ html: rowsToHTML(user) });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Analytics PDF' });
    } catch (e: any) {
      Alert.alert('Export failed', e?.message ?? 'Unknown error');
    }
  }

  return (
    <LinearGradient colors={['#e0f2ff', '#cce4f6']} style={S.container}>
      <BackButton fallbackRoute="Levels" />
      <ScrollView
        contentContainerStyle={[
          S.scrollContent,
          { paddingTop: insets.top + SCREEN_HEIGHT * 0.02, paddingBottom: insets.bottom + SCREEN_HEIGHT * 0.04 },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
      >
        <Text style={S.logo}>QariAI</Text>
        <Text style={S.pageTitle}>Analytics</Text>
        <Text style={S.meta}>
          Overall Attempts: {totals.n} · Overall Accuracy: {(totals.acc * 100).toFixed(1)}%
        </Text>

        <View style={S.levelTabs}>
          {LEVELS.map(L => {
            const active = selectedLevel === L.level;
            return (
              <TouchableOpacity
                key={L.level}
                onPress={() => setSelectedLevel(L.level)}
                style={[S.levelChip, active && S.levelChipActive]}
              >
                <Text style={[S.levelText, active && S.levelTextActive]}>{L.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={S.card}>
          <Text style={S.cardTitle}>Level Summary</Text>
          <Text style={S.cardMeta}>
            Attempts: {perLevelTotals.n} · Accuracy: {(perLevelAcc * 100).toFixed(1)}%
          </Text>

          {!!last7.length && (
            <View style={{ alignItems: 'center', marginTop: 12 }}>
              <Sparkline values={last7.map(d => d.acc)} />
              <Text style={[S.cardMeta, { marginTop: 6 }]}>Last 7 days</Text>
            </View>
          )}
        </View>

        <FlatList
          data={merged}
          keyExtractor={(i) => i.ar}
          contentContainerStyle={{ paddingBottom: 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => (
            <View style={S.row}>
              <Text style={S.ar}>{item.ar}</Text>
              <View style={S.bar}><View style={[S.fill, { width: `${Math.min(100, item.acc * 100)}%` }]} /></View>
              <Text style={S.val}>{(item.acc * 100).toFixed(0)}%</Text>
              <Text style={S.val}>n={item.n}</Text>
            </View>
          )}
          scrollEnabled={false}
        />

        <View style={S.exportRow}>
          <TouchableOpacity style={[S.exportBtn, S.csvBtn]} onPress={exportCSV}>
            <Text style={S.exportText}>Export CSV</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[S.exportBtn, S.pdfBtn]} onPress={exportPDF}>
            <Text style={S.exportText}>Export PDF</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const S = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { alignItems: 'center', paddingHorizontal: SCREEN_WIDTH * 0.05 },

  logo: {
    fontSize: SCREEN_WIDTH * 0.08,
    fontFamily: 'Tajawal-Bold',
    color: '#1e3a8a',
    textAlign: 'center',
  },
  pageTitle: {
    fontSize: SCREEN_WIDTH * 0.05,
    fontFamily: 'Tajawal-Bold',
    color: '#1e3a8a',
    marginTop: SCREEN_HEIGHT * 0.006,
    marginBottom: SCREEN_HEIGHT * 0.008,
    textAlign: 'center',
  },
  meta: {
    fontSize: SCREEN_WIDTH * 0.034,
    fontFamily: 'Tajawal-Regular',
    color: '#475569',
    marginBottom: SCREEN_HEIGHT * 0.015,
    textAlign: 'center',
  },

  levelTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SCREEN_HEIGHT * 0.012,
    justifyContent: 'center',
  },
  levelChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  levelChipActive: { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' },
  levelText: { color: '#334155', fontSize: 14, fontFamily: 'Tajawal-Bold' },
  levelTextActive: { color: '#1D4ED8' },

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
  cardTitle: { fontSize: SCREEN_WIDTH * 0.045, fontFamily: 'Tajawal-Bold', color: '#0F172A' },
  cardMeta: { fontSize: SCREEN_WIDTH * 0.035, fontFamily: 'Tajawal-Regular', color: '#475569', marginTop: SCREEN_HEIGHT * 0.006 },

  row: {
    width: SCREEN_WIDTH * 0.9,
    backgroundColor: '#FFFFFF',
    paddingVertical: SCREEN_HEIGHT * 0.018,
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  ar: { color: '#0F172A', fontSize: 18, minWidth: 64, textAlign: 'center', fontFamily: 'Tajawal-Bold' },
  bar: { flex: 1, height: 8, backgroundColor: '#E5E7EB', borderRadius: 8, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: '#22c55e' },
  val: { color: '#334155', width: 56, textAlign: 'right', fontFamily: 'Tajawal-Bold' },

  exportRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', marginTop: SCREEN_HEIGHT * 0.015 },
  exportBtn: { paddingVertical: SCREEN_HEIGHT * 0.015, paddingHorizontal: SCREEN_WIDTH * 0.1, borderRadius: 12, alignItems: 'center', minWidth: 140 },
  csvBtn: { backgroundColor: '#0EA5E9' },
  pdfBtn: { backgroundColor: '#10B981' },
  exportText: { color: '#FFFFFF', fontFamily: 'Tajawal-Bold', fontSize: SCREEN_WIDTH * 0.035 },
});
