import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SectionHeader from '../components/SectionHeader';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const LevelsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();

  return (
    <LinearGradient colors={['#e0f2ff', '#cce4f6']} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + SCREEN_HEIGHT * 0.02 },
        ]}
      >
        <Text style={styles.logo}>QariAI</Text>

        <SectionHeader icon="language-outline" title="Section 1: Letters" progress={0.45} />
        
        <View style={styles.roadmapBubble}>
          <Text style={styles.levelLabel}>Level 1</Text>
          <Text style={styles.levelDesc}>Learn the Arabic Alphabet</Text>
          <TouchableOpacity
            style={styles.levelButton}
            onPress={() => navigation.navigate('Practice')}
          >
            <Text style={styles.buttonText}>Start</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.connector} />

        <SectionHeader icon="chatbox-ellipses-outline" title="Section 2: Words" progress={0.20}/>
        <View style={styles.levelRow}>
          <View style={styles.roadmapBubbleSmall}>
            <Text style={styles.levelLabel}>Level 2</Text>
            <Text style={styles.levelDescSmall}>Basic Words</Text>
            <TouchableOpacity style={styles.levelButtonSmall}>
              <Text style={styles.buttonText}>Go</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.roadmapBubbleSmall}>
            <Text style={styles.levelLabel}>Level 3</Text>
            <Text style={styles.levelDescSmall}>Daily Vocab</Text>
            <TouchableOpacity style={styles.levelButtonSmall}>
              <Text style={styles.buttonText}>Go</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.connector} />

        <SectionHeader icon="musical-notes-outline" title="Section 3: Verses" progress={0.60}/>
          <View style={styles.roadmapBubble}>
          <Text style={styles.levelLabel}>Level 4</Text>
          <Text style={styles.levelDesc}>Short Surahs & Phrases</Text>
          <TouchableOpacity style={styles.levelButton}>
            <Text style={styles.buttonText}>Start</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default LevelsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SCREEN_HEIGHT * 0.04,
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.05,
  },
  logo: {
    fontSize: SCREEN_WIDTH * 0.08,
    fontFamily: 'Tajawal-Bold',
    color: '#1e3a8a',
    marginBottom: SCREEN_HEIGHT * 0.015,
  },
  sectionTitle: {
    fontSize: SCREEN_WIDTH * 0.05,
    fontFamily: 'Tajawal-Bold',
    color: '#1e3a8a',
    marginVertical: SCREEN_HEIGHT * 0.015,
    alignSelf: 'flex-start',
  },
  roadmapBubble: {
    width: SCREEN_WIDTH * 0.9,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: SCREEN_HEIGHT * 0.025,
    paddingHorizontal: SCREEN_WIDTH * 0.06,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  roadmapBubbleSmall: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: SCREEN_HEIGHT * 0.02,
    paddingHorizontal: SCREEN_WIDTH * 0.04,
    alignItems: 'center',
    marginHorizontal: SCREEN_WIDTH * 0.015,
    elevation: 2,
  },
  levelLabel: {
    fontSize: SCREEN_WIDTH * 0.045,
    fontFamily: 'Tajawal-Bold',
    color: '#1e40af',
  },
  levelDesc: {
    fontSize: SCREEN_WIDTH * 0.035,
    fontFamily: 'Tajawal-Regular',
    color: '#475569',
    marginVertical: SCREEN_HEIGHT * 0.01,
    textAlign: 'center',
  },
  levelDescSmall: {
    fontSize: SCREEN_WIDTH * 0.03,
    fontFamily: 'Tajawal-Regular',
    color: '#475569',
    marginVertical: SCREEN_HEIGHT * 0.005,
    textAlign: 'center',
  },
  levelButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: SCREEN_HEIGHT * 0.015,
    paddingHorizontal: SCREEN_WIDTH * 0.12,
    borderRadius: 10,
    marginTop: SCREEN_HEIGHT * 0.008,
  },
  levelButtonSmall: {
    backgroundColor: '#3b82f6',
    paddingVertical: SCREEN_HEIGHT * 0.012,
    paddingHorizontal: SCREEN_WIDTH * 0.07,
    borderRadius: 10,
    marginTop: SCREEN_HEIGHT * 0.005,
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Tajawal-Bold',
    fontSize: SCREEN_WIDTH * 0.035,
  },
  connector: {
    width: SCREEN_WIDTH * 0.01,
    height: SCREEN_HEIGHT * 0.03,
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    marginVertical: SCREEN_HEIGHT * 0.02,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SCREEN_HEIGHT * 0.025,
  },
});
