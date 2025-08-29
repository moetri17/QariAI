import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Dimensions, View } from 'react-native';

const { width, height } = Dimensions.get('window');

type Props = {
  visible: boolean;
  kind: 'success' | 'neutral' | 'error';
  onDone?: () => void;
  durationMs?: number;
};

const COLORS = {
  success: 'rgba(16,185,129,0.28)',
  neutral: 'rgba(59,130,246,0.22)',
  error:   'rgba(239,68,68,0.25)',
};

const FeedbackFlash: React.FC<Props> = ({ visible, kind, onDone, durationMs = 500 }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    opacity.setValue(0);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: Math.min(220, durationMs * 0.45), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: Math.max(280, durationMs * 0.55), useNativeDriver: true }),
    ]).start(() => onDone?.());
  }, [visible, durationMs, onDone, opacity]);

  if (!visible) return null;
  return (
    <Animated.View pointerEvents="none" style={[styles.overlay, { backgroundColor: COLORS[kind], opacity }]} />
  );
};

export default FeedbackFlash;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, width, height,
  },
});
