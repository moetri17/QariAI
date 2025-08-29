// src/tutorial/TutorialOverlay.tsx
/**
 * Component: TutorialOverlay
 * Purpose: Small modal overlay with message + primary/secondary CTA.
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

type Props = {
  visible: boolean;
  title: string;
  body: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export default function TutorialOverlay({
  visible, title, body, primaryLabel, onPrimary, secondaryLabel, onSecondary,
}: Props) {
  if (!visible) return null;
  return (
    <View style={{
      position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end',
    }}>
      <View style={{
        backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16,
        padding: 16, gap: 8,
      }}>
        <Text style={{ fontSize: 18, fontWeight: '700' }}>{title}</Text>
        <Text style={{ fontSize: 14, opacity: 0.85 }}>{body}</Text>

        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 }}>
          {secondaryLabel && onSecondary && (
            <TouchableOpacity onPress={onSecondary} style={{ paddingVertical: 10, paddingHorizontal: 14 }}>
              <Text style={{ fontWeight: '600' }}>{secondaryLabel}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={onPrimary}
            style={{ backgroundColor: '#1976D2', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>{primaryLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
