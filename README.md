# CheatDB

A modern, searchable video game cheat database with anti-cheat tracking. Built with React + Vite, powered by Firebase Firestore with real-time synchronization and admin-only content management.

## Features

- 🔍 **Searchable Database**: Instantly search across hundreds of game cheats
- 🛡️ **Anti-Cheat Detection**: Track which games use EAC, BattlEye, Vanguard, VAC, Ricochet, or no anti-cheat
- ✨ **Real-time Sync**: Changes appear instantly across all connected clients via Firestore listeners
- 🔐 **Admin Controls**: Email/password authentication for content managers to add/remove games and cheats
- 🎮 **Dark Theme UI**: Modern glassmorphism design with smooth animations using Tailwind CSS
- ⚡ **Lightning Fast**: Vite dev server with HMR and optimized production builds

## Tech Stack

- **Frontend**: React 19.2 + Vite 7.2
- **Styling**: Tailwind CSS 3.4
- **Backend**: Firebase (Authentication + Firestore)
- **Icons**: Lucide React
- **Linting**: ESLint 9 with React hooks rules

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens dev server at `http://localhost:5173` with HMR enabled.

### Build

```bash
npm run build
```

Generates optimized production build to `/dist`.

### Preview Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

Runs ESLint on all `.js` and `.jsx` files.

## Project Structure

```
src/
├── App.jsx          # Main app component (all UI in single file)
├── index.css        # Global styles
├── main.jsx         # React entry point
└── assets/          # Static assets
```

## Architecture

CheatDB uses a monolithic component structure in `src/App.jsx` with the following key components:

- **Header**: Search bar, logo, auth controls
- **GameCard**: Grid items displaying game title, anti-cheat badge, cheat count
- **GameDetail**: Modal showing full cheat list and admin form for adding cheats
- **LoginModal**: Admin authentication interface
- **CursorGlow**: Animated visual effect following mouse (performance-optimized with RAF)

### Data Flow

1. Firebase auth listener (`onAuthStateChanged`) manages user state on mount
2. Real-time Firestore query (`onSnapshot`) subscribes to games collection
3. Search filter uses `useMemo` to prevent unnecessary re-renders
4. Admin actions (add/delete cheats) use `updateDoc`/`deleteDoc` with proper auth gating

### Firestore Schema

```
artifacts/
  cheatdb-games-v2/
    public/
      data/
        games/
          {gameId}
            - title: string
            - antiCheat: string (EAC|BattlEye|Vanguard|VAC|Ricochet|None)
            - cheats: array of { code, effect, notes?, addedAt }
```

## Admin Setup

1. Create a Firebase project and enable Firestore + Authentication
2. Add the Firebase config to `src/App.jsx` (currently hardcoded)
3. Create admin users in Firebase Console → Authentication → Users (email/password)
4. Set Firestore security rules to allow reads from `artifacts/{appId}/public/data/games/*`

## Debugging

- **Auth issues**: Check Firebase Console → Authentication → Users
- **Firestore sync fails**: Verify security rules allow read/write access
- **Blank grid**: Ensure Firestore query is ordered by `title` ascending
- **Performance**: Profile cursor glow effect in DevTools if laggy
