import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme/colors';
import { useOnboarding } from '../context/OnboardingContext';

const FEATURES = [
  { icon: '🐾', title: 'Pet health', description: "Vaccinations and records for every pet, in one place" },
  { icon: '📅', title: 'Appointments', description: 'Book and manage vet visits without the back-and-forth' },
  { icon: '🏥', title: 'Nearby clinics', description: 'Find trusted vets close to you, with directions and reviews' },
  { icon: '⚕️', title: 'Care guidance', description: 'Practical advice from veterinary professionals, when you need it' },
];

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();
  const { completeOnboarding } = useOnboarding();

  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(16);

  // Fixed number of shared values (one per feature card) declared at the
  // top level — hooks cannot be called inside map()/loops.
  const card0Opacity = useSharedValue(0);
  const card0Y = useSharedValue(14);
  const card1Opacity = useSharedValue(0);
  const card1Y = useSharedValue(14);
  const card2Opacity = useSharedValue(0);
  const card2Y = useSharedValue(14);
  const card3Opacity = useSharedValue(0);
  const card3Y = useSharedValue(14);

  const cardAnims = [
    { opacity: card0Opacity, translateY: card0Y },
    { opacity: card1Opacity, translateY: card1Y },
    { opacity: card2Opacity, translateY: card2Y },
    { opacity: card3Opacity, translateY: card3Y },
  ];

  const buttonsOpacity = useSharedValue(0);

  const card0Style = useAnimatedStyle(() => ({
    opacity: card0Opacity.value,
    transform: [{ translateY: card0Y.value }],
  }));
  const card1Style = useAnimatedStyle(() => ({
    opacity: card1Opacity.value,
    transform: [{ translateY: card1Y.value }],
  }));
  const card2Style = useAnimatedStyle(() => ({
    opacity: card2Opacity.value,
    transform: [{ translateY: card2Y.value }],
  }));
  const card3Style = useAnimatedStyle(() => ({
    opacity: card3Opacity.value,
    transform: [{ translateY: card3Y.value }],
  }));
  const cardStyles = [card0Style, card1Style, card2Style, card3Style];

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    headerTranslateY.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) });

    cardAnims.forEach((anim, index) => {
      const delay = 220 + index * 90;
      anim.opacity.value = withDelay(delay, withTiming(1, { duration: 420 }));
      anim.translateY.value = withDelay(delay, withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) }));
    });

    buttonsOpacity.value = withDelay(220 + FEATURES.length * 90 + 120, withTiming(1, { duration: 400 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
  }));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      <Animated.View style={[styles.header, headerStyle]}>
        <Image source={require('../images/Logo.png')} style={styles.logo} resizeMode="contain" />
        <Text style={styles.welcome}>Welcome to Vetintel</Text>
        <View style={styles.taglineRow}>
          <LinearGradient
            colors={[colors.teal, colors.blue, colors.violet]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.taglineDash}
          />
          <Text style={styles.tagline}>Smarter Care. Healthier Pets.</Text>
        </View>
        <Text style={styles.description}>
          Your complete pet health companion — built to keep your dogs and cats healthy, and you in the loop.
        </Text>
      </Animated.View>

      <View style={styles.featuresContainer}>
        {FEATURES.map((feature, index) => {
          const cardStyle = cardStyles[index];
          return (
            <Animated.View key={feature.title} style={[styles.featureCard, cardStyle]}>
              <View style={styles.featureIconWrap}>
                <Text style={styles.featureIcon}>{feature.icon}</Text>
              </View>
              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </Animated.View>
          );
        })}
      </View>

      <Animated.View style={[styles.buttonContainer, buttonsStyle]}>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Walkthrough')}
        >
          <LinearGradient
            colors={[colors.blue, colors.violet]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButtonGradient}
          >
            <Text style={styles.primaryButtonText}>Take a quick tour</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7} onPress={completeOnboarding}>
          <Text style={styles.secondaryButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingTop: 36,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  logo: {
    width: 104,
    height: 104,
    marginBottom: 18,
  },
  welcome: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.ink,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 18,
  },
  taglineDash: {
    width: 14,
    height: 3,
    borderRadius: 2,
  },
  tagline: {
    fontSize: 13,
    color: colors.slate,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  description: {
    fontSize: 15,
    color: colors.slateLight,
    lineHeight: 22,
    textAlign: 'center',
  },
  featuresContainer: {
    paddingHorizontal: 20,
    paddingTop: 28,
    gap: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderRadius: 16,
    padding: 16,
    gap: 14,
  },
  featureIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: {
    fontSize: 22,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.ink,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: colors.slateLight,
    lineHeight: 18,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 30,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.slateLight,
    fontSize: 15,
    fontWeight: '600',
  },
});