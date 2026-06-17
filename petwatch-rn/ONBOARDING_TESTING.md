# Onboarding System - Testing & Debugging Guide

## Quick Start Testing

### Test Fresh Install (Onboarding Visible)

```bash
# Clear AsyncStorage to simulate fresh install
npm start
# In app: Open Developer Menu (Cmd+D on iOS, Cmd+M on Android)
# Run this in console or add to useEffect:

import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.removeItem('hasSeenOnboarding');
// App will restart showing Splash screen
```

### Test Complete Onboarding Flow

1. **Splash Screen** (2.5 seconds)
   - Shows animated Vetintel logo
   - Three-dot loading indicator
   - Auto-advances to Welcome after timeout

2. **Welcome Screen**
   - Shows Vetintel logo
   - 4 feature cards with emoji icons
   - Two CTAs:
     - "Take a Tour" → Walkthrough
     - "Skip for Now" → Login

3. **Walkthrough Screen**
   - 5-slide carousel with progress bar
   - Slides cover: Welcome, Health Records, Appointments, Find Clinics, Tips
   - Navigation:
     - Dots allow jumping between slides
     - "Previous" button (disabled on slide 1)
     - "Next" button changes to "Get Started" on last slide
     - "Skip" button → Tooltip Guide

4. **Tooltip Guide Screen**
   - 4 expandable sections with tips
   - Progress tracking (% complete)
   - Two CTAs:
     - "Get Started" → Login
     - "Maybe Later" → Login

5. **Login Screen** (after onboarding completion)

## Testing Specific Scenarios

### Scenario 1: Skip at Welcome
```typescript
// At Welcome screen
User: Press "Skip for Now"
Expected: Navigate to Login (onboarding marked complete)
Result: ✓ Navigate to Login screen
```

### Scenario 2: Skip at Walkthrough
```typescript
// At Walkthrough slide 2
User: Press "Skip" button
Expected: Navigate to Tooltip Guide
Result: ✓ Show TooltipGuide
```

### Scenario 3: View All Walkthrough Slides
```typescript
// At Walkthrough screen
User: 
  1. Click dot 4 (skip to slide 4)
  2. Press "Next" to go to slide 5
  3. Press "Get Started"
Expected: Complete onboarding and go to Login
Result: ✓ Should complete
```

### Scenario 4: Reset Onboarding (Developer)
```typescript
// In any screen during testing
import { useOnboarding } from '../context/OnboardingContext';

const { resetOnboarding } = useOnboarding();

// Add this button to test screen
<TouchableOpacity onPress={async () => {
  await resetOnboarding();
  // App will show onboarding again on next load
}}>
  <Text>Reset Onboarding</Text>
</TouchableOpacity>
```

## Debugging Common Issues

### Issue 1: Splash Screen Doesn't Auto-Advance

**Symptom:** Stuck on Splash screen after 2.5 seconds

**Check:**
```typescript
// In SplashScreen.tsx
// Verify setTimeout exists in useEffect
useEffect(() => {
  const timer = setTimeout(() => {
    navigation.replace('Welcome');
  }, 2500);
  return () => clearTimeout(timer);
}, []);
```

**Solution:**
- Clear cache: `expo start --clear`
- Verify navigation prop is passed
- Check console for errors

### Issue 2: Onboarding Appears After Login

**Symptom:** User completes login but sees onboarding again

**Check:**
```typescript
// Verify AsyncStorage is saving correctly
const completeOnboarding = async () => {
  console.log('Setting onboarding as complete...');
  await AsyncStorage.setItem('hasSeenOnboarding', 'true');
  setHasSeenOnboarding(true);
};
```

**Solution:**
- Verify `completeOnboarding()` is called before navigation
- Check AsyncStorage permissions in app.json
- Verify OnboardingProvider wraps entire app tree

### Issue 3: Navigation.replace() Not Working

**Symptom:** Going back from Splash screen

**Check:**
```typescript
// In SplashScreen.tsx - use navigation.replace, not navigation.navigate
navigation.replace('Welcome'); // Correct
// NOT: navigation.navigate('Welcome');
```

**Solution:**
- Always use `replace` for onboarding flow (prevents back navigation)
- Use `navigate` only for app screens

### Issue 4: Logo Not Showing

**Symptom:** Blank space where VetintelLogo should appear

**Check:**
```typescript
// Verify import
import VetintelLogo from '../images/VetintelLogo';

// Verify SVG is installed
// In terminal: npm list react-native-svg
```

