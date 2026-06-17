# PetWatch (React Native / Expo)

A comprehensive React Native application (built with Expo and TypeScript) for managing pet health: appointments, reports, clinics, and pet profiles.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (optional globally) — or use `npx expo` / `npm run` scripts
- A physical device or simulator (Android Studio / Xcode) to run the app

## Installation & Setup

Navigate to the petwatch-rn directory and install dependencies:

```bash
cd petwatch-rn
npm install
```

**PetWatch Dependencies:**

**Production Dependencies:**
- `expo` (v54.0.35) - Expo framework
- `react` (19.1.0) - React library
- `react-native` (0.81.5) - React Native framework
- `@react-navigation/native` (v6.1.17) - Navigation library
- `@react-navigation/native-stack` (v6.9.26) - Stack navigator
- `@react-navigation/bottom-tabs` (v6.5.20) - Tab navigator
- `@react-native-async-storage/async-storage` (2.2.0) - Local storage
- `expo-linear-gradient` (v15.0.8) - Linear gradient support
- `expo-status-bar` (v3.0.9) - Status bar management
- `react-native-reanimated` (v4.1.1) - Animation library
- `react-native-screens` (v4.16.0) - Screen management
- `react-native-safe-area-context` (v5.6.0) - Safe area handling
- `react-native-svg` (15.12.1) - SVG support
- `react-native-qrcode-svg` (v6.3.1) - QR code generation
- `react-native-toast-message` (v2.2.0) - Toast notifications
- `@expo/vector-icons` (v15.0.3) - Icon library
- `date-fns` (v3.6.0) - Date utilities
- `typescript` (v5.9.2) - Type checking

**Development Dependencies:**
- `@babel/core` (v7.24.0) - Babel transpiler
- `babel-preset-expo` (v54.0.10) - Expo Babel preset
- `@types/react` (v19.1.10) - React type definitions

## Running the Application

### Start Development Server

```bash
npm start
```

This will launch the Expo CLI with a QR code for your mobile device.

### Run on Android

```bash
npm run android
```

Requires Android emulator or connected device.

### Run on iOS

```bash
npm run ios
```

Requires Xcode and macOS.

### Building for Production

To create optimized builds for app stores:

```bash
# For iOS
eas build --platform ios

# For Android
eas build --platform android
```

## Project Structure

- [App.tsx](App.tsx) — app entry point
- [app.json](app.json) — Expo configuration
- [src/navigation/AppNavigator.tsx](src/navigation/AppNavigator.tsx#L1) — navigation setup
- [src/context/AuthContext.tsx](src/context/AuthContext.tsx#L1) — authentication context
- [src/screens](src/screens) — screen implementations (Home, Login, Register, etc.)
  - [HomeScreen.tsx](src/screens/HomeScreen.tsx#L1)
  - [PetDetailsScreen.tsx](src/screens/PetDetailsScreen.tsx#L1)
  - [BookAppointmentScreen.tsx](src/screens/BookAppointmentScreen.tsx#L1)
- [src/data/mockData.ts](src/data/mockData.ts#L1) — mock data used by screens
- [src/theme/colors.ts](src/theme/colors.ts#L1) — color constants

Explore the `src/screens` folder for additional screen implementations.

## Configuration Files

- `tsconfig.json` — TypeScript configuration
- `app.json` — Expo configuration (app name, version, icon, etc.)
- `babel.config.js` — Babel configuration with Expo preset
- `package.json` — Dependencies and scripts

## Notes

- This app uses TypeScript for type safety
- Navigation is implemented with React Navigation (Bottom Tab + Stack Navigator)
- App-wide state can be managed using React Context (see AuthContext.tsx)
- Build system uses Expo for simplified React Native development
- Animations use React Native Reanimated for performance

## Troubleshooting

If you encounter issues:

1. Clear cache: `expo start -c`
2. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
3. Check Expo CLI: `npx expo --version`
4. Update Expo: `npm install -g expo@latest`

Clone with HTTPS:

```bash
git clone https://github.com/<owner>/<repo>.git
```

Or clone with SSH:

```bash
git clone git@github.com:<owner>/<repo>.git
```

Then change into the project folder:

```bash
cd petwatch-rn
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Start the Expo dev server:

```bash
npm start
# or
yarn start
# or explicitly
npx expo start
```

4. Run on a device/emulator:

```bash
npm run android   # open on Android (uses expo start --android)
npm run ios       # open on iOS simulator (uses expo start --ios)
```

Notes:
- If prompted to install missing native dependencies, follow the CLI prompts or run `expo install <package>` for Expo-managed compatible versions.
- For real device testing, install the Expo Go app and scan the QR code from the dev server.

## Dependencies

These are the primary dependencies declared in `package.json`:

- @expo/vector-icons
- @react-native-async-storage/async-storage
- @react-navigation/bottom-tabs
- @react-navigation/native
- @react-navigation/native-stack
- date-fns
- expo
- expo-status-bar
- react
- react-native
- react-native-qrcode-svg
- react-native-safe-area-context
- react-native-screens
- react-native-svg
- react-native-toast-message
- typescript

Dev dependencies:

- @babel/core

Refer to [package.json](package.json) for exact versions.

## Notes for contributors

- The app is written in TypeScript; keep types consistent when adding new modules.
- Use existing Context providers for cross-cutting state (see [src/context](src/context)).
- Add new navigation routes in [src/navigation/AppNavigator.tsx](src/navigation/AppNavigator.tsx#L1).

## Troubleshooting

- If the Metro bundler shows a native module error, run `expo doctor` to detect common issues.
- Clear cache if you get stale builds:

```bash
npx expo start -c
```

## Next steps (suggested)

- Add unit or integration tests (Jest + React Native Testing Library).
- Add CI workflow to run linting and tests on PRs.

---

> Why do I have a folder named ".expo" in my project?
The ".expo" folder is created when an Expo project is started using "expo start" command.
> What do the files contain?
- "devices.json": contains information about devices that have recently opened this project. This is used to populate the "Development sessions" list in your development builds.
- "settings.json": contains the server configuration that is used to serve the application manifest.
> Should I commit the ".expo" folder?
No, you should not share the ".expo" folder. It does not contain any information that is relevant for other developers working on the project, it is specific to your machine.
Upon project creation, the ".expo" folder is already added to your ".gitignore" file.

