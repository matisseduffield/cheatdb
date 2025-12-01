# CheatDB Copilot Instructions

## Project Overview
CheatDB is a React + Vite web application that provides a searchable, Firebase-backed database of video game cheats with anti-cheat information. It features admin-only content management, real-time Firestore synchronization, and a modern dark-theme UI with Tailwind CSS.

## Architecture & Data Flow

### Firebase Integration
- **Config**: Embedded in `src/App.jsx` at the top of the file (production credentials)
- **Database**: Firestore with nested structure: `artifacts/{appId}/public/data/games/{gameId}`
- **Auth**: Firebase Authentication (email/password only)
- **Real-time Updates**: `onSnapshot` listeners auto-update UI when Firestore data changes
- **App ID**: Dynamically resolved from `__app_id` global or defaults to `'cheatdb-games-v2'`

### Component Hierarchy
1. **Main App** (`src/App.jsx`): 
   - Manages auth state, game list, search filter, modal states
   - Sets up auth listener (`onAuthStateChanged`) and real-time Firestore query (`onSnapshot`)
   
2. **Header**: Search bar, logo, auth buttons (Login/Logout), admin badge display
3. **GameCard**: Grid item displaying game title, anti-cheat badge, cheat count; click opens detail modal; delete button appears only in edit mode
4. **GameDetail**: Modal showing all cheats for a game; admin-only form to add new cheats
5. **LoginModal**: Admin credentials form; credential errors handled gracefully
6. **CursorGlow**: Visual effect following mouse position (performance-optimized with `requestAnimationFrame`)

### Anti-Cheat Badge System
Enum-based styling in `AntiCheatBadge` component supports: EAC, BattlEye, Vanguard, VAC, Ricochet, None. Each has distinct color scheme and shadow effects.

## Developer Workflows

### Build & Run
```powershell
npm run dev      # Start dev server with HMR (http://localhost:5173)
npm run build    # Production build to /dist
npm run preview  # Preview production build locally
npm run lint     # Run ESLint on all .js/.jsx files
```

### Firebase Credentials
- Config is **hardcoded** in `src/App.jsx` (not ideal for production)
- Only email/password auth enabled
- Admin users need manual Firebase Console setup: create user in Authentication → Users

### Firestore Schema
```
artifacts/
  cheatdb-games-v2/
    public/
      data/
        games/
          {gameId}
            - title: string
            - antiCheat: string (enum: EAC|BattlEye|Vanguard|VAC|Ricochet|None)
            - cheats: array of { code, effect, notes?, addedAt }
```

## Code Patterns & Conventions

### State Management
- **useEffect** cleanup: Always return unsubscribe from `onAuthStateChanged` and `onSnapshot` to prevent memory leaks
- **useMemo** for filtering: Search filter uses `useMemo` to prevent re-filtering on every render
- **Modal state**: Three separate boolean states (`showLogin`, `selectedGame`, `isEditMode`) - can be consolidated if needed

### Authentication Flow
1. Auth listener fires on mount → sets `user` state (null if logged out)
2. Login form calls `signInWithEmailAndPassword` → Firebase auto-updates auth state → listener fires
3. Logout explicitly calls `signOut` AND resets `isEditMode` flag

### Admin Content Editing
- Edit mode toggle button appears only when `user` is not null
- Delete button visible only when `user && isEditMode` (double-gating)
- Add cheat form in GameDetail modal only renders when `user` is logged in
- All write operations (`deleteDoc`, `updateDoc`) use admin-gated logic

### Firestore Operations
- **Reads**: Real-time `onSnapshot` query ordered by title ascending
- **Writes**: 
  - Delete: `deleteDoc(doc(...))`
  - Add cheat: `updateDoc` with `arrayUnion` to append to cheats array
  - Timestamp: `serverTimestamp()` available but currently using `Date.now()` client-side
- **Error handling**: Try/catch wraps write operations; errors logged to console or shown in UI alerts

### Styling Patterns
- **Tailwind-first**: No custom CSS files used; all styling in className attributes
- **Dark theme**: Base `bg-[#050505]` with zinc/violet accent colors
- **Glass morphism**: Heavy use of `backdrop-blur-xl`, `bg-black/40` patterns
- **Animations**: Tailwind's `animate-in`, `slide-in-from-*`, `fade-in` with staggered delay via inline `animationDelay`
- **Hover states**: Extensive hover effects for interactive elements (scale, color, border transitions)

### Icon Library
Uses `lucide-react` for all icons (Search, Lock, Gamepad2, Plus, X, Copy, ChevronRight, etc.). Icons are highly thematic.

## Integration Points & Dependencies

### External APIs
- **Firebase**: Auth, Firestore (no REST API calls; uses SDK)
- **lucide-react**: Icon set (v0.555.0)
- **React**: v19.2.0 (latest, no hooks-related issues expected)
- **Vite**: Plugin uses Babel fast refresh

### Build Config
- ESLint: Strict react-hooks, react-refresh rules
- Tailwind: Basic config; no custom theme (uses default extend)
- PostCSS: Autoprefixer for browser compatibility
- No TypeScript (JavaScript project; `.jsx` files only)

## Testing & Debugging

### Debugging Auth Issues
1. Check Firebase Console → Authentication → Users (ensure admin user exists)
2. Open DevTools → Network → check Firebase auth requests for 401/403
3. Check console for Firestore permission errors (security rules)

### Debugging Firestore Sync
1. Add `console.log` in `onSnapshot` callback to trace real-time updates
2. Verify Firestore rule: read access to `artifacts/{appId}/public/data/games/*`
3. Check `doc(db, 'artifacts', appId, ...)` path construction (appId resolution critical)

### Common Issues
- **Blank grid after login**: Check if Firestore query is ordered correctly (orderBy `title`)
- **Cheats not appearing**: Verify `arrayUnion` syntax; ensure cheat object matches schema
- **Edit button not showing**: User state may be null; check auth listener setup
- **Performance lag**: Cursor glow effect uses RAF but may still cause jank; profile in DevTools

## File Conventions
- Single file component structure: `src/App.jsx` contains all UI components
- Modular organization within file: Auth setup → Components → Main App
- No separate styling files; Tailwind handles all presentation
- No external component library (all custom-built)

## Notes for AI Agents
- **Before refactoring**: Understand the tight coupling between Firestore schema and component expectations (especially cheats array structure)
- **When adding features**: Maintain the Firebase listener pattern for real-time sync; avoid polling
- **When fixing bugs**: Check both client-side state AND Firestore security rules (common culprit)
- **Style consistency**: Use existing Tailwind patterns (zinc/violet colors, glass morphism effects) rather than introducing new design systems
