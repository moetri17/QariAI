import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  progress?: number;
  color?: string;
}

const SectionHeader = ({ icon, title, progress = 0, color = '#1e3a8a' }: Props) => {
  const percentage = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      <View style={styles.wrapper}>
        <Ionicons name={icon} size={20} color={color} style={styles.icon} />
        <Text style={[styles.title, { color }]}>{title}</Text>
      </View>

      <View style={styles.progressWrapper}>
        <View style={styles.barBackground}>
          <View style={[styles.barFill, { width: `${percentage}%` }]} />
        </View>
        <Text style={styles.percent}>{percentage}%</Text>
      </View>
    </View>
  );
};

export default SectionHeader;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: SCREEN_WIDTH * 0.05,
  },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0edff',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
    elevation: 2,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: SCREEN_WIDTH * 0.045,
    fontFamily: 'Tajawal-Bold',
  },
  progressWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  barBackground: {
    flex: 1,
    height: 10,
    backgroundColor: '#e2e8f0',
    borderRadius: 50,
    marginRight: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 50,
  },
  percent: {
    fontSize: SCREEN_WIDTH * 0.035,
    fontFamily: 'Tajawal-Bold',
    color: '#1e40af',
  },
});
