# VetIntel Admin Portal

VetIntel Admin Portal is a single-page React application (Vite) for veterinary clinic analytics and operations.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation & Setup

Navigate to the admin directory and install dependencies:

```bash
cd admin
npm install
```

**Admin Portal Dependencies:**

**Production Dependencies:**
- `react` (18.3.1) - UI library
- `react-dom` (18.3.1) - React DOM bindings
- `react-router-dom` (v6.30.4) - Client-side routing
- `axios` (v1.17.0) - HTTP client
- `recharts` (2.10.3) - Charting library
- `zustand` (4.4.0) - State management
- `date-fns` (2.30.0) - Date utilities
- `clsx` (2.0.0) - Utility for className management

**Development Dependencies:**
- `vite` (v8.0.16) - Build tool and dev server
- `@vitejs/plugin-react` (v5.2.0) - Vite React plugin
- `tailwindcss` (3.3.5) - Utility CSS framework
- `postcss` (v8.5.15) - CSS transformation
- `autoprefixer` (10.4.16) - CSS vendor prefixes
- `@tailwindcss/forms` (0.5.6) - Form styles for Tailwind
- `@tailwindcss/typography` (0.5.10) - Typography styles for Tailwind
- `typescript` (5.2.2) - Type checking
- `eslint` (8.52.0) - Code linting
- ESLint plugins for React and hooks

## Running the Application

### Development Server

```bash
npm run dev
```

The application will run on `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Output will be generated in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Project Structure

- `index.html` — app entry HTML
- `package.json`, `vite.config.js`, `eslint.config.js` — project config and scripts
- `postcss.config.mjs`, `tailwind.config.js` — styling configuration
- `tsconfig.json` — TypeScript configuration
- `public/` — static assets served as-is
- `src/` — application source
	- `main.jsx` — React app bootstrap
	- `App.jsx`, `App.css` — top-level app component and styles
	- `index.css`, `global.css` — global styles
	- `assets/` — images and static media
	- `components/` — reusable UI components
		- `Sidebar.jsx`, `Topbar.jsx` — layout components
		- `alerts/AlertItem.jsx` — alert list item
	- `data/` — mock/test data (e.g., `mockData.js`)
	- `icons/` — shared icon components
	- `pages/` — route pages and feature views
		- `DashboardPage.jsx`, `ClinicOverviewPage.jsx`, `ReportsPage.jsx`, etc.
		- `clinic/ClinicLayout.jsx` — clinic-specific layout
		- `receptionist/` — receptionist area pages (appointments, billing, clients)
	- `styles/` — additional CSS modules

## Notes

- This repo uses Vite + React for fast dev iteration and HMR (Hot Module Replacement)
- Follow React + Vite conventions for adding new pages and components under `src/pages` and `src/components`
- Tailwind CSS is configured for utility-first styling
- TypeScript is configured for type safety

## Where to Look First

- App bootstrap: `src/main.jsx`
- Routes & pages: `src/pages/`
- Shared UI: `src/components/`
- Configuration: `vite.config.js`, `tailwind.config.js`

If you want, I can add running instructions to `package.json` scripts or document contributor guidelines next.
