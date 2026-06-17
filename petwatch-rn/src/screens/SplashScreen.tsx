import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import Svg, { Polyline } from 'react-native-svg';
import { colors } from '../theme/colors';

const { width } = Dimensions.get('window');
const PULSE_WIDTH = Math.min(width * 0.5, 220);
const PULSE_LENGTH = 230; // approximate path length for the dash reveal

// A simplified heartbeat trace echoing the mark in the logo itself —
// the one signature motion for the whole onboarding flow.
const PULSE_POINTS = '0,20 30,20 42,4 54,36 66,20 80,20 92,8 104,20 140,20';

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);

export default function SplashScreen() {
  const navigation = useNavigation<any>();

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.85);
  const wordmarkOpacity = useSharedValue(0);
  const wordmarkTranslateY = useSharedValue(8);
  const drawProgress = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    logoScale.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.2)) });

    wordmarkOpacity.value = withDelay(280, withTiming(1, { duration: 500 }));
    wordmarkTranslateY.value = withDelay(280, withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) }));

    drawProgress.value = withDelay(
      500,
      withTiming(1, { duration: 850, easing: Easing.inOut(Easing.ease) })
    );

    const timer = setTimeout(() => {
      navigation.replace('Welcome');
    }, 2400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const wordmarkStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
    transform: [{ translateY: wordmarkTranslateY.value }],
  }));

  const pulseWrapStyle = useAnimatedStyle(() => ({
    opacity: wordmarkOpacity.value,
  }));

  const pulseAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: PULSE_LENGTH * (1 - drawProgress.value),
  }));

  return (
    <View style={styles.container}>
      <View style={styles.center}>
        <Animated.View style={[styles.logoWrap, logoStyle]}>
          <Image source={require('../images/Logo.png')} style={styles.logo} resizeMode="contain" />
        </Animated.View>

        <Animated.View style={[styles.pulseWrap, pulseWrapStyle]}>
          <Svg width={PULSE_WIDTH} height={40} viewBox="0 0 140 40">
            <AnimatedPolyline
              points={PULSE_POINTS}
              fill="none"
              stroke={colors.teal}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={PULSE_LENGTH}
              animatedProps={pulseAnimatedProps}
            />
          </Svg>
        </Animated.View>

        <Animated.View style={wordmarkStyle}>
          <Text style={styles.subtitle}>Smarter Care. Healthier Pets.</Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.deepSpace,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
  },
  logoWrap: {
    width: 200,
    height: 200,
    marginBottom: 8,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  pulseWrap: {
    marginBottom: 18,
  },
  subtitle: {
    fontSize: 13,
    color: '#A7B4C7',
    letterSpacing: 2,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
});