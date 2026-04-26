import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useRouter } from 'expo-router';

type BackButtonProps = {
  fallbackHref?: string;
  style?: StyleProp<ViewStyle>;
};

export default function BackButton({
  fallbackHref = '/events/pro',
  style,
}: BackButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    try {
      if (fallbackHref) {
        router.replace(fallbackHref as any);
        return;
      }

      router.back();
    } catch (error) {
      console.warn('BackButton navigation failed:', error);

      if (fallbackHref) {
        router.push(fallbackHref as any);
      }
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={[styles.button, style]}
    >
      <Text style={styles.arrow}>‹</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#162033',
    borderWidth: 1,
    borderColor: '#2d3b56',
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    color: '#ffffff',
    fontSize: 34,
    lineHeight: 36,
    fontWeight: '700',
    marginLeft: -2,
  },
});