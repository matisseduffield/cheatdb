# CheatDB Copilot Instructions

## Project Overview
CheatDB is a React + Vite web application that provides a searchable, Firebase-backed database of video game cheats with anti-cheat information. It features admin-only content management, real-time Firestore synchronization, voting/rating system, and a modern dark-theme UI with Tailwind CSS and extensive visual effects.

## Architecture & Data Flow

### Firebase Integration
- **Config**: Embedded in `src/App.jsx` at the top of the file (production credentials)
- **Database**: Firestore with nested structure: `artifacts/{appId}/public/data/games/{gameId}`
- **Auth**: Firebase Authentication (email/password only)
- **Real-time Updates**: `onSnapshot` listeners auto-update UI when Firestore data changes
- **App ID**: Dynamically resolved from `__app_id` global or defaults to `'cheatdb-games-v2'`
- **Transaction Support**: Uses `runTransaction` for atomic updates on cheats (voting, editing, deletion)

### Component Hierarchy
1. **Main App** (`src/App.jsx`): 
   - Manages auth, games list, search, modal states, edit mode, voting tracking
   - Sets up: auth listener (`onAuthStateChanged`), real-time Firestore query (`onSnapshot`), keyboard shortcuts
   - Stores user votes locally in `localStorage` (key: `cheatdb_votes`)
   
2. **Header**: Search bar with quick filter pills, logo, auth buttons, admin badge
3. **GameCard**: Grid item with logo, anti-cheat badge, cheat count; hover shows FREE/PAID breakdown; delete button in edit mode
4. **GameDetail**: Modal with tier filter tabs, cheat cards with voting, edit/delete controls; admin-only add form
5. **LoginModal**: Email/password form with error handling and shake animation
6. **Visual Effects**: CursorGlow, BlobBackground (mouse-reactive), AnimatedBackgroundMesh, ShootingStars, FallingStars
7. **CommandPalette**: Keyboard-driven search (Ctrl+K) combining commands and games

### Anti-Cheat Badge System
Enum-based styling in `AntiCheatBadge` component supports: EAC, BattlEye, Vanguard, VAC, Ricochet, None. Each has distinct color scheme, shadow effects, and hover interactions.

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
- **useMemo** for filtering: `filteredGames` uses `useMemo` with `[games, searchTerm]` deps; filters by title, nicknames, antiCheat
- **Modal state**: Multiple independent boolean/ID states (`showLogin`, `selectedGameId`, `isEditMode`, `showCommandPalette`)
- **Local voting tracking**: `userVotes` state + `localStorage` for persistence; key format: `{gameId}_{cheatId}`
- **Infinite scroll**: `displayedGames` tracks rendered count; incremented by 20 on "Load More" click

### Authentication Flow
1. Auth listener fires on mount → sets `user` state (null if logged out)
2. Login form calls `signInWithEmailAndPassword` → Firebase auto-updates auth state → listener fires
3. Logout explicitly calls `signOut` AND resets `isEditMode` flag
4. Admin badge shows in header when `user` is logged in; displays truncated UID

### Admin Content Editing
- Edit mode toggle (`isEditMode`) appears only when `user` is not null; styled differently when active
- Delete button visible only when `user && isEditMode` (double-gating); includes confirmation dialog
- Add cheat form in GameDetail modal only renders when `user` is logged in
- All write operations (`deleteDoc`, `updateDoc`, `runTransaction`) use admin-gated logic
- Edit/Delete buttons on cheats are disabled (`disabled: !cheat.id`) during migration when cheat lacks UUID

### Cheat Data Structure & Migrations
- **Schema**: `{ id, name, productLink, features[], notes, tier, type, votes, addedAt }`
- **Tiers**: FREE or PAID (displayed with distinct colors: emerald for FREE, amber for PAID)
- **Type**: INTERNAL or EXTERNAL (blue and purple badges)
- **Features array**: Pulled from `['Aimbot', 'ESP', 'Exploits', 'Configs', 'Misc']`
- **Voting**: Each cheat has `votes` count; tracked per-user in `localStorage` to prevent duplicate votes
- **Auto-migration**: GameDetail auto-detects cheats missing `id` field and adds `crypto.randomUUID()` on first load

