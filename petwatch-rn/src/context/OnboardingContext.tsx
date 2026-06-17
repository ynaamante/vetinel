import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingCtx {
  hasSeenOnboarding: boolean;
  completeOnboarding: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingCtx | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user has seen onboarding on app launch
  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        // In development, always reset onboarding for testing
        if (__DEV__) {
          await AsyncStorage.removeItem('hasSeenOnboarding');
          setHasSeenOnboarding(false);
        } else {
          const value = await AsyncStorage.getItem('hasSeenOnboarding');
          setHasSeenOnboarding(value === 'true');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setIsLoading(false);
      }
    };
    checkOnboarding();
  }, []);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    setHasSeenOnboarding(true);
  };

  const resetOnboarding = async () => {
    await AsyncStorage.removeItem('hasSeenOnboarding');
    setHasSeenOnboarding(false);
  };

  if (isLoading) {
    return null; // or a loading screen
  }

  return (
    <OnboardingContext.Provider value={{ hasSeenOnboarding, completeOnboarding, resetOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be inside OnboardingProvider');
  return ctx;
}
