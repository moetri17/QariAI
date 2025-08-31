/**
 * BackButton Component
 * Displays a back button in the top-left corner of the screen.
 * When pressed, it takes the user back to the previous screen,
 * or to a fallback page if no previous screen exists.
 * The icon and button style can be customised.
 */

import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

type Props = {
  style?: ViewStyle;
  fallbackRoute?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
};

const BackButton: React.FC<Props> = ({ style, fallbackRoute, iconName = 'arrow-back' }) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const onPress = () => {
    if (navigation.canGoBack?.()) {
      navigation.goBack();
    } else if (fallbackRoute) {
      navigation.navigate(fallbackRoute as never);
    }
  };

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.15)', borderless: true }}
      style={[
        styles.button,
        {
          top: insets.top + 8,
          left: 16,
        },
        style,
      ]}
      hitSlop={12}
    >
      <Ionicons name={iconName} size={22} color="#FFFFFF" />
    </Pressable>
  );
};

export default BackButton;

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    zIndex: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