### Firestore Operations
- **Reads**: Real-time `onSnapshot` query ordered by title ascending with `orderBy('title', 'asc')`
- **Writes**: Use atomic `runTransaction` for cheat operations (voting, editing, deletion) to prevent race conditions
  - Add cheat: `updateDoc` with `arrayUnion` + auto-generated `id: crypto.randomUUID()`, `addedAt: Date.now()`
  - Update cheat: Transaction finds cheat by `id`, updates specific array element
  - Delete cheat: Transaction filters out cheat by `id`
  - Vote: Transaction finds cheat, increments/decrements `votes` field
- **Error handling**: Try/catch wraps write operations; errors logged to console + shown in UI alerts; missing IDs trigger migration warning

### Styling Patterns
- **Tailwind-first**: No custom CSS files used; all styling in className attributes; `/src/index.css` only imports Tailwind directives
- **Dark theme**: Base `bg-[#050505]` with zinc/violet/pink accent colors throughout
- **Glass morphism**: Heavy use of `backdrop-blur-xl`, `bg-black/40` patterns in modals and cards
- **Animations**: Custom @keyframes injected via inline `<style>` tags for complex effects (shooting stars, falling stars, confetti)
- **Hover states**: Extensive hover effects: scale, color gradients, border transitions, shadow transitions
- **Responsive grid**: GameCard grid uses `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` for responsive layout

### Keyboard Shortcuts & Command Palette
- **Esc**: Close any open modal (selectedGameId, showLogin, showShortcuts, showCommandPalette)
- **?**: Open keyboard shortcuts modal (only if no other modal is open)
- **Ctrl+K (or Cmd+K on Mac)**: Open command palette with game search + admin commands
- **Command Palette** combines: commands (Login/Logout, Show Shortcuts) + filtered game results; arrow keys navigate, Enter selects

### Visual Effects (All in Single File)
- **CursorGlow**: Custom cursor + rippling bubble effect; hides system cursor with `cursor: none`; reactive to hovering clickable elements
- **BlobBackground**: Mouse-interactive cyan/pink blobs with ripple effects on close approach; morphing shapes with animations
- **AnimatedBackgroundMesh**: 3 orbiting gradient orbs; mouse-reactive position tweening (0.05x multiplier for smoothness)
- **ShootingStars**: Portal-based animation; stars spawn from screen edges; CSS variables for trajectory calculation
- **FallingStars**: 100 particles using CSS animations; staggered delays for natural rain effect; uses portal to document.body
- **Confetti**: Created on successful cheat add; 30 particles with angle/velocity calculation; destroyed after 1.2s

### Icon Library
Uses `lucide-react` v0.555.0 for all icons (Search, Lock, Gamepad2, Plus, X, Copy, ChevronRight, Trash2, Pencil, Check, etc.)

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
4. Verify cheats have `id` field; if missing, migration warning appears in console

### Debugging Visual Effects
- **Cursor glow lag**: Profile CursorGlow in DevTools; uses RAF for position updates but blob animations may cause jank
- **Shooting stars not appearing**: Check z-index stack; ShootingStars uses z-index 1, should be visible above FallingStars
- **Modal backdrop not interactive**: Verify `pointer-events-none` on decorative layers; actual backdrop should have `onClick={onClose}`

### Common Issues
- **Blank grid after login**: Check if Firestore query is ordered correctly (orderBy `title`); verify appId resolution
- **Cheats not appearing**: Verify `arrayUnion` syntax; ensure cheat object matches schema (must include `id`, `name`, `productLink`)
- **Edit button disabled during migration**: Cheat is missing `id` field; auto-migration runs on GameDetail mount, wait briefly and retry
- **Vote button unresponsive**: Ensure `user` is logged in for transaction operations; check Firestore write permissions
- **Command Palette empty**: Verify games array is loaded; check filteredGames derivation in useMemo

### Performance Optimization Notes
- **Vite config**: Firebase and Lucide split into separate chunks (`vite.config.js` rollupOptions)
- **Firestore queries**: Uses `orderBy('title', 'asc')` with potential for pagination (add `limit(50)` + `startAfter` for 1000+ games)
- **LocalStorage voting**: Prevents double-voting client-side; persistent across sessions
- **useMemo dependencies**: Filtering recalculates only when `games` or `searchTerm` changes; verify deps list in custom hooks
- **Portal usage**: ShootingStars and FallingStars use `createPortal` to avoid SVG/canvas overhead; renders DOM nodes instead

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
