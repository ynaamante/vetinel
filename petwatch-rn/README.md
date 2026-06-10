# PetWatch (React Native)

A small React Native (Expo) app for managing pet health: appointments, reports, clinics, and pet profiles.

**Contents**
- **Overview**: high-level system explanation
- **Project structure**: important folders and files
- **Requirements**: tooling and versions
- **Install & run**: how to set up the environment and run the app
- **Dependencies**: list of key packages used

## Overview

PetWatch is a mobile application built with Expo and React Native (TypeScript). The app organizes screens for authentication, pet profiles, appointments, clinics, and health reports. Navigation is implemented with React Navigation and app-wide state uses React Context.

## Project structure

- [App.tsx](App.tsx) — app entry point
- [app.json](app.json) — Expo configuration
- [src/navigation/AppNavigator.tsx](src/navigation/AppNavigator.tsx#L1) — navigation setup
- [src/context/AuthContext.tsx](src/context/AuthContext.tsx#L1) — authentication context
- [src/screens](src/screens) — screen implementations (Home, Login, Register, etc.)
- [src/data/mockData.ts](src/data/mockData.ts#L1) — mock data used by screens
- [src/theme/colors.ts](src/theme/colors.ts#L1) — color constants

Explore the `src/screens` folder for application screens such as [HomeScreen](src/screens/HomeScreen.tsx#L1), [PetDetailsScreen](src/screens/PetDetailsScreen.tsx#L1), and [BookAppointmentScreen](src/screens/BookAppointmentScreen.tsx#L1).

## Requirements

- Node.js (recommended 16+)
- npm or Yarn
- Expo CLI (optional globally) — or use `npx expo` / `npm run` scripts
- A physical device or simulator (Android Studio / Xcode) to run the app

## Install & run

1. Clone the repo and open the project root.

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

