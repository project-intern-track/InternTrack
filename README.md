# InternTrack

A comprehensive internship management and tracking system built with React, TypeScript, and Vite.

## Overview

InternTrack is a role-based web application designed to streamline internship program management. It provides separate dashboards and features for students, supervisors, and administrators to track progress, manage tasks, monitor attendance, and evaluate performance.

## Features

### Student Features
- **Dashboard**: Overview of internship progress and announcements
- **Daily Logs**: Record daily activities and reflections
- **Schedule**: View assigned tasks and timeline
- **Announcements**: Stay informed about program updates
- **Reports**: Track performance metrics and progress
- **Settings**: Manage personal profile and preferences

### Supervisor Features
- **Dashboard**: Manage assigned interns and monitor progress
- **Manage Interns**: View and organize intern information
- **Manage Tasks**: Assign and track task completion
- **Monitor Attendance**: Monitor intern attendance and engagement
- **Approvals**: Review and approve intern submissions
- **Evaluations**: Conduct performance evaluations
- **Feedback**: Provide constructive feedback to interns
- **Performance**: Review performance metrics and analytics
- **Reports**: Generate comprehensive reports
- **Announcements**: Communicate with interns

### Admin Features
- **Dashboard**: System overview and management
- **Manage Interns**: Administer all interns in the system
- **Manage Tasks**: Create and manage global tasks
- **Monitor Attendance**: System-wide attendance tracking
- **Announcements**: Broadcast announcements to all users
- **Reports**: Generate system-wide reports
- **Settings**: Configure system settings and policies

## Tech Stack

- **Frontend**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS
- **Backend/Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Linting**: ESLint

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── layout/         # Layout components (Sidebar, TopBar)
├── context/            # React Context (Authentication)
├── layouts/            # Page layouts
├── lib/                # Utility libraries (Supabase config)
├── pages/              # Page components
│   ├── admin/          # Admin dashboard pages
│   ├── public/         # Authentication pages
│   ├── student/        # Student dashboard pages
│   └── supervisor/     # Supervisor dashboard pages
├── services/           # API service modules
├── styles/             # Global and scoped styles
└── types/              # TypeScript type definitions
```

## Getting Started

### Prerequisites
- Node.js 16+ and npm/yarn
- Supabase account and project

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd InternTrack
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file and add Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Database Setup

Database migrations are stored in `supabase/migrations/`. The schema includes:
- User management with role-based access
- Task management and tracking
- Attendance records
- Evaluations and feedback
- Announcements system

## Authentication

InternTrack uses Supabase Authentication with role-based access control (RBAC). Users are assigned roles (student, supervisor, admin) which determine their dashboard and available features.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
