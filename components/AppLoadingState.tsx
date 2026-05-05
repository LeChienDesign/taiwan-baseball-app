import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';

type AppLoadingStateProps = {
  text?: string;
  variant?: 'screen' | 'card';
};

export default function AppLoadingState({
  text = '載入中...',
  variant = 'card',
}: AppLoadingStateProps) {
  const ringRotate = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.86)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ringLoop = Animated.loop(
      Animated.timing(ringRotate, {
        toValue: 1,
        duration: 980,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    ringLoop.start();

    Animated.sequence([
      Animated.delay(120),
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 360,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    return () => {
      ringLoop.stop();
    };
  }, [ringRotate, logoOpacity, logoScale, textOpacity]);

  const spin = ringRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const content = (
    <>
      <View style={styles.loaderWrap}>
        <Animated.View style={[styles.brushRing, { transform: [{ rotate: spin }] }]}>
          <View style={styles.brushHead} />
        </Animated.View>

        <Animated.View
          style={[
            styles.logoWrap,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require('../assets/brand/yaren-one-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      <Animated.Text style={[styles.loadingText, { opacity: textOpacity }]}>
        {text}
      </Animated.Text>
    </>
  );

  if (variant === 'screen') {
    return <View style={styles.screenWrap}>{content}</View>;
  }

  return <View style={styles.cardWrap}>{content}</View>;
}

const styles = StyleSheet.create({
  screenWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020617',
  },
  cardWrap: {
    borderRadius: 20,
    backgroundColor: '#071226',
    borderWidth: 1,
    borderColor: '#1b2940',
    padding: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderWrap: {
    width: 92,
    height: 92,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brushRing: {
    position: 'absolute',
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 5,
    borderColor: 'rgba(239,68,68,0.16)',
    borderTopColor: '#ef4444',
    borderRightColor: '#f97316',
  },
  brushHead: {
    position: 'absolute',
    top: -5,
    right: 10,
    width: 13,
    height: 13,
    borderRadius: 999,
    backgroundColor: '#fb923c',
    shadowColor: '#ef4444',
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  logoWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  loadingText: {
    color: '#c7d2e5',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
