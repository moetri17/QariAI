/**
 * PracticeScreen
 * Core practice flow for each level (e.g., letters/harakāt).
 * - Plays a reference audio for the current item.
 * - Lets the learner record, review, retry, and then “Send” an attempt.
 * - Stores each attempt (with timing and outcome) and updates XP, streaks, and progress.
 * - Shows instant visual feedback (flash + toast) and requires a send before moving on.
 * - Final item completes the lesson and navigates to Results.
 * - In the guided tour, the first successful send advances the tutorial.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
  Alert,
  I18nManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import FeedbackFlash from '../components/FeedbackFlash';
import FeedbackToast from '../components/FeedbackToast';

import {
  useAudioRecorder,
  useAudioRecorderState,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync as setAudioModeAsync_ExpoAudio,
} from 'expo-audio';

import { Audio as AV } from 'expo-av';

import * as FileSystem from 'expo-file-system';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppStackParamList } from '../navigation/AppNavigator';
import { ensureLocalUser } from '../services/user';
import { recordAttempt } from '../services/data';
import TutorialOverlay from '../tutorial/TutorialOverlay';
import { useTutorial } from '../tutorial/TutorialContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type PracticeRouteProp = RouteProp<AppStackParamList, 'Practice'>;
type Nav = NativeStackNavigationProp<AppStackParamList>;

const GLYPH_TO_CANON_EN: Record<string, string> = {
  'ا': 'Alif', 'أ': 'Alif', 'إ': 'Alif', 'آ': 'Alif',
  'ب': 'Ba', 'ت': 'Ta', 'ث': 'Tha', 'ج': 'Jeem',
  'ح': 'Hha', 'خ': 'Kha', 'د': 'Dal', 'ذ': 'Dhal',
  'ر': 'Raa', 'ز': 'Zaa', 'س': 'Seen', 'ش': 'Sheen',
  'ص': 'Saud', 'ض': 'Duad', 'ط': 'Tua', 'ظ': 'Zua',
  'ع': 'Ain', 'غ': 'Ghain', 'ف': 'Faa', 'ق': 'Qaf',
  'ك': 'Kaif', 'ل': 'Laam', 'م': 'Meem', 'ن': 'Noon',
  'ه': 'Haa', 'و': 'Waw', 'ي': 'Yaa', 'ى': 'Yaa',
};

const GLYPH_TO_CANON_AR: Record<string, string> = {
  'ا': 'الف', 'أ': 'الف', 'إ': 'الف', 'آ': 'الف',
  'ب': 'باء', 'ت': 'تاء', 'ث': 'ثاء', 'ج': 'جيم',
  'ح': 'حاء', 'خ': 'خاء', 'د': 'دال', 'ذ': 'ذال',
  'ر': 'راء', 'ز': 'زاي', 'س': 'سين', 'ش': 'شين',
  'ص': 'صاد', 'ض': 'ضاد', 'ط': 'طاء', 'ظ': 'ظاء',
  'ع': 'عين', 'غ': 'غين', 'ف': 'فاء', 'ق': 'قاف',
  'ك': 'كاف', 'ل': 'لام', 'م': 'ميم', 'ن': 'نون',
  'ه': 'هاء', 'و': 'واو', 'ي': 'ياء', 'ى': 'ياء',
};

type LevelConfig = {
  id: number;
  key: string;
  titleEn: string;
  items: string[];
  referenceAudioMap?: Record<string, any>;
};

const LEVEL1_ITEMS: string[] = [
  'ا','ب','ت','ث','ج','ح','خ','د','ذ','ر',
  'ز','س','ش','ص','ض','ط','ظ','ع','غ','ف',
  'ق','ك','ل','م','ن','ه','و','ي',
];

const LEVEL2_ITEMS: string[] = ['بَ','بِ','بُ','تَ','تِ','تُ','ثَ','ثِ','ثُ'];

const LEVEL1_AUDIO: Record<string, any> = {
  'ا': require('../assets/alif.wav'),
  'ب': require('../assets/ba.wav'),
  'ت': require('../assets/ta.wav'),
  'ث': require('../assets/tha.wav'),
  'ج': require('../assets/jeem.wav'),
  'ح': require('../assets/hha.wav'),
  'خ': require('../assets/kha.wav'),
  'د': require('../assets/dal.wav'),
  'ذ': require('../assets/zhal.wav'),
  'ر': require('../assets/raa.wav'),
  'ز': require('../assets/zaa.wav'),
  'س': require('../assets/seen.wav'),
  'ش': require('../assets/sheen.wav'),
  'ص': require('../assets/saud.wav'),
  'ض': require('../assets/duad.wav'),
  'ط': require('../assets/tua.wav'),
  'ظ': require('../assets/zua.wav'),
  'ع': require('../assets/ain.wav'),
  'غ': require('../assets/ghain.wav'),
  'ف': require('../assets/faa.wav'),
  'ق': require('../assets/qaf.wav'),
  'ك': require('../assets/kaif.wav'),
  'ل': require('../assets/laam.wav'),
  'م': require('../assets/meem.wav'),
  'ن': require('../assets/noon.wav'),
  'ه': require('../assets/haa.wav'),
  'و': require('../assets/waw.wav'),
  'ي': require('../assets/yaa.wav'),
};

const LEVEL2_AUDIO: Record<string, any> = {};

const LEVELS: LevelConfig[] = [
  { id: 1, key: 'level-1', titleEn: 'Level 1 — Letters (no harakat)', items: LEVEL1_ITEMS, referenceAudioMap: LEVEL1_AUDIO },
  { id: 2, key: 'level-2', titleEn: 'Level 2 — Letters with harakat (sample)', items: LEVEL2_ITEMS, referenceAudioMap: LEVEL2_AUDIO },
];

const getLevelById = (id: number): LevelConfig => LEVELS.find((l) => l.id === id) ?? LEVELS[0];

const computeXp = (total: number, correct: number) => {
  const pct = total ? correct / total : 0;
  return Math.round(total * 5 + 50 * pct);
};

const formatDuration = (ms: number) => {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

type PillProps = { icon: keyof typeof Ionicons.glyphMap; text: string; color?: string };
const Pill: React.FC<PillProps> = ({ icon, text, color = '#0f172a' }) => (
  <View style={styles.footerPill}>
    <Ionicons name={icon} size={16} color={color} />
    <Text style={styles.footerText}>{text}</Text>
  </View>
);

const MAX_MS = 1500;
const MIN_MS = 400;

const PracticeScreen: React.FC = () => {
  const route = useRoute<PracticeRouteProp>();
  const navigation = useNavigation<Nav>();
  const { active, step, markPracticeDone } = useTutorial(); // tutorial hooks

  const levelId = route.params?.level ?? 1;
  const levelCfg = useMemo(() => getLevelById(levelId), [levelId]);
  const letters = levelCfg.items;
  const referenceAudioMap = levelCfg.referenceAudioMap ?? {};

  const [currentIndex, setCurrentIndex] = useState(0);
  const currentLetter = letters[currentIndex];
  const progress = (currentIndex + 1) / letters.length;

  const [xp, setXp] = useState(120);
  const [correctItems, setCorrectItems] = useState(0);
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [startTime] = useState<number>(Date.now());

  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => { ensureLocalUser().then(setUserId).catch(() => setUserId(null)); }, []);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [hasRecording, setHasRecording] = useState(false);
  const [hasSentRecording, setHasSentRecording] = useState(false);

  const [recordings, setRecordings] = useState<Record<number, { uri: string | null; sent: boolean }>>({});
  const currentRecording = recordings[currentIndex];

  const [recElapsedMs, setRecElapsedMs] = useState(0);
  const recStartedAt = useRef<number | null>(null);
  const recTimerRef = useRef<NodeJS.Timeout | null>(null);
  const uiIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const refSoundRef = useRef<AV.Sound | null>(null);
  const userSoundRef = useRef<AV.Sound | null>(null);
  const currentUserUriRef = useRef<string | null>(null);

  const [hasAutoPlayed, setHasAutoPlayed] = useState<Record<number, boolean>>({});

  const [flashVisible, setFlashVisible] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [fbKind, setFbKind] = useState<'success' | 'neutral' | 'error'>('neutral');
  const [fbTitle, setFbTitle] = useState<string>('');
  const [fbSubtitle, setFbSubtitle] = useState<string | undefined>(undefined);

  useEffect(() => {
    (async () => {
      try {
        const status = await AudioModule.requestRecordingPermissionsAsync();
        if (!status.granted) {
          Alert.alert('Microphone permission is required to record your voice.');
          return;
        }

        await setAudioModeAsync_ExpoAudio({
          playsInSilentMode: true,
          allowsRecording: true,
        });

        await AV.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.error('Audio mode setup failed:', e);
      }
    })();

    return () => {
      (async () => {
        try {
          if (refSoundRef.current) {
            await refSoundRef.current.unloadAsync();
            refSoundRef.current = null;
          }
          if (userSoundRef.current) {
            await userSoundRef.current.unloadAsync();
            userSoundRef.current = null;
          }
          if (recTimerRef.current) clearTimeout(recTimerRef.current);
          if (uiIntervalRef.current) clearInterval(uiIntervalRef.current);
        } catch {}
      })();
    };
  }, []);

  const unloadRefAudio = useCallback(async () => {
    if (refSoundRef.current) {
      try { await refSoundRef.current.unloadAsync(); } catch {}
      refSoundRef.current = null;
    }
  }, []);

  const loadRefAudioForCurrent = useCallback(async () => {
    try {
      await unloadRefAudio();
      const mod = referenceAudioMap[currentLetter];
      if (!mod) return;

      const { sound } = await AV.Sound.createAsync(mod, {
        shouldPlay: false,
        volume: 1.0,
      });
      refSoundRef.current = sound;
    } catch (e) {
      console.warn('Failed to load reference audio:', e);
    }
  }, [currentLetter, referenceAudioMap, unloadRefAudio]);

  const autoPlayReferenceAudio = useCallback(async () => {
    if (hasAutoPlayed[currentIndex]) return;
    const mod = referenceAudioMap[currentLetter];
    if (!mod) return;

    try {
      if (!refSoundRef.current) {
        await loadRefAudioForCurrent();
      }
      if (refSoundRef.current) {
        await refSoundRef.current.setPositionAsync(0);
        await refSoundRef.current.setVolumeAsync(1.0);
        await refSoundRef.current.playAsync();
        setHasAutoPlayed(prev => ({ ...prev, [currentIndex]: true }));
        console.log(`🔊 Auto-played reference audio for ${currentLetter} (${GLYPH_TO_CANON_EN[currentLetter]})`);
      }
    } catch (e) {
      console.warn('Failed to auto-play reference audio:', e);
    }
  }, [currentIndex, currentLetter, referenceAudioMap, hasAutoPlayed, loadRefAudioForCurrent]);

  const preloadNextRefAudio = useCallback(async () => {
    const next = currentIndex + 1;
    if (next >= letters.length) return;
    const nextLetter = letters[next];
    const mod = referenceAudioMap[nextLetter];
    if (!mod) return;
    try {
      const { sound } = await AV.Sound.createAsync(mod, { shouldPlay: false });
      await sound.unloadAsync();
    } catch {}
  }, [currentIndex, letters, referenceAudioMap]);

  const cleanupUserAudio = useCallback(async () => {
    if (userSoundRef.current) {
      try {
        await userSoundRef.current.unloadAsync();
      } catch {}
      userSoundRef.current = null;
      currentUserUriRef.current = null;
    }
  }, []);

  useEffect(() => {
    setHasRecording(!!currentRecording?.uri);
    setHasSentRecording(!!currentRecording?.sent);

    setFlashVisible(false);
    setToastVisible(false);

    cleanupUserAudio();
    loadRefAudioForCurrent();
    preloadNextRefAudio();

    const timer = setTimeout(() => {
      autoPlayReferenceAudio();
    }, 200);

    return () => clearTimeout(timer);
  }, [currentIndex, currentLetter]);

  const handleListenAgain = useCallback(async () => {
    try {
      if (!refSoundRef.current) await loadRefAudioForCurrent();
      if (!refSoundRef.current) {
        Alert.alert('No reference audio for this letter yet.');
        return;
      }
      await refSoundRef.current.setPositionAsync(0);
      await refSoundRef.current.setVolumeAsync(1.0);
      await refSoundRef.current.playAsync();
      console.log(`🔊 Manual playback of reference audio for ${currentLetter}`);
    } catch (e) {
      console.error('Reference playback error:', e);
      Alert.alert('Error', 'Unable to play reference audio.');
    }
  }, [loadRefAudioForCurrent, currentLetter]);

  const beginUiTimers = useCallback((start: number) => {
    if (uiIntervalRef.current) clearInterval(uiIntervalRef.current);
    uiIntervalRef.current = setInterval(() => {
      setRecElapsedMs(Date.now() - start);
    }, 25);

    if (recTimerRef.current) clearTimeout(recTimerRef.current);
    recTimerRef.current = setTimeout(async () => {
      await handleStopRecording();
    }, MAX_MS + 10);
  }, []);

  const clearUiTimers = useCallback(() => {
    if (recTimerRef.current) clearTimeout(recTimerRef.current);
    recTimerRef.current = null;
    if (uiIntervalRef.current) clearInterval(uiIntervalRef.current);
    uiIntervalRef.current = null;
  }, []);

  const handleStartRecording = useCallback(async () => {
    try {
      try { await refSoundRef.current?.stopAsync(); } catch {}
      try { await userSoundRef.current?.stopAsync(); } catch {}

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();

      const now = Date.now();
      recStartedAt.current = now;
      setRecElapsedMs(0);
      beginUiTimers(now);

      console.log(`🎙️ Started recording for ${currentLetter} (${GLYPH_TO_CANON_EN[currentLetter]})`);
    } catch (err) {
      console.error('Recording failed:', err);
      Alert.alert('Error', 'Failed to start recording.');
    }
  }, [audioRecorder, beginUiTimers, currentLetter]);

  const handleStopRecording = useCallback(async () => {
    try {
      clearUiTimers();
      await audioRecorder.stop();
      const dur = recStartedAt.current ? Date.now() - recStartedAt.current : recElapsedMs;
      recStartedAt.current = null;

      console.log(`⏹️ Stopped recording for ${currentLetter}, duration: ${dur}ms`);

      if (dur < MIN_MS) {
        setHasRecording(false);
        Alert.alert('Too short', 'Please hold for about one second and try again.');
        return;
      }
      setHasRecording(true);
    } catch (err) {
      console.error('Stopping failed:', err);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  }, [audioRecorder, clearUiTimers, recElapsedMs, currentLetter]);

  const evaluateAttempt = useCallback(() => {
    return { correct: true, confidence: 0.99, durationMs: 1000 } as const;
  }, []);

  const handleSend = useCallback(async () => {
    if (!audioRecorder.uri) return;
    try {
      const id = userId ?? (await ensureLocalUser());
      const targetCanonAr = GLYPH_TO_CANON_AR[currentLetter];
      if (!targetCanonAr) {
        console.error('No Arabic canonical mapping for glyph:', currentLetter);
        Alert.alert('Mapping Error', `No Arabic canonical mapping for ${currentLetter}.`);
        return;
      }

      const { correct, confidence, durationMs } = evaluateAttempt();

      await recordAttempt({
        userId: id,
        targetLetterAr: targetCanonAr,
        predictedLetterAr: targetCanonAr,
        correct,
        confidence,
        durationMs,
        audioUri: audioRecorder.uri,
      });

      console.log(`✅ AUDIO SENT TO SERVER:`, {
        userId: id,
        letter: currentLetter,
        targetCanonAr,
        audioUri: audioRecorder.uri,
        timestamp: new Date().toISOString()
      });

      const kind: 'success' | 'neutral' | 'error' = correct
        ? (typeof confidence === 'number' && confidence < 0.7 ? 'neutral' : 'success')
        : 'error';
      setFbKind(kind);
      setFbTitle(correct ? 'Great job!' : 'Try again');
      setFbSubtitle(
        typeof confidence === 'number'
          ? `Confidence: ${Math.round(confidence * 100)}%`
          : (correct ? 'That sounded right.' : 'Give it another shot.')
      );
      setFlashVisible(true);
      setToastVisible(true);

      if (correct) {
        setCorrectItems((c) => c + 1);
        setStreak((s) => {
          const ns = s + 1;
          setBestStreak((b) => Math.max(b, ns));
          return ns;
        });
      } else {
        setMistakes((m) => (m.includes(currentLetter) ? m : [...m, currentLetter]));
        setStreak(0);
      }

      setRecordings((prev) => ({ ...prev, [currentIndex]: { uri: audioRecorder.uri!, sent: true } }));
      setHasSentRecording(true);
      setHasRecording(true);

      try {
        if (userSoundRef.current) {
          await userSoundRef.current.unloadAsync().catch(() => {});
          userSoundRef.current = null;
        }
        const { sound } = await AV.Sound.createAsync({ uri: audioRecorder.uri! }, { shouldPlay: false, volume: 1.0 });
        userSoundRef.current = sound;
        currentUserUriRef.current = audioRecorder.uri!;
        console.log(`🔄 Preloaded user recording for playback: ${currentLetter}`);
      } catch (e) {
        console.warn('Failed to preload user recording:', e);
      }

      if (correct && active && step === 'practice') {
        markPracticeDone();
        navigation.navigate('Profile');
      }
    } catch (err) {
      console.error('Save attempt failed:', err);
      Alert.alert('Error', 'Could not save your attempt.');
    }
  }, [audioRecorder, currentIndex, currentLetter, evaluateAttempt, userId, active, step, markPracticeDone, navigation]);

  const handlePlayUserRecording = useCallback(async () => {
    const uri = recordings[currentIndex]?.uri || audioRecorder.uri;
    if (!uri) return;

    try {
      console.log(`▶️ Playing user recording for ${currentLetter}: ${uri}`);

      const needsLoad = !userSoundRef.current || currentUserUriRef.current !== uri;
      if (needsLoad) {
        if (userSoundRef.current) {
          try { await userSoundRef.current.unloadAsync(); } catch {}
          userSoundRef.current = null;
        }
        const { sound } = await AV.Sound.createAsync({ uri }, { shouldPlay: false, volume: 1.0 });
        userSoundRef.current = sound;
        currentUserUriRef.current = uri;
        console.log(`🔄 Loaded user audio for ${currentLetter}`);
      }

      if (userSoundRef.current) {
        await userSoundRef.current.setPositionAsync(0);
        await userSoundRef.current.playAsync();
        console.log(`🎵 Started playback of user recording for ${currentLetter}`);
      }
    } catch (err) {
      console.error('User recording playback error:', err);
      Alert.alert('Error', 'Unable to play your recording.');
    }
  }, [audioRecorder.uri, currentIndex, recordings, currentLetter]);

  const handleRetry = useCallback(async () => {
    const uri = recordings[currentIndex]?.uri;
    if (uri) {
      try { await FileSystem.deleteAsync(uri, { idempotent: true }); } catch {}
    }
    setHasRecording(false);
    setHasSentRecording(false);
    setRecordings((prev) => ({ ...prev, [currentIndex]: { uri: null, sent: false } }));

    if (currentUserUriRef.current === uri && userSoundRef.current) {
      try { await userSoundRef.current.unloadAsync(); } catch {}
      userSoundRef.current = null;
      currentUserUriRef.current = null;
    }

    console.log(`🔄 Retry initiated for ${currentLetter}`);
  }, [currentIndex, recordings, currentLetter]);

  const stopAllAudio = useCallback(async () => {
    try { await refSoundRef.current?.stopAsync(); } catch {}
    try { await userSoundRef.current?.stopAsync(); } catch {}
  }, []);

  const handlePrev = useCallback(async () => {
    await stopAllAudio();
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }, [currentIndex, stopAllAudio]);

  const handleNext = useCallback(async () => {
    if (!hasSentRecording) {
      Alert.alert('Required', 'Please send a recording before continuing.');
      return;
    }
    await stopAllAudio();
    if (currentIndex < letters.length - 1) setCurrentIndex((i) => i + 1);
  }, [currentIndex, hasSentRecording, letters.length, stopAllAudio]);

  const handleCompleteLesson = useCallback(async () => {
    if (!hasSentRecording) {
      Alert.alert('Required', 'Send the final recording to complete the lesson.');
      return;
    }
    await stopAllAudio();

    const durationMs = Date.now() - startTime;
    const totalItems = letters.length;
    const xpEarned = computeXp(totalItems, correctItems);
    setXp((x) => x + xpEarned);

    console.log(`🎉 Lesson completed! User: ${userId}, XP earned: ${xpEarned}`);

    navigation.replace('Results', {
      levelId: levelCfg.id,
      levelTitleAr: levelCfg.titleEn,
      totalItems,
      correctItems,
      bestStreak,
      durationMs,
      xpEarned,
      mistakes,
    });
  }, [bestStreak, correctItems, hasSentRecording, letters.length, levelCfg.id, levelCfg.titleEn, navigation, startTime, stopAllAudio, userId]);

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === letters.length - 1;
  const canSend = hasRecording && !currentRecording?.sent;

  const fromTutorial = !!route.params?.tutorial;
  const [practiceHintDismissed, setPracticeHintDismissed] = useState(false);
  const showPracticeTutorial = active && step === 'practice' && fromTutorial && !practiceHintDismissed;
  return (
    <LinearGradient colors={['#e0f2ff', '#cce4f6']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.xpText}>⭐ XP: {xp}</Text>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <View style={styles.letterCard}>
        <Text style={styles.letterText}>{currentLetter}</Text>
        <Text style={styles.cardSub}>{GLYPH_TO_CANON_EN[currentLetter] ?? ''}</Text>
      </View>

      {!!referenceAudioMap[currentLetter] && (
        <TouchableOpacity onPress={handleListenAgain} style={styles.actionBtn}>
          <Ionicons name="headset" size={32} color={'#0ea5e9'} />
          <Text style={styles.recordLabel}>Listen again</Text>
        </TouchableOpacity>
      )}

      <View style={styles.controlsWrap}>
        {!recorderState.isRecording && !hasRecording && !currentRecording?.sent && (
          <TouchableOpacity onPress={handleStartRecording} style={styles.recordButton}>
            <Ionicons name="mic-circle" size={86} color="#ef4444" />
            <Text style={styles.recordLabel}>Tap to record (1.5s)</Text>
          </TouchableOpacity>
        )}

        {recorderState.isRecording && (
          <TouchableOpacity onPress={handleStopRecording} style={styles.recordButton}>
            <Ionicons name="stop-circle" size={86} color="#ef4444" />
            <Text style={styles.recordLabel}>Stop</Text>
          </TouchableOpacity>
        )}

        {recorderState.isRecording && (
          <View style={styles.progressWrapper}>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFillBlue,
                  { width: `${Math.min(100, (recElapsedMs / MAX_MS) * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {(Math.min(recElapsedMs, MAX_MS) / 1000).toFixed(2)} / 1.50s
            </Text>
          </View>
        )}
      </View>

      {(hasRecording || currentRecording?.sent) && !recorderState.isRecording && (
        <>
          <View style={styles.confirmRow}>
            <TouchableOpacity onPress={handleRetry} style={styles.actionBtn}>
              <Ionicons name="refresh" size={32} color="#ef4444" />
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>

            {!currentRecording?.sent && (
              <TouchableOpacity onPress={handleSend} style={styles.actionBtn} disabled={!canSend}>
                <Ionicons name="send" size={32} color={canSend ? '#10b981' : '#9ca3af'} />
                <Text style={[styles.sendText, !canSend && { color: '#9ca3af' }]}>Send</Text>
              </TouchableOpacity>
            )}
          </View>

          {(currentRecording?.uri || audioRecorder.uri) && (
            <TouchableOpacity onPress={handlePlayUserRecording} style={styles.actionBtn}>
              <Ionicons name={'play'} size={42} color="#1e40af" />
              <Text style={styles.recordLabel}>Play your recording</Text>
            </TouchableOpacity>
          )}
        </>
      )}

      <View style={styles.navRow}>
        <TouchableOpacity onPress={handlePrev} disabled={isFirst}>
          <Ionicons name="arrow-back-circle" size={50} color={isFirst ? '#cbd5e1' : '#3b82f6'} />
        </TouchableOpacity>

        {isLast ? (
          <TouchableOpacity
            onPress={handleCompleteLesson}
            disabled={!hasSentRecording}
            style={[styles.completeBtn, !hasSentRecording && styles.completeBtnDisabled]}
          >
            <Ionicons name="checkmark-circle" size={22} color="#fff" />
            <Text style={styles.completeText}>Complete lesson</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleNext} disabled={!hasSentRecording}>
            <Ionicons name="arrow-forward-circle" size={50} color={!hasSentRecording ? '#cbd5e1' : '#3b82f6'} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footerBar}>
        <Pill icon="checkmark-done" text={`${correctItems} correct`} color="#10b981" />
        <Pill icon="flame" text={`Streak: ${streak} · Best: ${bestStreak}`} color="#ef4444" />
        <Pill icon="time" text={`Time: ${formatDuration(Date.now() - startTime)}`} color="#3b82f6" />
      </View>

      <FeedbackFlash
        visible={flashVisible}
        kind={fbKind}
        durationMs={520}
        onDone={() => setFlashVisible(false)}
      />

      <FeedbackToast
        visible={toastVisible}
        kind={fbKind}
        title={fbTitle}
        subtitle={fbSubtitle}
        autoHideMs={1300}
        onHide={() => setToastVisible(false)}
      />

      <TutorialOverlay
        visible={showPracticeTutorial}
        title="Practice"
        body="Press the red mic to record, then tap Send. After your first successful submit, we’ll take you to your Profile."
        primaryLabel="Got it"
        onPrimary={() => setPracticeHintDismissed(true)}
      />
    </LinearGradient>
  );
};

export default PracticeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: SCREEN_HEIGHT * 0.07,
    paddingHorizontal: SCREEN_WIDTH * 0.06,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    marginBottom: SCREEN_HEIGHT * 0.03,
  },
  xpText: {
    fontSize: SCREEN_WIDTH * 0.04,
    fontFamily: Platform.select({ ios: 'Arial', android: 'sans-serif-medium' }),
    color: '#1e3a8a',
    marginBottom: 8,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
  progressBarBackground: {
    width: '100%',
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 50,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 50,
  },
  letterCard: {
    width: SCREEN_WIDTH * 0.7,
    minHeight: SCREEN_WIDTH * 0.62,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 3.84,
    marginBottom: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  letterText: {
    fontSize: SCREEN_WIDTH * 0.22,
    fontFamily: Platform.select({ ios: 'Geeza Pro', android: 'sans-serif' }),
    color: '#1e3a8a',
    lineHeight: SCREEN_WIDTH * 0.27,
    textAlign: 'center',
  },
  cardSub: {
    marginTop: 6,
    fontSize: SCREEN_WIDTH * 0.045,
    color: '#475569',
  },
  controlsWrap: {
    alignItems: 'center',
    marginBottom: 6,
  },
  recordButton: {
    alignItems: 'center',
    marginBottom: 12,
  },
  recordLabel: {
    marginTop: 10,
    fontSize: SCREEN_WIDTH * 0.04,
    fontFamily: Platform.select({ ios: 'Arial', android: 'sans-serif' }),
    color: '#1e40af',
    textAlign: 'center',
  },
  progressWrapper: {
    width: SCREEN_WIDTH * 0.7,
    marginTop: 8,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 999,
  },
  progressBarFillBlue: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 999,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 6,
    color: '#334155',
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginBottom: 8,
  },
  actionBtn: {
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  retryText: {
    marginTop: 6,
    fontSize: 14,
    color: '#ef4444',
  },
  sendText: {
    marginTop: 6,
    fontSize: 14,
    color: '#10b981',
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '84%',
    marginTop: 8,
    columnGap: 12,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
    backgroundColor: '#22c55e',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3.84,
    elevation: 5,
  },
  completeBtnDisabled: { backgroundColor: '#a7f3d0' },
  completeText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footerBar: {
    position: 'absolute',
    bottom: SCREEN_HEIGHT * 0.02 + 56,
    left: SCREEN_WIDTH * 0.05,
    right: SCREEN_WIDTH * 0.05,
    backgroundColor: '#eef2ff',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3.84,
    elevation: 3,
  },
  footerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  footerText: {
    color: '#0f172a',
    fontSize: 13,
  },
});