**Solution:**
- Ensure `react-native-svg` is installed: `expo install react-native-svg`
- Verify VetintelLogo.tsx is in `src/images/`
- Check for console errors about SVG rendering

## Performance Testing

### Check Onboarding Memory Footprint

```typescript
// In App.tsx or DevTools
import { YellowBox } from 'react-native';

// Add logging to OnboardingContext
useEffect(() => {
  console.log('OnboardingProvider mounted');
  return () => console.log('OnboardingProvider unmounted');
}, []);
```

### Measure Animation Performance

```typescript
// In WalkthroughScreen or SplashScreen
// Check Animated API performance
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 800,
  useNativeDriver: true, // Ensures smooth 60fps
}).start();
```

## User Analytics to Track

```typescript
// Add these events to track onboarding effectiveness
const analyticsEvents = {
  'onboarding_started': { timestamp, device },
  'splash_viewed': { duration: 2500 },
  'welcome_viewed': { timestamp },
  'walkthrough_started': { timestamp },
  'walkthrough_skipped': { slide_number, timestamp },
  'tooltip_guide_viewed': { timestamp },
  'tooltip_expanded': { section_id, timestamp },
  'onboarding_completed': { total_time, path },
  'login_from_onboarding': { timestamp },
};
```

## Regression Testing Checklist

- [ ] Fresh install shows Splash screen
- [ ] Splash advances to Welcome after 2.5s
- [ ] Welcome shows all 4 feature cards
- [ ] "Take a Tour" navigates to Walkthrough
- [ ] "Skip for Now" navigates to Login
- [ ] All 5 walkthrough slides load
- [ ] Walkthrough dot navigation works
- [ ] "Skip" on walkthrough goes to Tooltip
- [ ] "Get Started" on last slide goes to Login
- [ ] Tooltip sections expand/collapse
- [ ] Tooltip progress updates correctly
- [ ] "Get Started" completes onboarding
- [ ] "Maybe Later" goes to Login
- [ ] Can't go back from Splash/Welcome
- [ ] Onboarding doesn't reappear after completion
- [ ] Logo renders correctly on all screens
- [ ] All text is readable
- [ ] Buttons are tappable (min 44x44 pt)
- [ ] Works on small and large screens
- [ ] Works in portrait and landscape

## Manual Testing Script

```typescript
// Test file - add to screens folder temporarily
export function OnboardingTestScreen() {
  const { hasSeenOnboarding, completeOnboarding, resetOnboarding } = useOnboarding();
  
  return (
    <View style={{ padding: 20 }}>
      <Text>Onboarding Status: {hasSeenOnboarding ? 'COMPLETE' : 'PENDING'}</Text>
      
      <TouchableOpacity 
        onPress={completeOnboarding}
        style={{ backgroundColor: 'blue', padding: 10, marginTop: 10 }}
      >
        <Text style={{ color: 'white' }}>Mark Complete</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={resetOnboarding}
        style={{ backgroundColor: 'red', padding: 10, marginTop: 10 }}
      >
        <Text style={{ color: 'white' }}>Reset</Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Error Log Examples

### Expected Errors (Normal)
```
[Console]: "Setting onboarding as complete..."
[Console]: "Onboarding navigation to Login"
```

### Unexpected Errors (Fix)
```
[Error]: "Cannot read property 'replace' of undefined"
→ Fix: Ensure useNavigation hook is imported

[Error]: "VetintelLogo is not defined"
→ Fix: Import VetintelLogo component

[Error]: "Undefined is not a function (completeOnboarding)"
→ Fix: Ensure useOnboarding hook is available
```

## Device Testing

### Test on Different Devices
```bash
# iOS Simulator
expo start
# Press i

# Android Emulator
expo start
# Press a

# Physical device
# Scan QR code with Expo app
```

### Test Different Screen Sizes
- iPhone 12 mini (small)
- iPhone 14 (medium)
- iPad (large)
- Foldable devices

## CI/CD Testing

```yaml
# Example test command for CI
test:onboarding:
  script:
    - npm test -- src/context/OnboardingContext.test.ts
    - npm test -- src/screens/SplashScreen.test.tsx
    - npm test -- src/screens/WelcomeScreen.test.tsx
    - npm test -- src/screens/WalkthroughScreen.test.tsx
    - npm test -- src/screens/TooltipGuideScreen.test.tsx
```

## Need Help?

Check these files for more information:
- `ONBOARDING_SETUP.md` - Configuration guide
- `OnboardingContext.tsx` - State management
- `AppNavigator.tsx` - Navigation logic
- `App.tsx` - Provider setup
