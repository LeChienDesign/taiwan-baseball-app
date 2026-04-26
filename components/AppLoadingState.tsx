import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

type AppLoadingStateProps = {
  text?: string;
  variant?: 'screen' | 'card';
};

export default function AppLoadingState({
  text = '載入中...',
  variant = 'card',
}: AppLoadingStateProps) {
  if (variant === 'screen') {
    return (
      <View style={styles.screenWrap}>
        <ActivityIndicator size="small" color="#60a5fa" />
        <Text style={styles.loadingText}>{text}</Text>
      </View>
    );
  }

  return (
    <View style={styles.cardWrap}>
      <ActivityIndicator size="small" color="#60a5fa" />
      <Text style={styles.loadingText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09111f',
  },
  cardWrap: {
    borderRadius: 20,
    backgroundColor: '#111b2a',
    borderWidth: 1,
    borderColor: '#1b2940',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#8da2c0',
    fontSize: 13,
    fontWeight: '600',
  },
});