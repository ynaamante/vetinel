# VetIntel

VetIntel is a single-page React application (Vite) for veterinary clinic analytics and operations.

Quick start
- Install: `npm install`
- Dev server: `npm run dev`
- Build: `npm run build`

Project structure

- `index.html` — app entry HTML
- `package.json`, `vite.config.js`, `eslint.config.js` — project config and scripts
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

- `styles/` — additional CSS modules (e.g., `global.css`)

Notes
- This repo uses Vite + React for fast dev iteration and HMR.
- Follow React + Vite conventions for adding new pages and components under `src/pages` and `src/components`.

Where to look first
- App bootstrap: `src/main.jsx`
- Routes & pages: `src/pages/`
- Shared UI: `src/components/`

If you want, I can add running instructions to `package.json` scripts or document contributor guidelines next.
