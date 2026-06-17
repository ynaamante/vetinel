# Vetintel Onboarding System Setup Guide

## Overview
A complete onboarding sequence has been implemented for the Vetintel PetWatch app. This includes:

1. **Splash Screen** - Animated launch screen with logo and app name
2. **Welcome Screen** - Introduction to app features and benefits
3. **Walkthrough Screen** - 5-slide interactive tutorial covering key features
4. **Tooltip/Interactive Guide** - Detailed tips and best practices with progress tracking

## Architecture

### Files Created:

#### Context
- **`src/context/OnboardingContext.tsx`** - Manages onboarding state using AsyncStorage
  - Tracks if user has seen onboarding with `hasSeenOnboarding` flag
  - Methods: `completeOnboarding()`, `resetOnboarding()`
  - Persists state across app sessions

#### Screens
- **`src/screens/SplashScreen.tsx`** - 2.5 second animated splash screen
- **`src/screens/WelcomeScreen.tsx`** - Feature showcase with CTA buttons
- **`src/screens/WalkthroughScreen.tsx`** - 5-step carousel tutorial
- **`src/screens/TooltipGuideScreen.tsx`** - Interactive guide with progress tracking

#### Logo
- **`src/images/VetintelLogo.tsx`** - SVG-based logo component (no external images needed)

#### Navigation
- **`src/navigation/AppNavigator.tsx`** - Updated with onboarding flow
- **`App.tsx`** - Wrapped with `OnboardingProvider`

## Navigation Flow

```
App Start
    ↓
OnboardingProvider Check
    ↓
┌─────────────────────────────────────────┐
│ Has user seen onboarding?               │
└─────────────────────────────────────────┘
    ↓ YES                 ↓ NO
    ↓                     ├─→ Splash Screen (2.5s)
    ↓                     ├─→ Welcome Screen
    ↓                     ├─→ Walkthrough (5 slides)
    ↓                     └─→ Tooltip Guide
    ↓
┌─────────────────────────────────────────┐
│ Is user logged in?                      │
└─────────────────────────────────────────┘
    ↓ YES                 ↓ NO
    ↓                     ├─→ Login Screen
    ↓                     ├─→ Register Screen
    ↓                     └─→ Clinic Selection
    ↓
    └─→ App Home (TabNav)
```

## Customization

### Colors
Edit the Walkthrough and Tooltip slides to use custom colors. Currently using:
- Primary: `#4F46E5` (Indigo)
- Secondary: `#0EA5E9` (Cyan)
- Accent: `#7C3AED` (Purple)
- Success: `#14B8A6` (Teal)

Update in respective screen files or centralize in `src/theme/colors.ts`.

### Logo
To replace the SVG logo with an image:

1. Place your logo image in `src/images/` folder
2. Update `src/images/VetintelLogo.tsx` to use Image component:

```typescript
import { Image } from 'react-native';

export default function VetintelLogo({ width = 200, height = 200 }: LogoProps) {
  return (
    <Image
      source={require('./vetintel-logo.png')} // or use URI
      style={{ width, height }}
      resizeMode="contain"
    />
  );
}
```

### Walkthrough Slides
Edit slides array in `src/screens/WalkthroughScreen.tsx`:

```typescript
const slides: Slide[] = [
  {
    id: 1,
    title: 'Custom Title',
    description: 'Your custom description...',
    icon: '🎯', // emoji or custom icon
    color: '#YourColor',
  },
  // Add more slides...
];
```

### Tooltip Sections
Customize tooltip content in `src/screens/TooltipGuideScreen.tsx`:

```typescript
const tooltips: Tooltip[] = [
  {
    id: 1,
    title: 'Custom Section',
    description: 'Description...',
    icon: '🎯',
    tips: [
      'Tip 1',
      'Tip 2',
      // Add more tips...
    ],
  },
  // Add more tooltips...
];
```

## Reset Onboarding (Dev Testing)

To reset onboarding for testing:

```typescript
// In any screen component
const { resetOnboarding } = useOnboarding();

// Call this to reset
await resetOnboarding();
```

Or use AsyncStorage directly:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.removeItem('hasSeenOnboarding');
```

## Skipping Onboarding

Users can skip at any point:
- **Welcome Screen**: "Skip for Now" button → Goes to Login
- **Walkthrough**: "Skip" button → Goes to Tooltip Guide
- **Tooltip Guide**: "Maybe Later" button → Goes to Login

## Theme Integration

The onboarding screens use:
- `useTheme()` hook for dynamic theming
- `colors` object from `src/theme/colors.ts` for consistency
- Responsive design adapting to screen sizes

## Analytics / Tracking (Optional)

To add analytics to onboarding completion, modify `OnboardingContext.tsx`:

```typescript
const completeOnboarding = async () => {
  // Add analytics tracking here
  // Example: analytics.logEvent('onboarding_completed');
  
  await AsyncStorage.setItem('hasSeenOnboarding', 'true');
  setHasSeenOnboarding(true);
};
```

## Dependencies Used

All dependencies already in `package.json`:
- `react-native-svg` - For SVG logo rendering
- `@react-native-async-storage/async-storage` - For persistence
- `@react-navigation/*` - For navigation
- `expo-status-bar` - For status bar styling

No additional packages needed!

## Testing

Run the app:
```bash
npm start
# or
expo start
```

Test onboarding flow:
1. Fresh install → See all onboarding screens
2. Complete onboarding → See Login screen
3. Logout user → Should go to Login, not onboarding again
4. Clear AsyncStorage → Onboarding reappears

## Accessibility

The onboarding screens include:
- Clear text hierarchy
- High contrast colors
- Large touch targets (min 44x44 pt)
- Proper spacing for readability
- Alt text considerations for future image additions
