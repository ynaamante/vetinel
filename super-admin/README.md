
  # Super Admin Portal

Super Admin Portal is a comprehensive React application built with Vite and TypeScript for system administration, clinic management, user oversight, and audit trail tracking.

This is a code bundle for Super Admin Portal Design. The original project design is available at https://www.figma.com/design/DKkbO37F1o7c0FoIQ5jFcw/Super-Admin-Portal-Design.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation & Setup

Navigate to the super-admin directory and install dependencies:

```bash
npm i
```

or

```bash
npm install
```

**Super Admin Portal Dependencies:**

**Production Dependencies:**
- `react` (18.3.1) - UI library
- `react-dom` (18.3.1) - React DOM bindings
- `react-router-dom` (v6.30.4) - Client-side routing
- `react-hook-form` (7.48.0) - Form state management
- `axios` (v1.17.0) - HTTP client
- `recharts` (2.10.3) - Charting library
- `zustand` (4.4.0) - State management
- `date-fns` (2.30.0) - Date utilities
- `jspdf` (v2.5.2) - PDF generation
- `lucide-react` (0.292.0) - Icon library
- `cmdk` (v1.1.1) - Command palette component
- `sonner` (v1.2.2) - Toast notifications
- `next-themes` (v0.4.6) - Theme management

**Radix UI Components** (v1.x) - Accessible component library:
- `@radix-ui/react-accordion`
- `@radix-ui/react-alert-dialog`
- `@radix-ui/react-aspect-ratio`
- `@radix-ui/react-avatar`
- `@radix-ui/react-checkbox`
- `@radix-ui/react-context-menu`
- `@radix-ui/react-dialog`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-hover-card`
- `@radix-ui/react-label`
- `@radix-ui/react-menubar`
- `@radix-ui/react-navigation-menu`
- `@radix-ui/react-popover`
- `@radix-ui/react-progress`
- `@radix-ui/react-radio-group`
- `@radix-ui/react-scroll-area`
- `@radix-ui/react-select`
- `@radix-ui/react-separator`
- `@radix-ui/react-slider`
- `@radix-ui/react-slot`
- `@radix-ui/react-switch`
- `@radix-ui/react-tabs`
- `@radix-ui/react-toggle`
- `@radix-ui/react-toggle-group`
- `@radix-ui/react-tooltip`

**Styling & Utilities:**
- `tailwindcss` (3.3.5) - Utility CSS framework
- `tailwind-merge` (2.2.0) - Merge Tailwind classes
- `tw-animate-css` (v1.4.0) - Additional Tailwind animations
- `class-variance-authority` (0.7.0) - Component class variance
- `clsx` (2.0.0) - Conditional className utility
- `postcss` (v8.5.15) - CSS transformation
- `autoprefixer` (10.4.16) - CSS vendor prefixes

**UI Enhancement:**
- `react-day-picker` (v10.0.1) - Date picker
- `embla-carousel-react` (v8.6.0) - Carousel component
- `react-resizable-panels` (v4.11.2) - Resizable panels
- `input-otp` (v1.4.2) - OTP input component
- `vaul` (v1.1.2) - Drawer component

**Development Dependencies:**
- `vite` (v8.0.16) - Build tool and dev server
- `@vitejs/plugin-react` (v5.2.0) - Vite React plugin
- `typescript` (5.2.2) - Type checking
- `eslint` (8.52.0) - Code linting
- ESLint plugins for React and hooks
- `@types/react` (18.3.1) - React type definitions
- `@types/react-dom` (18.3.1) - React DOM type definitions
- `@types/node` (20.10.0) - Node.js type definitions

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
- `package.json`, `vite.config.ts`, `eslint.config.js` — project config and scripts
- `postcss.config.mjs`, `tailwind.config.js` — styling configuration
- `tsconfig.json`, `tsconfig.node.json` — TypeScript configuration
- `pnpm-workspace.yaml` — workspace configuration
- `public/` — static assets served as-is
- `src/` — application source
  - Main components and pages
  - Routing configuration
  - State management (Zustand)
  - API integration (Axios)
  - UI components (Radix UI based)
- `guidelines/` — design and development guidelines
- `default_shadcn_theme.css` — theme styling

## Features

- **Clinic Management** - Manage multiple clinics and their settings
- **User Management** - Create and manage system users
- **Role-Based Access Control** - Define and assign roles and permissions
- **Audit Trail** - Track all system activities and changes
- **Dashboard** - System metrics and overview
- **PDF Export** - Generate reports as PDF
- **Theme Support** - Light and dark theme switching
- **Responsive Design** - Works on desktop and tablet devices

## Configuration Files

- `vite.config.ts` — Vite configuration
- `tailwind.config.js` — Tailwind CSS configuration
- `postcss.config.mjs` — PostCSS configuration
- `tsconfig.json` — TypeScript configuration

## Notes

- This app uses TypeScript for type safety
- Built with Vite for fast development and optimized builds
- Tailwind CSS provides utility-first styling
- Radix UI components ensure accessibility
- Component-based architecture for maintainability

## Troubleshooting

If you encounter issues:

1. Clear cache: `npm run dev -- --force`
2. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
3. Check Node version: `node --version` (should be v16+)
4. Check npm: `npm --version`
  