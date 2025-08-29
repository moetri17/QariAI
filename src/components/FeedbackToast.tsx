import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  visible: boolean;
  kind: 'success' | 'neutral' | 'error';
  title: string;
  subtitle?: string;
  onHide?: () => void;
  autoHideMs?: number;
};

const ICON = {
  success: 'checkmark-circle',
  neutral: 'information-circle',
  error: 'close-circle',
} as const;

const BG = {
  success: '#ecfdf5',
  neutral: '#eff6ff',
  error: '#fef2f2',
} as const;

const FG = {
  success: '#059669',
  neutral: '#2563eb',
  error: '#dc2626',
} as const;

const FeedbackToast: React.FC<Props> = ({ visible, kind, title, subtitle, onHide, autoHideMs = 1300 }) => {
  const slide = useRef(new Animated.Value(40)).current;
  const fade  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let timer: any;
    if (visible) {
      Animated.parallel([
        Animated.timing(slide, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(fade,  { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slide, { toValue: 40, duration: 180, useNativeDriver: true }),
          Animated.timing(fade,  { toValue: 0, duration: 180, useNativeDriver: true }),
        ]).start(() => onHide?.());
      }, autoHideMs);
    }
    return () => timer && clearTimeout(timer);
  }, [visible, slide, fade, onHide, autoHideMs]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.wrap, { transform: [{ translateY: slide }], opacity: fade }]}
    >
      <View style={[styles.card, { backgroundColor: BG[kind], borderColor: FG[kind] }]}>
        <Ionicons name={ICON[kind] as any} size={24} color={FG[kind]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: FG[kind] }]}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
    </Animated.View>
  );
};

export default FeedbackToast;

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    bottom: 110,
    left: 20, right: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  title: { fontSize: 15, fontWeight: '700' },
  subtitle: { fontSize: 12, color: '#334155', marginTop: 2 },
});
