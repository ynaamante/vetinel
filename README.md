# VENTINEL-POWPOW

This workspace contains three separate apps:

- [admin](admin) - the VetIntel admin portal built with Vite + React
- [petwatch-rn](petwatch-rn) - the PetWatch mobile app built with Expo + React Native
- [Super_Admin_Portal_Design](Super_Admin_Portal_Design) - a Vite-based super admin portal design bundle

## Clone the repository

```bash
git clone https://github.com/ynaamante/vetinel
cd vetinel
```

If you already have the repo locally, just open the root folder in VS Code.

## Install dependencies

Each folder is an independent project, so install dependencies inside the folder you want to run.

### Admin portal

```bash
cd admin
npm install
```

### PetWatch mobile app

```bash
cd petwatch-rn
npm install
```

### Super Admin Portal Design

```bash
cd Super_Admin_Portal_Design
npm install
```

## Run each folder

Open a separate terminal for each app if you want to run more than one at the same time.

### `admin`

```bash
cd admin
npm run dev
```

Optional checks:

```bash
npm run build
npm run lint
npm run type-check
```

### `petwatch-rn`

```bash
cd petwatch-rn
npm start
```

You can also run platform targets directly:

```bash
npm run android
npm run ios
```

### `Super_Admin_Portal_Design`

```bash
cd Super_Admin_Portal_Design
npm run dev
```

Optional checks:

```bash
npm run build
npm run lint
npm run type-check
```

## Folder summary

- [admin](admin) contains the web admin interface and supporting pages, components, and styles.
- [petwatch-rn](petwatch-rn) contains the React Native app, navigation, screens, and theme files.
- [Super_Admin_Portal_Design](Super_Admin_Portal_Design) contains the super admin portal UI bundle and shared design system assets.

## Notes

- Do not commit generated folders such as `node_modules`, `dist`, `build`, `.expo`, Android build output, or iOS Pods.
- If dependency installation fails, retry from the app folder you are working in so the lockfile and package manager state stay local to that project.
#      
