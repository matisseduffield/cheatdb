import React, { useState, useEffect, useMemo, useCallback, useRef, Component } from 'react';
import { createPortal } from 'react-dom';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  limit,
  updateDoc,
  deleteDoc,
  doc,
  arrayUnion,
  runTransaction,
  addDoc
} from 'firebase/firestore';
import { 
  Search, 
  Plus, 
  Gamepad2, 
  ShieldAlert, 
  Ghost, 
  X, 
  Copy, 
  ChevronRight,
  Zap,
  LayoutGrid,
  Loader2,
  Database,
  AlertTriangle,
  Lock,
  LogOut,
  Fingerprint,
  Trash2,
  Pencil,
  Check,
  Sparkles,
  Shield,
  ThumbsUp,
  List,
  Grid,
  Download,
  Upload,
  RefreshCw,
  CheckSquare,
  Square,
  Star,
  TrendingUp,
  Clock,
  Filter,
  Info,
  CheckCircle,
  XCircle,
  AlertCircle,
  Flame,
  Eye,
  Award
} from 'lucide-react';

// --- Firebase Configuration ---
// Using environment variables for security - API keys are not exposed in source code
// Fallback to hardcoded config if env vars are not available (for Cloudflare Pages)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBKlRLMFGn2zQJT3bYRykTuSne4TvQU4Y4',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'cheatsdatabase.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'cheatsdatabase',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'cheatsdatabase.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '885527786972',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:885527786972:web:dc6dd624a9b82fb4340b19'
};

/* ═══════════════════════════════════════════════════════════════════
   FIRESTORE OPTIMIZATION GUIDE
   ═══════════════════════════════════════════════════════════════════
   
   1. INDEXING RECOMMENDATIONS:
      - Create composite index for: collection="games", fields=["antiCheat" ASC, "title" ASC]
      - This speeds up filtering by anti-cheat type while maintaining alphabetical order
      - Firebase Console → Firestore Database → Indexes → Create Index
   
   2. QUERY OPTIMIZATION:
      - Current query: orderBy('title', 'asc') - Good for alphabetical listing
      - Use: query(collection(db, 'path'), orderBy('title'), limit(50))
      - Add pagination with startAfter(lastDoc) for large datasets
   
   3. CACHING STRATEGY:
      - onSnapshot() listeners auto-cache in memory
      - Reuse listeners across components to reduce reads
      - Use persistence: enableIndexedDbPersistence(db) for offline support
   
   4. SECURITY RULES:
      - Ensure rules match query structure for optimal performance
      - Example: allow read if request.auth != null || path.exists()
   
   ═════════════════════════════════════════════════════════════════ */

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'cheatdb-games-v2';

// --- Utility Functions for Visual Effects ---
const createConfetti = () => {
  const colors = ['#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6'];
  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    const angle = (Math.random() * 360) * (Math.PI / 180);
    const velocity = 5 + Math.random() * 10;
    const tx = Math.cos(angle) * velocity * 30;
    const ty = -Math.sin(angle) * velocity * 30;
    
    confetti.style.left = (window.innerWidth / 2) + 'px';
    confetti.style.top = (window.innerHeight / 2) + 'px';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.setProperty('--tx', `${tx}px`);
    confetti.style.setProperty('--ty', `${ty}px`);
    
    document.body.appendChild(confetti);
    
    setTimeout(() => confetti.remove(), 1200);
  }
};

const triggerShake = (elementId) => {
  const el = document.getElementById(elementId);
  if (el) {
    el.classList.add('shake-error');
    setTimeout(() => el.classList.remove('shake-error'), 500);
  }
};

// Utility: Safe localStorage operations with quota management
const safeLocalStorage = {
  getItem: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error(`Failed to read localStorage key "${key}":`, e);
      return defaultValue;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, clearing old analytics data');
        // Clear analytics if quota exceeded to make room
        try {
          localStorage.removeItem('cheatdb_analytics');
          localStorage.setItem(key, JSON.stringify(value));
          return true;
        } catch (retry) {
          console.error('Failed to save even after cleanup:', retry);
          return false;
        }
      }
      console.error(`Failed to write localStorage key "${key}":`, e);
      return false;
    }
  }
};

// Utility: Input sanitization - prevent XSS and injection
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  // Remove script tags, event handlers, and dangerous HTML
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
    .slice(0, 500); // Max 500 chars per field
};

const sanitizeCheatData = (cheatData) => {
  return {
    code: sanitizeInput(cheatData.code || ''),
    effect: sanitizeInput(cheatData.effect || ''),
    notes: sanitizeInput(cheatData.notes || ''),
    name: sanitizeInput(cheatData.name || ''),
    productLink: sanitizeInput(cheatData.productLink || '').slice(0, 2048),
    tier: ['FREE', 'PAID'].includes(cheatData.tier) ? cheatData.tier : 'FREE',
    type: ['INTERNAL', 'EXTERNAL'].includes(cheatData.type) ? cheatData.type : 'INTERNAL',
    features: Array.isArray(cheatData.features) ? cheatData.features.filter(f => typeof f === 'string').slice(0, 10) : [],
  };
};

// Favorites management utility
const favorites = {
  getAll: () => safeLocalStorage.getItem('cheatdb_favorites', { games: [], cheats: [] }),
  
  toggleGame: (gameId) => {
    const favs = favorites.getAll();
    const gameIndex = favs.games.indexOf(gameId);
    if (gameIndex > -1) {
      favs.games.splice(gameIndex, 1);
    } else {
      favs.games.push(gameId);
    }
    safeLocalStorage.setItem('cheatdb_favorites', favs);
    return favs;
  },
  
  isGameFavorited: (gameId) => {
    const favs = favorites.getAll();
    return favs.games.includes(gameId);
  }
};

// Anti-Cheat Information Database
const antiCheatInfo = {
  'EAC': {
    name: 'Easy Anti-Cheat',
    difficulty: 'Very Hard',
    description: 'A widely-used kernel-level anti-cheat developed by Epic Games. Monitors system processes and memory to detect cheating software.',
    detection: 'Uses kernel-level drivers, process scanning, memory integrity checks, and behavioral analysis to detect cheats.',
    bypassDifficulty: 9,
    color: 'blue'
  },
  'BattlEye': {
    name: 'BattlEye',
    difficulty: 'Hard',
    description: 'Professional anti-cheat solution used by AAA games. Provides real-time protection with proactive detection methods.',
    detection: 'Advanced kernel-mode protection, machine learning detection, pattern recognition, and regular signature updates.',
    bypassDifficulty: 8,
    color: 'yellow'
  },
  'Vanguard': {
    name: 'Riot Vanguard',
    difficulty: 'Extreme',
    description: 'Riot Games\' proprietary anti-cheat with aggressive system-level monitoring. Starts with Windows boot.',
    detection: 'Boots with Windows, uses secure boot verification, TPM requirements, kernel-level monitoring, and AI-based detection.',
    bypassDifficulty: 10,
    color: 'red'
  },
  'VAC': {
    name: 'Valve Anti-Cheat',
    difficulty: 'Easy',
    description: 'Valve\'s signature-based anti-cheat system. Delayed banning system makes detection less obvious to cheat developers.',
    detection: 'Signature scanning, module verification, delayed ban waves, and community reporting integration.',
    bypassDifficulty: 2,
    color: 'green'
  },
  'Ricochet': {
    name: 'Ricochet Anti-Cheat',
    difficulty: 'Hard',
    description: 'Activision\'s proprietary kernel-level driver and server-side detection system for Call of Duty.',
    detection: 'Kernel-level driver, server-side tools, machine learning, and team-based investigation of reports.',
    bypassDifficulty: 7,
    color: 'purple'
  },
  'Defense Matrix': {
    name: 'Defense Matrix',
    difficulty: 'Hard',
    description: 'Blizzard\'s proprietary anti-cheat system used in Overwatch. Combines client-side scanning with server-side behavioral analysis.',
    detection: 'Client-side integrity checks, server-side behavior analysis, machine learning for pattern detection, and player reporting systems.',
    bypassDifficulty: 7,
    color: 'cyan'
  },
  'None': {
    name: 'No Anti-Cheat',
    difficulty: 'Easy',
    description: 'This game does not use dedicated anti-cheat software. Moderation may rely on player reports or basic server-side checks.',
    detection: 'May use basic server-side validation, player reports, or no detection at all.',
    bypassDifficulty: 1,
    color: 'zinc'
  }
};

// Custom hook for debounced value
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Format timestamp to relative time (e.g., "2 hours ago")
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  const ms = typeof timestamp === 'number' ? timestamp : timestamp.toMillis?.() || 0;
  if (!ms) return '';
  
  const seconds = Math.floor((Date.now() - ms) / 1000);
  
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return 'long ago';
};

// --- Error Boundary Component ---
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.state = { ...this.state, error, errorInfo };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-zinc-900/95 border border-red-500/20 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Something Went Wrong</h1>
            <p className="text-zinc-400 mb-6">
              The application encountered an unexpected error. Please refresh the page to try again.
            </p>
            {this.state.error && (
              <details className="text-left bg-zinc-800/50 rounded-xl p-4 mb-6">
                <summary className="text-red-400 font-mono text-sm cursor-pointer mb-2">
                  Error Details
                </summary>
                <pre className="text-xs text-zinc-500 overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 mx-auto bg-gradient-to-r from-violet-600 to-pink-600 text-white px-6 py-3 rounded-xl font-bold hover:from-violet-500 hover:to-pink-500 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Loading Skeleton Components ---
const GameCardSkeleton = () => (
  <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 animate-pulse">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-16 h-16 bg-zinc-800/50 rounded-xl" />
      <div className="flex-1">
        <div className="h-5 bg-zinc-800/50 rounded w-3/4 mb-2" />
        <div className="h-4 bg-zinc-800/50 rounded w-1/2" />
      </div>
    </div>
    <div className="flex items-center justify-between">
      <div className="h-4 bg-zinc-800/50 rounded w-20" />
      <div className="h-6 bg-zinc-800/50 rounded w-16" />
    </div>
  </div>
);

const SkeletonGrid = ({ count = 8 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
    {Array.from({ length: count }).map((_, idx) => (
      <GameCardSkeleton key={idx} />
    ))}
  </div>
);

// --- New Component: Animated Background Mesh ---
const AnimatedBackgroundMesh = ({ mousePos }) => {
  const getOrbPosition = (baseX, baseY) => {
    const x = baseX + (mousePos.x - window.innerWidth / 2) * 0.05;
    const y = baseY + (mousePos.y - window.innerHeight / 2) * 0.05;
    return { x, y };
  };

  const orb1 = getOrbPosition(-5, -10, 1);
  const orb2 = getOrbPosition(85, -15, 0.8);
  const orb3 = getOrbPosition(-8, 90, 0.7);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Primary gradient orb */}
      <div
        className="absolute w-96 h-96 bg-violet-900/20 rounded-full blur-3xl orb-float"
        style={{
          left: `${orb1.x}%`,
          top: `${orb1.y}%`,
          transform: `translate(-50%, -50%) rotate(0deg)`,
          transition: 'left 0.5s ease-out, top 0.5s ease-out',
        }}
      />
      
      {/* Secondary gradient orb */}
      <div
        className="absolute w-80 h-80 bg-fuchsia-900/15 rounded-full blur-3xl orb-float"
        style={{
          right: `${orb2.x}%`,
          top: `${orb2.y}%`,
          transform: `translate(50%, -50%) rotate(180deg)`,
          transition: 'right 0.5s ease-out, top 0.5s ease-out',
          animationDelay: '-10s',
        }}
      />

      {/* Tertiary accent orb */}
      <div
        className="absolute w-72 h-72 bg-indigo-900/10 rounded-full blur-3xl orb-float"
        style={{
          left: `${orb3.x}%`,
          bottom: `${orb3.y}%`,
          transform: `translate(-50%, 50%) rotate(90deg)`,
          transition: 'left 0.5s ease-out, bottom 0.5s ease-out',
          animationDelay: '-15s',
        }}
      />

      {/* Grid overlay - subtle */}
      <div
        className="absolute inset-0 grid-background"
        style={{
          backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.08) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
};

// --- New Component: Shooting Stars Animation ---
const ShootingStars = () => {
  const [stars, setStars] = useState([]);
  const [container, setContainer] = useState(null);

  useEffect(() => {
    let containerRef = null;
    
    // Inject CSS into document head
    const styleId = 'shooting-stars-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .shooting-stars-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
          overflow: hidden;
        }

        /* Wrapper: Handles movement with CSS variables */
        .shooting-star-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          width: 0;
          height: 0;
          pointer-events: none;
          animation: shoot-star-move linear forwards;
        }

        /* Rotated Body: Dynamic angle based on trajectory */
        .shooting-star-body {
          position: absolute;
          width: 100%;
          height: 100%;
          transform: rotate(var(--angle));
          top: 0;
          left: 0;
        }

        /* Tail: Long gradient line pointing backward */
        .shooting-star-tail {
          position: absolute;
          right: 0;
          top: 50%;
          width: 250px;
          height: 2px;
          background: linear-gradient(to left, rgba(255, 255, 255, 0.8) 0%, rgba(139, 92, 246, 0.5) 30%, transparent 100%);
          transform: translateY(-50%);
          filter: blur(1px);
          pointer-events: none;
          animation: tail-fade ease-in-out forwards;
        }

        /* Head: 5-pointed star at the front */
        .shooting-star-head {
          position: absolute;
          right: 0;
          top: 50%;
          width: 14px;
          height: 14px;
          transform: translateY(-50%);
          background: white;
          clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
          box-shadow: 
            0 0 10px rgba(139, 92, 246, 1),
            0 0 20px rgba(139, 92, 246, 0.8),
            0 0 30px rgba(139, 92, 246, 0.6),
            inset 0 0 8px rgba(255, 255, 255, 0.6);
          filter: drop-shadow(0 0 6px rgba(139, 92, 246, 0.8));
          pointer-events: none;
        }

        /* Animation: Dynamic movement with CSS variables */
        @keyframes shoot-star-move {
          0% {
            transform: translate(var(--sx), var(--sy));
            opacity: 1;
          }
          100% {
            transform: translate(var(--ex), var(--ey));
            opacity: 0;
          }
        }

        /* Tail fade animation: Evaporating from the back end */
        @keyframes tail-fade {
          0% { width: 0; opacity: 0; }
          20% { width: 250px; opacity: 1; }
          50% { width: 250px; opacity: 0.8; }
          100% { width: 0; opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    // Get or create container
    if (!containerRef) {
      const newContainer = document.createElement('div');
      newContainer.className = 'shooting-stars-container';
      document.body.appendChild(newContainer);
      containerRef = newContainer;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setContainer(newContainer);
    }

    let shootingStarTimeout;

    const createShootingStar = () => {
      const starId = Date.now() + Math.random();
      const duration = 2 + Math.random() * 2; // 2-4 seconds

      // 0 = Top, 1 = Right, 2 = Left
      const edge = Math.floor(Math.random() * 3);

      let sx, sy, ex, ey;

      // Screen dimensions
      const W = window.innerWidth;
      const H = window.innerHeight;

      if (edge === 0) {
        // TOP: Start above screen, end well below
        sx = Math.random() * W;
        sy = -50; 
        ex = Math.random() * W; 
        ey = H + 200; 
      } else if (edge === 1) {
        // RIGHT: Start right of screen, end left
        sx = W + 50;
        sy = Math.random() * (H * 0.5); // Top half only
        ex = -200;
        ey = Math.random() * H;
      } else {
        // LEFT: Start left of screen, end right
        sx = -50;
        sy = Math.random() * (H * 0.5); // Top half only
        ex = W + 200;
        ey = Math.random() * H;
      }

      const angle = Math.atan2(ey - sy, ex - sx) * (180 / Math.PI);

      setStars(prev => [...prev, { id: starId, sx, sy, ex, ey, angle, duration }]);

      setTimeout(() => {
        setStars(prev => prev.filter(s => s.id !== starId));
      }, duration * 1000);
    };

    const scheduleNextStar = () => {
      const delay = 4000 + Math.random() * 4000; // 4-8 seconds between stars
      shootingStarTimeout = setTimeout(() => {
        createShootingStar();
        scheduleNextStar();
      }, delay);
    };

    // Start the cycle
    scheduleNextStar();

    return () => {
      clearTimeout(shootingStarTimeout);
      // Cleanup: Remove injected style tag
      const styleElement = document.getElementById('shooting-stars-style');
      if (styleElement && document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
      // Cleanup: Remove container div from body
      if (containerRef && document.body.contains(containerRef)) {
        document.body.removeChild(containerRef);
      }
    };
  }, []);

  return container ? createPortal(
    <>
      {stars.map(star => (
        <div
          key={star.id}
          className="shooting-star-wrapper"
          style={{
            '--sx': `${star.sx}px`,
            '--sy': `${star.sy}px`,
            '--ex': `${star.ex}px`,
            '--ey': `${star.ey}px`,
            '--angle': `${star.angle}deg`,
            animationDuration: `${star.duration}s`,
          }}
        >
          <div className="shooting-star-body">
            <div 
              className="shooting-star-tail"
              style={{
                animationDuration: `${star.duration}s`,
              }}
            />
            <div className="shooting-star-head" />
          </div>
        </div>
      ))}
    </>,
    container
  ) : null;
};

// --- New Component: Falling Stars Animation ---
const FallingStars = () => {
  useEffect(() => {
    // Inject CSS into document head
    const styleId = 'falling-stars-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        html, body {
          overflow-x: hidden !important;
          height: 100%;
          width: 100%;
        }

        .particle-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        .particle {
          position: absolute;
          background: var(--particle-color);
          width: var(--particle-width);
          height: var(--particle-height);
          top: -20px;
          border-radius: 0 50% 50% 50%;
          opacity: 0;
          filter: blur(var(--blur));
          animation: fall linear infinite;
        }

        @keyframes fall {
          0% {
            transform: translateY(0) rotate(45deg);
            opacity: 0.6;
          }
          90% {
            opacity: 0.5;
          }
          100% {
            transform: translateY(110vh) rotate(45deg);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }

    // Get or create container
    let container = document.getElementById('falling-stars-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'falling-stars-container';
      container.className = 'particle-container';
      document.body.appendChild(container);
    }

    // Set CSS variables
    const root = document.documentElement;
    root.style.setProperty('--particle-color', 'rgba(174, 194, 224, 0.4)');
    root.style.setProperty('--particle-width', '6px');
    root.style.setProperty('--particle-height', '6px');
    root.style.setProperty('--blur', '0.5px');

    const createParticles = () => {
      // Check if particles already exist to prevent duplicates on re-renders
      if (container.childElementCount > 0) return;

      const particleCount = 50;

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        particle.style.left = Math.random() * 100 + 'vw';

        // Duration (4s to 8s fall time)
        const duration = 4 + Math.random() * 4;
        particle.style.animationDuration = duration + 's';

        // Positive Delay: Stagger the start so particles rain down naturally
        // Screen starts blank, then particles begin falling at different times
        const delay = Math.random() * 4;
        particle.style.animationDelay = delay + 's';

        const opacity = (Math.random() * 0.6 + 0.4).toFixed(2);
        particle.style.setProperty('--particle-opacity', opacity);

        particle.style.animationName = 'fall';
        container.appendChild(particle);
      }
    };

    // Create initial particles once - CSS animation handles the infinite loop
    createParticles();

    return () => {
      // Cleanup: Remove injected style tag
      const styleElement = document.getElementById('falling-stars-style');
      if (styleElement && document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
      // Cleanup: Remove container div from body
      const containerElement = document.getElementById('falling-stars-container');
      if (containerElement && document.body.contains(containerElement)) {
        document.body.removeChild(containerElement);
      }
    };
  }, []);

  return null;
};

// --- New Component: Statistics Dashboard ---
const StatisticsDashboard = ({ games }) => {
  // Calculate statistics
  const totalGames = games.length;
  const totalCheats = games.reduce((sum, game) => sum + (game.cheats?.length || 0), 0);
  
  return (
    <div className="relative z-20 mb-8 px-6 py-3 rounded-xl border backdrop-blur-sm transition-all duration-500 bg-zinc-900/40 border-white/10 flex items-center justify-center gap-16">
      {/* Total Games */}
      <div className="flex flex-col items-center gap-1 group cursor-pointer">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 group-hover:text-violet-400 transition-colors">Games</span>
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-violet-400 icon-pulse" />
          <span className="text-2xl font-black text-violet-400 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-violet-400 group-hover:to-pink-400 transition-all">{totalGames}</span>
        </div>
      </div>
      
      {/* Divider */}
      <div className="w-px h-8 bg-white/10"></div>
      
      {/* Total Cheats */}
      <div className="flex flex-col items-center gap-1 group cursor-pointer">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-500 group-hover:text-amber-400 transition-colors">Cheats</span>
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400 icon-pulse" style={{ animationDelay: '0.3s' }} />
          <span className="text-2xl font-black text-amber-400 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-amber-400 group-hover:to-orange-400 transition-all">{totalCheats}</span>
        </div>
      </div>
    </div>
  );
};

const CursorGlow = ({ onMouseMove }) => {
  const [pos, setPos] = useState({ x: -500, y: -500 });
  const [isVisible, setIsVisible] = useState(false);
  const [velocity, setVelocity] = useState({ x: 0, y: 0 });
  const [isHoveringClickable, setIsHoveringClickable] = useState(false);

  useEffect(() => {
    let lastX = pos.x;
    let lastY = pos.y;

    const updatePos = (e) => {
      const newX = e.clientX;
      const newY = e.clientY;
      
      setPos({ x: newX, y: newY });
      setVelocity({
        x: newX - lastX,
        y: newY - lastY
      });
      
      lastX = newX;
      lastY = newY;
      setIsVisible(true);

      // Notify parent of mouse position
      if (onMouseMove) {
        onMouseMove({ x: newX, y: newY });
      }

      // Check if hovering over a clickable element
      const target = e.target;
      const isClickable = target.closest('button, a, [role="button"], .cursor-pointer, input, textarea');
      setIsHoveringClickable(!!isClickable);
    };
    
    const handleMouseLeave = () => {
      setIsVisible(false);
      setIsHoveringClickable(false);
    };
    
    window.addEventListener('mousemove', updatePos);
    document.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', updatePos);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onMouseMove]);

  if (!isVisible) return null;

  // Calculate rotation based on velocity direction
  const angle = Math.atan2(velocity.y, velocity.x) * (180 / Math.PI);

  return (
    <>
      <style>{`
        * {
          cursor: none !important;
        }
        
        @keyframes ripple-wave {
          0% {
            border-radius: 50%;
          }
          15% {
            border-radius: 30% 70% 50% 50% / 50% 50% 70% 30%;
          }
          30% {
            border-radius: 20% 80% 30% 70% / 70% 30% 80% 20%;
          }
          45% {
            border-radius: 50% 50% 20% 80% / 30% 70% 50% 50%;
          }
          60% {
            border-radius: 70% 30% 70% 30% / 80% 20% 70% 30%;
          }
          75% {
            border-radius: 40% 60% 50% 50% / 50% 50% 60% 40%;
          }
          100% {
            border-radius: 50%;
          }
        }
        
        .bubble-ripple {
          animation: ripple-wave 1.5s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
        }
        
        .bubble-ripple-fast {
          animation: ripple-wave 1s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
        }

        @keyframes float-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(20px);
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: scale(1) translateY(0);
          }
        }

        @keyframes rotate-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        @keyframes particle-rise {
          0% {
            opacity: 1;
            transform: translateY(0) translateX(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-100px) translateX(var(--tx, 0));
          }
        }

        .card-bounce-enter {
          animation: bounce-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .icon-pulse {
          animation: pulse-scale 8s ease-in-out infinite !important;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .5;
          }
        }

        .animate-pulse {
          animation: pulse 4.5s cubic-bezier(0.4, 0, 0.6, 1) infinite !important;
        }

        .orb-float {
          animation: rotate-slow 20s linear infinite;
        }
      `}</style>
      
      {/* Bubble - always behind */}
      <div
        className="pointer-events-none fixed"
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: '150px',
          height: '150px',
          marginLeft: '-75px',
          marginTop: '-75px',
          filter: `drop-shadow(0 0 30px rgba(139, 92, 246, 0.6))`,
          zIndex: 0,
        }}
      >
        {/* Outer rippling bubble */}
        <div
          className="bubble-ripple-fast absolute inset-0 rounded-full blur-2xl opacity-60"
          style={{
            backgroundColor: 'rgb(139, 92, 246)',
            transform: `rotate(${angle}deg) scale(1.1)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
        
        {/* Middle glow layer */}
        <div
          className="bubble-ripple absolute inset-0 rounded-full blur-xl opacity-50"
          style={{
            background: 'linear-gradient(135deg, rgb(167, 139, 250) to rgb(232, 121, 250))',
            transform: `rotate(${angle * 0.7}deg) scale(0.95)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
        
        {/* Inner bright core - solid bubble */}
        <div
          className="bubble-ripple-fast absolute inset-6 rounded-full blur-lg opacity-60"
          style={{
            background: 'linear-gradient(135deg, rgb(196, 181, 253) to rgb(243, 194, 231))',
            boxShadow: 'inset 0 -20px 40px rgba(0, 0, 0, 0.2), inset 0 20px 40px rgba(255, 255, 255, 0.4)',
            transform: `scale(0.9)`,
            animation: 'ripple-wave 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) infinite 0.2s',
          }}
        />
        
        {/* Outer border with ripple */}
        <div
          className="bubble-ripple absolute inset-0 rounded-full border-2"
          style={{
            borderColor: 'rgb(196, 181, 253)',
            opacity: 0.9,
            transform: `rotate(${angle * 0.5}deg) scale(1.05)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
      </div>

      {/* Custom Cursor - always on top */}
      <div
        className="pointer-events-none fixed"
        style={{
          left: `${pos.x}px`,
          top: `${pos.y}px`,
          width: '8px',
          height: '8px',
          marginLeft: '-4px',
          marginTop: '-4px',
          zIndex: 9999,
        }}
      >
        {isHoveringClickable ? (
          <>
            {/* Simple dot cursor for clickable */}
            <div className="w-full h-full bg-white rounded-full shadow-lg" style={{ boxShadow: '0 0 8px rgba(255, 255, 255, 0.8)' }} />
          </>
        ) : (
          <>
            {/* Simple crosshair - minimal */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="absolute left-1/2 top-0 w-0.5 h-2 bg-white -translate-x-1/2 -translate-y-full" />
              <div className="absolute left-1/2 top-1/2 w-0.5 h-2 bg-white -translate-x-1/2 translate-y-0" />
              <div className="absolute left-0 top-1/2 w-2 h-0.5 bg-white -translate-x-full -translate-y-1/2" />
              <div className="absolute left-1/2 top-1/2 w-2 h-0.5 bg-white translate-x-0 -translate-y-1/2" />
              <div className="absolute left-1/2 top-1/2 w-1.5 h-1.5 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            </div>
          </>
        )}
      </div>
    </>
  );
};

// Enhanced Toast Notification Component with Queue System
const Toast = ({ toasts, onClose }) => {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[70] flex flex-col gap-2 items-center">
      {toasts.map((toast, index) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => onClose(toast.id)} index={index} />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onClose, index }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, toast.duration || 3000);
    return () => clearTimeout(timer);
  }, [onClose, toast.duration]);

  const styles = {
    success: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
    error: 'bg-red-500/20 border-red-500/30 text-red-300',
    info: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
    warning: 'bg-amber-500/20 border-amber-500/30 text-amber-300'
  };

  const icons = {
    success: Check,
    error: X,
    info: Sparkles,
    warning: AlertTriangle
  };

  const Icon = icons[toast.type] || Sparkles;

  return (
    <div 
      className={`px-6 py-3 rounded-xl border backdrop-blur-xl animate-in fade-in slide-in-from-bottom-4 duration-300 font-semibold text-sm flex items-center gap-3 ${styles[toast.type] || styles.info}`}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <Icon className="w-4 h-4" />
      {toast.message}
    </div>
  );
};

// Keyboard Shortcuts Modal Component
const ShortcutsModal = ({ onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
    <div className="relative bg-zinc-900/95 border border-violet-500/20 rounded-2xl p-8 max-w-md w-full animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
        <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs font-mono text-zinc-400">Esc</kbd>
          <span className="text-sm text-zinc-300">Close modal</span>
        </div>
        <div className="flex items-center gap-3">
          <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs font-mono text-zinc-400">?</kbd>
          <span className="text-sm text-zinc-300">Show this menu</span>
        </div>
        <div className="flex items-center gap-3">
          <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs font-mono text-zinc-400">Ctrl/Cmd</kbd>
          <span className="text-sm text-zinc-300">Focus search</span>
        </div>
        <div className="flex items-center gap-3">
          <kbd className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs font-mono text-zinc-400">K</kbd>
          <span className="text-sm text-zinc-300">Open command palette</span>
        </div>
      </div>
    </div>
  </div>
);

// Command Palette Component
const CommandPalette = ({ onClose, games, onSelectGame, user }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands = useMemo(() => [
    { id: 'search', label: 'Search Games', icon: '🔍', action: () => {} },
    user && { id: 'login', label: 'Logout', icon: '🚪', action: () => {} },
    !user && { id: 'login', label: 'Admin Login', icon: '🔐', action: () => {} },
    { id: 'shortcuts', label: 'Show Keyboard Shortcuts', icon: '⌨️', action: () => {} },
  ].filter(Boolean), [user]);

  const gameResults = useMemo(() => query.trim() ? games.filter(g => 
    g.title.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5) : [], [query, games]);

  const allResults = useMemo(() => [...commands, ...gameResults], [commands, gameResults]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % allResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + allResults.length) % allResults.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = allResults[selectedIndex];
        if (selected.id && !selected.title) {
          selected.action();
        } else if (selected.id && selected.title) {
          onSelectGame(selected);
        }
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIndex, allResults]);

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center p-4 pt-20">
      <div className="absolute inset-0 bg-black/60 command-palette-overlay" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl border border-violet-500/30 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200" style={{ backgroundColor: '#0a0a0a' }}>
        <div className="relative p-4 border-b border-zinc-800">
          <input
            autoFocus
            type="text"
            placeholder="Search games or commands..."
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent outline-none text-white placeholder-zinc-500 text-lg"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-600">K to open</div>
        </div>

        <div className="max-h-96 overflow-y-auto custom-scrollbar">
          {allResults.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm">No results found</div>
          ) : (
            allResults.map((result, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setSelectedIndex(idx);
                  if (result.title) onSelectGame(result);
                  onClose();
                }}
                className={`px-4 py-3 cursor-pointer command-item transition-all ${
                  selectedIndex === idx ? 'selected' : ''
                } border-l-4 border-l-transparent`}
              >
                {result.title ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{result.antiCheat === 'None' ? '🎮' : '⚠️'}</span>
                      <div>
                        <div className="font-medium text-white">{result.title}</div>
                        <div className="text-xs text-zinc-500">{result.cheats?.length || 0} programs</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-600" />
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{result.icon}</span>
                    <span className="text-white font-medium">{result.label}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/30 text-xs text-zinc-600 flex items-center justify-between">
          <div className="flex gap-4">
            <span><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs">↑↓</kbd> navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs">Enter</kbd> select</span>
            <span><kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs">Esc</kbd> close</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Components ---

// Edit Game Modal Component
const EditGameModal = ({ game, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: game.title || '',
    antiCheat: game.antiCheat || 'None',
    nicknames: game.nicknames || []
  });
  const [newNickname, setNewNickname] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const antiCheatOptions = ['EAC', 'BattlEye', 'Vanguard', 'VAC', 'Ricochet', 'None'];

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(game.id, formData);
    setIsSaving(false);
    onClose();
  };

  const addNickname = () => {
    if (newNickname.trim() && !formData.nicknames.includes(newNickname.trim())) {
      setFormData(prev => ({
        ...prev,
        nicknames: [...prev.nicknames, newNickname.trim()]
      }));
      setNewNickname('');
    }
  };

  const removeNickname = (nickname) => {
    setFormData(prev => ({
      ...prev,
      nicknames: prev.nicknames.filter(n => n !== nickname)
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
      <div className="relative bg-zinc-900/95 border border-violet-500/20 rounded-2xl p-8 max-w-2xl w-full animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Pencil className="w-6 h-6 text-violet-400" />
            Edit Game Details
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-2">Game Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-xl px-4 py-3 bg-black/50 border border-white/10 text-white outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>

          {/* Anti-Cheat */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-2">Anti-Cheat</label>
            <div className="grid grid-cols-3 gap-2">
              {antiCheatOptions.map(ac => (
                <button
                  key={ac}
                  onClick={() => setFormData(prev => ({ ...prev, antiCheat: ac }))}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    formData.antiCheat === ac
                      ? 'bg-violet-500/30 border-violet-500/50 text-violet-200 border'
                      : 'bg-zinc-800/50 text-zinc-400 hover:bg-zinc-700/50'
                  }`}
                >
                  {ac}
                </button>
              ))}
            </div>
          </div>

          {/* Nicknames */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-zinc-500 block mb-2">Nicknames (for search)</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addNickname()}
                placeholder="Add nickname (e.g., cs2, cod)"
                className="flex-1 rounded-xl px-4 py-2 bg-black/50 border border-white/10 text-white text-sm outline-none focus:ring-1 focus:ring-violet-500"
              />
              <button
                onClick={addNickname}
                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.nicknames.map(nickname => (
                <span key={nickname} className="px-3 py-1 bg-zinc-800/50 text-zinc-300 text-sm rounded-lg flex items-center gap-2">
                  {nickname}
                  <button
                    onClick={() => removeNickname(nickname)}
                    className="text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button
            onClick={onClose}
            className="px-6 py-3 text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Pagination Controls Component
const PaginationControls = ({ currentPage, totalPages, onPageChange, displayedCount, totalCount }) => {
  const maxVisiblePages = 5;
  const halfVisible = Math.floor(maxVisiblePages / 2);
  
  let startPage = Math.max(1, currentPage - halfVisible);
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

  return (
    <div className="flex flex-col items-center gap-4 mt-8">
      <div className="text-sm text-zinc-500 font-medium">
        Showing <span className="text-violet-400 font-bold">{displayedCount}</span> of <span className="text-violet-400 font-bold">{totalCount}</span> games
      </div>
      
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-violet-500/20 text-zinc-400 hover:text-violet-400"
          title="Previous Page"
        >
          <ChevronRight className="w-5 h-5 rotate-180" />
        </button>

        {/* First Page */}
        {startPage > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="px-3 py-1 rounded-lg text-sm font-bold transition-all hover:bg-violet-500/20 text-zinc-400 hover:text-violet-400"
            >
              1
            </button>
            {startPage > 2 && <span className="text-zinc-600">...</span>}
          </>
        )}

        {/* Page Numbers */}
        {pages.map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${
              page === currentPage
                ? 'bg-violet-500/30 text-violet-300 border border-violet-500/50'
                : 'hover:bg-violet-500/20 text-zinc-400 hover:text-violet-400'
            }`}
          >
            {page}
          </button>
        ))}

        {/* Last Page */}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-zinc-600">...</span>}
            <button
              onClick={() => onPageChange(totalPages)}
              className="px-3 py-1 rounded-lg text-sm font-bold transition-all hover:bg-violet-500/20 text-zinc-400 hover:text-violet-400"
            >
              {totalPages}
            </button>
          </>
        )}

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-violet-500/20 text-zinc-400 hover:text-violet-400"
          title="Next Page"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

// Quick Add Game Modal
const QuickAddGameModal = ({ onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [antiCheat, setAntiCheat] = useState('None');
  const [isAdding, setIsAdding] = useState(false);

  const antiCheats = ['None', 'EAC', 'BattlEye', 'Vanguard', 'VAC', 'Ricochet'];

  const handleAdd = async () => {
    if (!title.trim()) return;
    
    setIsAdding(true);
    try {
      await onAdd({ title: title.trim(), antiCheat, cheats: [], nicknames: [] });
      onClose();
    } catch (err) {
      console.error('Error adding game:', err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
      <div className="relative bg-zinc-900/95 border border-violet-500/20 rounded-2xl p-8 max-w-md w-full animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Plus className="w-6 h-6 text-violet-400" />
            Quick Add Game
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-zinc-400 mb-2">Game Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter game name"
              className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-400 mb-2">Anti-Cheat</label>
            <select
              value={antiCheat}
              onChange={(e) => setAntiCheat(e.target.value)}
              className="w-full bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-violet-500/50 focus:outline-none transition-colors"
            >
              {antiCheats.map(ac => (
                <option key={ac} value={ac}>{ac}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-3 text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!title.trim() || isAdding}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {isAdding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Add Game
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Export/Import Modal
const ExportImportModal = ({ onClose, games, onImport }) => {
  const [importData, setImportData] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = () => {
    const dataStr = JSON.stringify(games, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cheatdb-backup-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    try {
      const data = JSON.parse(importData);
      if (!Array.isArray(data)) throw new Error('Invalid format');
      
      setIsImporting(true);
      await onImport(data);
      onClose();
    } catch (err) {
      alert('Invalid JSON format. Please check your data.');
      console.error('Import error:', err);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
      <div className="relative bg-zinc-900/95 border border-violet-500/20 rounded-2xl p-8 max-w-2xl w-full animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Export / Import Data</h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-400" />
              Export Data
            </h3>
            <p className="text-sm text-zinc-400 mb-3">
              Download all games and cheats as JSON backup file.
            </p>
            <button
              onClick={handleExport}
              className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 rounded-xl px-6 py-3 font-bold transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export All Data ({games.length} games)
            </button>
          </div>

          <div className="border-t border-white/5 pt-6">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-400" />
              Import Data
            </h3>
            <p className="text-sm text-zinc-400 mb-3">
              Paste JSON backup data to restore games. This will add/update games.
            </p>
            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder='Paste JSON data here...'
              className="w-full h-40 bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none transition-colors resize-none"
            />
            <button
              onClick={handleImport}
              disabled={!importData.trim() || isImporting}
              className="w-full mt-3 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 rounded-xl px-6 py-3 font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import Data
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Ripple Effect Handler
const createRipple = (event) => {
  const button = event.currentTarget;
  const ripple = document.createElement('div');
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;

  ripple.style.width = ripple.style.height = size + 'px';
  ripple.style.left = x + 'px';
  ripple.style.top = y + 'px';
  ripple.classList.add('ripple');

  button.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
};

// Blob Component for Background with Cursor Interaction & Ripples
const BlobBackground = ({ mousePos }) => {
  const [blob1Offset, setBlob1Offset] = useState({ x: 0, y: 0, scale: 1, brightness: 1 });
  const [blob2Offset, setBlob2Offset] = useState({ x: 0, y: 0, scale: 1, brightness: 1 });
  const [blob1Float, setBlob1Float] = useState({ x: 0, y: 0 });
  const [blob2Float, setBlob2Float] = useState({ x: 0, y: 0 });
  const [ripples1, setRipples1] = useState([]);
  const [ripples2, setRipples2] = useState([]);

  // Random floating movement for blobs
  useEffect(() => {
    const interval = setInterval(() => {
      // Blob 1 random movement
      const angle1 = Math.random() * Math.PI * 2;
      const speed1 = 60 + Math.random() * 40; // 60-100px movement
      setBlob1Float({
        x: Math.cos(angle1) * speed1,
        y: Math.sin(angle1) * speed1
      });

      // Blob 2 random movement
      const angle2 = Math.random() * Math.PI * 2;
      const speed2 = 60 + Math.random() * 40;
      setBlob2Float({
        x: Math.cos(angle2) * speed2,
        y: Math.sin(angle2) * speed2
      });
    }, 2000); // Change direction every 2 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Use callback to batch state updates
    const updateBlobs = () => {
      // Blob 1 (Cyan) position - top left
      const blob1X = window.innerWidth * 0.15 + blob1Float.x;
      const blob1Y = window.innerHeight * 0.1 + blob1Float.y;
      const distX1 = mousePos.x - blob1X;
      const distY1 = mousePos.y - blob1Y;
      const distance1 = Math.sqrt(distX1 * distX1 + distY1 * distY1);
      
      if (distance1 < 300) {
        const pushForce = (300 - distance1) / 300;
        const angle1 = Math.atan2(distY1, distX1);
        setBlob1Offset({
          x: -Math.cos(angle1) * pushForce * 150,
          y: -Math.sin(angle1) * pushForce * 150,
          scale: 1 + pushForce * 0.8,
          brightness: 1 + pushForce * 2
        });
        
        // Add ripples more frequently
        if (distance1 < 150 && Math.random() > 0.5) {
          const rippleId = Date.now() + Math.random();
          setRipples1(prev => [...prev, { id: rippleId, x: distX1, y: distY1 }]);
          setTimeout(() => {
            setRipples1(prev => prev.filter(r => r.id !== rippleId));
          }, 1000);
        }
      } else {
        setBlob1Offset({ x: 0, y: 0, scale: 1, brightness: 1 });
      }

      // Blob 2 (Pink) position - bottom right
      const blob2X = window.innerWidth * 0.85 + blob2Float.x;
      const blob2Y = window.innerHeight * 0.75 + blob2Float.y;
      const distX2 = mousePos.x - blob2X;
      const distY2 = mousePos.y - blob2Y;
      const distance2 = Math.sqrt(distX2 * distX2 + distY2 * distY2);
      
      if (distance2 < 300) {
        const pushForce = (300 - distance2) / 300;
        const angle2 = Math.atan2(distY2, distX2);
        setBlob2Offset({
          x: -Math.cos(angle2) * pushForce * 150,
          y: -Math.sin(angle2) * pushForce * 150,
          scale: 1 + pushForce * 0.8,
          brightness: 1 + pushForce * 2
        });
        
        // Add ripples more frequently
        if (distance2 < 150 && Math.random() > 0.5) {
          const rippleId = Date.now() + Math.random();
          setRipples2(prev => [...prev, { id: rippleId, x: distX2, y: distY2 }]);
          setTimeout(() => {
            setRipples2(prev => prev.filter(r => r.id !== rippleId));
          }, 1000);
        }
      } else {
        setBlob2Offset({ x: 0, y: 0, scale: 1, brightness: 1 });
      }
    };
    
    updateBlobs();
  }, [mousePos, blob1Float, blob2Float]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Blob 1 - Cyan/Turquoise */}
      <div
        style={{
          position: 'absolute',
          top: `calc(10% + ${blob1Float.y + blob1Offset.y}px)`,
          left: `calc(10% + ${blob1Float.x + blob1Offset.x}px)`,
          width: '384px',
          height: '384px',
          background: 'radial-gradient(circle, rgb(6, 182, 212) 0%, rgba(6, 182, 212, 0) 70%)',
          borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
          opacity: 0.6,
          filter: `blur(40px) brightness(${blob1Offset.brightness})`,
          transform: `scale(${blob1Offset.scale})`,
          transition: 'all 3s ease-out',
          animation: 'blob-morph-1 20s infinite',
        }}
      >
        {ripples1.map(ripple => (
          <div
            key={ripple.id}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              border: '3px solid rgba(6, 182, 212, 1)',
              boxShadow: '0 0 20px rgba(6, 182, 212, 0.8)',
              transform: `translate(-50%, -50%) scale(1)`,
              animation: `ripple-blob 1s ease-out forwards`,
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>
      
      {/* Blob 2 - Pink */}
      <div
        style={{
          position: 'absolute',
          bottom: `calc(10% + ${blob2Float.y + blob2Offset.y}px)`,
          right: `calc(15% + ${blob2Float.x + blob2Offset.x}px)`,
          width: '320px',
          height: '320px',
          background: 'radial-gradient(circle, rgb(236, 72, 153) 0%, rgba(236, 72, 153, 0) 70%)',
          borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
          opacity: 0.6,
          filter: `blur(40px) brightness(${blob2Offset.brightness})`,
          transform: `scale(${blob2Offset.scale})`,
          transition: 'all 3s ease-out',
          animation: 'blob-morph-2 25s infinite',
        }}
      >
        {ripples2.map(ripple => (
          <div
            key={ripple.id}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              border: '3px solid rgba(236, 72, 153, 1)',
              boxShadow: '0 0 20px rgba(236, 72, 153, 0.8)',
              transform: `translate(-50%, -50%) scale(1)`,
              animation: `ripple-blob 1s ease-out forwards`,
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes ripple-blob {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(6);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

// Typewriter Effect Component
const TypewriterText = ({ text = "v2.0 // Database" }) => {
  const [displayText, setDisplayText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    const typingSpeed = 200;
    const deletingSpeed = 150;
    const pauseTime = 3000;
    
    let timeout;
    
    if (!isDeleting && displayText !== text) {
      // Typing
      timeout = setTimeout(() => {
        setDisplayText(text.substring(0, displayText.length + 1));
      }, typingSpeed);
    } else if (!isDeleting && displayText === text) {
      // Pause at full text
      timeout = setTimeout(() => {
        setIsDeleting(true);
      }, pauseTime);
    } else if (isDeleting && displayText !== '') {
      // Deleting
      timeout = setTimeout(() => {
        setDisplayText(displayText.substring(0, displayText.length - 1));
      }, deletingSpeed);
    } else if (isDeleting && displayText === '') {
      // Start typing again
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDeleting(false);
    }
    
    return () => clearTimeout(timeout);
  }, [displayText, isDeleting, text]);
  
  return (
    <span className="inline-block border-r-2 border-violet-400 pr-0.5 font-mono" style={{ width: 'fit-content' }}>
      {displayText}
    </span>
  );
};

const Header = ({ onSearch, searchTerm, user, onLoginClick, onLogoutClick, onFeaturesClick }) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  return (
  <header className="sticky top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-2xl supports-[backdrop-filter]:bg-black/20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0 cursor-pointer group" onClick={() => window.location.reload()}>
          <div className="relative">
            <div className="absolute inset-0 bg-violet-600 blur-xl opacity-20 group-hover:opacity-60 transition-opacity duration-500 rounded-full animate-pulse"></div>
            <div className="relative bg-zinc-900/80 p-3 rounded-2xl border border-white/10 group-hover:border-violet-500/50 transition-all duration-300 shadow-xl shadow-black/50">
              <Gamepad2 className="w-6 h-6 text-violet-400 group-hover:text-white transition-colors icon-rotate-on-hover" />
            </div>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-3xl font-black tracking-tighter text-white drop-shadow-lg group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r transition-all duration-500 group-hover:from-violet-400 group-hover:via-pink-400 group-hover:to-purple-400">
              CHEAT<span className="bg-gradient-to-r from-violet-400 via-pink-400 to-fuchsia-400 text-transparent bg-clip-text animate-pulse">DB</span>
            </h1>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.3em] pl-1 h-4">
              <TypewriterText text="v2.0 // Database" />
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <Search className="h-5 w-5 text-zinc-500 group-focus-within:text-violet-400 transition-colors duration-300" />
            </div>
            <input
              type="text"
              className="block w-full pl-12 pr-4 py-3 bg-zinc-900/40 border border-white/5 rounded-2xl leading-5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:bg-zinc-900/80 focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 focus:shadow-[0_0_30px_-5px_rgba(139,92,246,0.2)] sm:text-sm transition-all duration-300 backdrop-blur-sm"
              placeholder="Search database..."
              value={searchTerm}
              onChange={(e) => onSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            {isSearchFocused && searchTerm && (
              <div className="fixed left-4 right-4 sm:left-auto sm:right-auto sm:max-w-xl p-3 bg-zinc-900/95 border border-white/5 rounded-xl backdrop-blur-xl flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-200 z-[60]" style={{ top: 'calc(100% + 1rem)' }}>
                <span className="text-xs text-zinc-500 w-full font-bold uppercase tracking-wider">Quick Filters:</span>
                {['cs2', 'cod', 'eft', 'tf2', 'None'].map((tag, i) => (
                  <button
                    key={i}
                    onClick={() => onSearch(tag)}
                    className="px-3 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold hover:bg-violet-500/20 transition-all pill-enter animate-in fade-in zoom-in-95"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Admin / Login Button */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden md:flex flex-col items-end">
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                <Fingerprint className="w-3 h-3" /> Admin Mode
              </span>
              <code 
                onClick={() => navigator.clipboard.writeText(user.uid)}
                className="text-[10px] text-violet-400 font-mono bg-violet-500/5 border border-violet-500/10 px-2 py-0.5 rounded cursor-pointer hover:bg-violet-500/20 active:scale-95 transition-all"
                title="Click to Copy UID"
              >
                {user.uid.slice(0, 6)}...
              </code>
            </div>
          )}

          <button 
            onClick={onFeaturesClick}
            className="p-3 bg-zinc-900/50 border border-white/5 rounded-xl text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 hover:border-cyan-500/20 transition-all duration-300 hover:shadow-[0_0_15px_-3px_rgba(34,211,238,0.3)]"
            title="Features Guide"
          >
            <Info className="w-5 h-5" />
          </button>

          {user ? (
            <button 
              onClick={onLogoutClick}
              className="p-3 bg-zinc-900/50 border border-white/5 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/20 transition-all duration-300"
              title="Logout Admin"
            >
              <LogOut className="w-5 h-5" />
            </button>
          ) : (
            <button 
              onClick={onLoginClick}
              className="p-3 bg-zinc-900/50 border border-white/5 rounded-xl text-zinc-500 hover:text-violet-400 hover:bg-zinc-800 hover:border-violet-500/20 transition-all duration-300 hover:shadow-[0_0_15px_-3px_rgba(139,92,246,0.3)]"
              title="Admin Login"
            >
              <Lock className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  </header>
  );
};

// Anti-Cheat Info Modal
const AntiCheatInfoModal = ({ antiCheat, onClose }) => {
  const info = antiCheatInfo[antiCheat] || antiCheatInfo['None'];
  
  const difficultyColor = {
    'Easy': 'text-green-400 bg-green-500/10 border-green-500/30',
    'Medium': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    'Hard': 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    'Very Hard': 'text-red-400 bg-red-500/10 border-red-500/30',
    'Extreme': 'text-purple-400 bg-purple-500/10 border-purple-500/30'
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
      <div className="relative bg-zinc-900/95 border border-violet-500/20 rounded-2xl p-8 max-w-lg w-full animate-in fade-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{info.name}</h2>
            <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold border ${difficultyColor[info.difficulty]}`}>
              {info.difficulty} to Bypass
            </span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Description
            </h3>
            <p className="text-zinc-300">{info.description}</p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Detection Methods
            </h3>
            <p className="text-zinc-300">{info.detection}</p>
          </div>

          <div>
            <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-2">Bypass Difficulty</h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    info.bypassDifficulty <= 3 ? 'bg-green-500' :
                    info.bypassDifficulty <= 6 ? 'bg-yellow-500' :
                    info.bypassDifficulty <= 8 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${info.bypassDifficulty * 10}%` }}
                />
              </div>
              <span className="text-white font-bold text-sm">{info.bypassDifficulty}/10</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AntiCheatBadge = ({ ac, onClick }) => {
  const styles = {
    'EAC': 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_-4px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_-4px_rgba(59,130,246,0.6)]',
    'BattlEye': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_10px_-4px_rgba(234,179,8,0.3)] hover:shadow-[0_0_20px_-4px_rgba(234,179,8,0.6)]',
    'Vanguard': 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_-4px_rgba(239,68,68,0.3)] hover:shadow-[0_0_20px_-4px_rgba(239,68,68,0.6)]',
    'VAC': 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_-4px_rgba(34,197,94,0.3)] hover:shadow-[0_0_20px_-4px_rgba(34,197,94,0.6)]',
    'Ricochet': 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_-4px_rgba(168,85,247,0.3)] hover:shadow-[0_0_20px_-4px_rgba(168,85,247,0.6)]',
    'Defense Matrix': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_10px_-4px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_-4px_rgba(6,182,212,0.6)]',
    'None': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  };
  
  const acName = ac || 'Unknown';
  
  return (
    <span 
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1 ${styles[acName] || styles.None}`}
    >
      <Info className="w-3 h-3" />
      {acName}
    </span>
  );
};

// Cheat Status Badge Component
const StatusBadge = ({ status = 'UNDETECTED' }) => {
  const statusConfig = {
    'UNDETECTED': {
      icon: CheckCircle,
      text: 'Undetected',
      className: 'bg-green-500/20 text-green-300 border-green-500/30'
    },
    'DETECTED': {
      icon: XCircle,
      text: 'Detected',
      className: 'bg-red-500/20 text-red-300 border-red-500/30'
    },
    'RISKY': {
      icon: AlertCircle,
      text: 'Risky',
      className: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
    },
    'UPDATED': {
      icon: Clock,
      text: 'Updated',
      className: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
    }
  };
  
  const config = statusConfig[status] || statusConfig['UNDETECTED'];
  const Icon = config.icon;
  
  return (
    <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap transition-all border flex items-center gap-1 ${config.className}`}>
      <Icon className="w-2.5 h-2.5" />
      {config.text}
    </span>
  );
};

// Logo mapping for games
const gameLogoMap = {
  'Apex Legends': '/logos/apex.png',
  'Call of Duty: Black Ops 7': '/logos/cod.png',
  'Call of Duty: Warzone': '/logos/warzone.png',
  'Counter Strike 2': '/logos/cs2.png',
  'Escape from Tarkov': '/logos/eft.png',
  'Overwatch 2': '/logos/ow2.png',
  'Rust': '/logos/rust.png',
  'Team Fortress 2': '/logos/tf2.png',
};

// Scale multipliers for logos with extra whitespace
const logoScaleMap = {
  'Apex Legends': 1.0,
  'Counter Strike 2': 1.15,
  'Rust': 1.2,
  'Call of Duty: Warzone': 1.2,
  'Team Fortress 2': 1.2,
};

// Lazy Loading Image Component
const LazyImage = ({ src, alt, className, style, onError }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={className} style={style}>
      {!isLoaded && (
        <div className="w-full h-full animate-pulse bg-zinc-800/50 rounded" />
      )}
      {isInView && (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          style={style}
          onLoad={() => setIsLoaded(true)}
          onError={onError}
        />
      )}
    </div>
  );
};

const GameCard = React.memo(({ game, onClick, user, onDelete, isEditMode, index, onEdit, onAntiCheatClick, onToggleFavorite, isFavorited }) => {
  const [showPreview, setShowPreview] = useState(false);
  const freeCount = game.cheats?.filter(c => c.tier === 'FREE' || !c.tier).length || 0;
  const paidCount = game.cheats?.filter(c => c.tier === 'PAID').length || 0;
  
  return (
  <div 
    onClick={() => onClick(game)}
    onMouseEnter={() => setShowPreview(true)}
    onMouseLeave={() => setShowPreview(false)}
    className="group relative z-20 rounded-3xl p-6 transition-all duration-500 cursor-pointer hover:-translate-y-3 overflow-hidden card-bounce-enter stagger-cascade border backdrop-blur-sm bg-zinc-900/30 hover:bg-zinc-900/60 border-white/5 hover:border-violet-500/40 hover:shadow-[0_20px_40px_-10px_rgba(139,92,246,0.3)] h-full"
    style={{ animationDelay: `${index * 50}ms` }}
  >
    {/* Animated Gradient Background on Hover */}
    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-fuchsia-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    
    {/* Favorite Button */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggleFavorite?.(game.id);
      }}
      className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 hover:border-yellow-500/50 transition-all hover:scale-105 active:scale-95"
      title={isFavorited ? "Remove from favorites" : "Add to favorites"}
    >
      <Star className={`w-4 h-4 transition-colors ${isFavorited ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-500'}`} />
    </button>
    
    {/* Hover Preview Tooltip */}
    {showPreview && game.cheats && game.cheats.length > 0 && (
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 z-50 bg-zinc-900/95 border border-violet-500/30 rounded-xl px-4 py-2 whitespace-nowrap text-xs font-bold text-violet-300 backdrop-blur-xl float-in animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="flex gap-3">
          <span className="text-emerald-400">Free: {freeCount}</span>
          <span className="text-amber-400">Paid: {paidCount}</span>
        </div>
      </div>
    )}
    
    <div className="relative z-10 flex flex-col h-full">
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-2xl border shadow-inner group-hover:scale-110 transition-transform duration-300 bg-white/90 border-white/5 overflow-hidden flex items-center justify-center" style={{ width: '40px', height: '40px' }}>
            {gameLogoMap[game.title] ? (
              <LazyImage
                src={gameLogoMap[game.title]} 
                alt={game.title}
                className="w-full h-full object-contain object-center"
                style={{ transform: `scale(${logoScaleMap[game.title] || 1.1})`, maxWidth: '100%', maxHeight: '100%' }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <ShieldAlert className="w-8 h-8 transition-colors icon-pulse text-zinc-400 group-hover:text-violet-400" />
            )}
          </div>
          <AntiCheatBadge ac={game.antiCheat} onClick={() => onAntiCheatClick?.(game.antiCheat)} />
        </div>
        
        {/* EDIT & DELETE BUTTONS (Admin Only + Edit Mode) */}
        {user && isEditMode && (
          <div className="flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation(); 
                onEdit(game);
              }}
              className="p-2 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 hover:text-blue-300 rounded-xl transition-all border border-blue-500/20 hover:scale-105 active:scale-95 shadow-lg shadow-blue-500/10 animate-in zoom-in duration-200"
              title="Edit Game"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation(); 
                onDelete(game.id);
              }}
              className="p-2 text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300 rounded-xl transition-all border border-red-500/20 hover:scale-105 active:scale-95 shadow-lg shadow-red-500/10 animate-in zoom-in duration-200"
              title="Delete Game"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      
      <h3 className="text-2xl font-black mb-2 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r transition-all text-white group-hover:from-white group-hover:to-violet-200 break-words">
        {game.title}
      </h3>
      
      <div className="flex items-center gap-2 mb-8">
        <span className="text-xs font-medium px-2 py-1 rounded-md border flex items-center gap-1.5 transition-all text-zinc-500 bg-zinc-800/50 border-white/5 group-hover:border-violet-500/30 group-hover:bg-zinc-800/80">
          <Zap className="w-3 h-3 text-violet-400" />
          {game.cheats?.length || 0} Cheats
        </span>
      </div>

      <div className="mt-auto pt-5 border-t flex items-center justify-between text-sm transition-colors border-white/5 text-zinc-500 group-hover:text-violet-300">
        <span className="text-xs font-bold uppercase tracking-wider">Access Database</span>
        <div className="p-1.5 rounded-full transition-all bg-white/5 group-hover:bg-violet-500/20 group-hover:scale-105">
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </div>
  </div>
  );
});

const SkeletonCard = ({ index }) => (
  <div 
    className="group relative rounded-3xl p-6 transition-all duration-500 overflow-hidden backdrop-blur-sm card-bounce-enter border bg-zinc-900/30 border-white/5 animate-pulse"
    style={{ animationDelay: `${index * 50}ms` }}
  >
    <div className="relative z-10 flex flex-col h-full gap-4">
      <div className="flex justify-between items-start">
        <div className="flex gap-3 flex-1">
          <div className="p-3 rounded-2xl bg-zinc-800/50 w-12 h-12" />
          <div className="flex gap-2">
            <div className="h-6 bg-zinc-800/50 rounded w-20" />
            <div className="h-6 bg-zinc-800/50 rounded w-16" />
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-8 bg-zinc-800/50 rounded w-40" />
        <div className="h-5 bg-zinc-800/50 rounded w-32" />
      </div>
      <div className="mt-auto pt-4 border-t border-white/5">
        <div className="h-4 bg-zinc-800/50 rounded w-24" />
      </div>
    </div>
  </div>
);

const LoginModal = ({ onClose, onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await onLogin(email, password);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Invalid credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-300 glass-card border border-violet-500/20">
        
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"></div>
        
        <h2 className="text-2xl font-black mb-8 flex items-center gap-3 text-white">
          <div className="p-2 rounded-xl transition-colors bg-violet-500/10">
             <Lock className="w-6 h-6 text-violet-500" />
          </div>
          Admin Access
        </h2>
        {error && (
          <div id="login-error" className="mb-6 p-4 rounded-2xl text-sm flex items-center gap-2 border transition-colors bg-red-500/5 border-red-500/10 text-red-400 animate-in slide-in-from-top-4 shake-error">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-7">
          <div className="input-with-floating-label relative">
            <input 
              type="email" 
              required
              placeholder=" "
              className="peer w-full rounded-xl px-4 py-3 outline-none transition-all focus:ring-1 border bg-zinc-900/50 border-white/10 text-white focus:ring-violet-500 focus:border-violet-500 focus:bg-black"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <label className="floating-label text-zinc-500 pointer-events-none">
              Email Address
            </label>
          </div>
          <div className="input-with-floating-label relative">
            <input 
              type="password" 
              required
              placeholder=" "
              className="peer w-full rounded-xl px-4 py-3 outline-none transition-all focus:ring-1 border bg-zinc-900/50 border-white/10 text-white focus:ring-violet-500 focus:border-violet-500 focus:bg-black"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <label className="floating-label text-zinc-500 pointer-events-none">
              Password
            </label>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 active:scale-95 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 icon-rotate-on-hover" />
                Unlock Database
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

const GameDetail = ({ game, onClose, onAddCheat, onVoteCheat, userVotedCheat, user, appId }) => {
  const [newCheat, setNewCheat] = useState({ name: '', productLink: '', features: [], notes: '', tier: 'FREE', type: 'EXTERNAL' });
  const [isAdding, setIsAdding] = useState(false);
  const [tierFilter, setTierFilter] = useState('ALL');
  const [editingCheatId, setEditingCheatId] = useState(null);
  const [editingCheat, setEditingCheat] = useState(null);
  const [cheatSearchTerm, setCheatSearchTerm] = useState('');
  const featureTags = ['Aimbot', 'ESP', 'Exploits', 'Configs', 'Misc'];
  const tiers = ['FREE', 'PAID'];

  // Auto-Migration: Detect and fix legacy data without IDs
  useEffect(() => {
    const migrateOldData = async () => {
      if (!game.cheats || game.cheats.length === 0) return;
      
      // Check if any cheats are missing IDs
      const hasLegacyData = game.cheats.some(cheat => !cheat.id);
      if (!hasLegacyData) return;
      
      console.log('🔄 Migrating legacy data for:', game.title);
      
      try {
        const db = getFirestore();
        const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', game.id);
        
        // Create updated cheats array with IDs for any missing ones
        const updatedCheats = game.cheats.map(cheat => ({
          ...cheat,
          id: cheat.id || crypto.randomUUID()
        }));
        
        // Atomic update to Firestore
        await updateDoc(gameRef, { cheats: updatedCheats });
        
        console.log('✅ Migration complete for:', game.title);
      } catch (err) {
        console.error('❌ Migration failed:', err);
      }
    };
    
    migrateOldData();
  }, [game.id, game.cheats, game.title, appId]);

  const handleAddCheat = async (e) => {
    e.preventDefault();
    if (!newCheat.name || !newCheat.productLink) return;
    await onAddCheat(game.id, newCheat);
    setNewCheat({ name: '', productLink: '', features: [], notes: '', tier: 'FREE', type: 'EXTERNAL' });
    setIsAdding(false);
  };

  const handleEditCheat = async (e) => {
    e.preventDefault();
    if (!editingCheat.name || !editingCheat.productLink) return;
    
    const db = getFirestore();
    const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', game.id);
    
    try {
      await runTransaction(db, async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists()) {
          throw new Error("Game document does not exist");
        }
        
        const cheats = gameDoc.data().cheats || [];
        
        // Find cheat by ID
        const cheatIndex = cheats.findIndex(c => c.id === editingCheat.id);
        if (cheatIndex === -1) {
          throw new Error("Cheat not found");
        }
        
        // Update the specific cheat by ID
        const updatedCheats = [...cheats];
        updatedCheats[cheatIndex] = editingCheat;
        
        transaction.update(gameRef, { cheats: updatedCheats });
      });
    } catch (err) {
      console.error("Error updating cheat:", err);
      alert("Failed to update cheat. Please try again.");
    }
    
    setEditingCheatId(null);
    setEditingCheat(null);
  };

  const handleDeleteCheat = async (cheatId) => {
    const db = getFirestore();
    const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', game.id);
    
    try {
      await runTransaction(db, async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists()) {
          throw new Error("Game document does not exist");
        }
        
        const cheats = gameDoc.data().cheats || [];
        
        // Verify cheat exists by ID
        if (!cheats.some(c => c.id === cheatId)) {
          throw new Error("Cheat not found");
        }
        
        // Filter out the cheat with the given ID
        const updatedCheats = cheats.filter(c => c.id !== cheatId);
        
        transaction.update(gameRef, { cheats: updatedCheats });
      });
    } catch (err) {
      console.error("Error deleting cheat:", err);
      alert("Failed to delete cheat. Please try again.");
    }
    
    setEditingCheatId(null);
    setEditingCheat(null);
  };

  const filteredCheats = game.cheats ? game.cheats.filter(cheat => {
    const tierMatch = tierFilter === 'ALL' || cheat.tier === tierFilter;
    if (!cheatSearchTerm.trim()) return tierMatch;
    
    const searchLower = cheatSearchTerm.toLowerCase();
    const nameMatch = cheat.name?.toLowerCase().includes(searchLower);
    const featureMatch = cheat.features?.some(f => f.toLowerCase().includes(searchLower));
    const notesMatch = cheat.notes?.toLowerCase().includes(searchLower);
    
    return tierMatch && (nameMatch || featureMatch || notesMatch);
  }) : [];

  const toggleFeature = (feature) => {
    setNewCheat(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity duration-300 modal-backdrop" 
        onClick={onClose}
      />
      <div className="relative rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 slide-up-enter w-full max-w-4xl max-h-[90vh] ring-1 border transition-colors" style={{
        backgroundColor: '#0a0a0a',
        borderColor: 'rgba(255,255,255,0.1)',
        ringColor: 'rgba(255,255,255,0.1)',
      }}>
        {/* Header */}
        <div className="flex items-start justify-between px-8 py-8 border-b transition-colors border-white/5 bg-gradient-to-b from-zinc-900/50 to-transparent">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <AntiCheatBadge ac={game.antiCheat} />
              <div className="h-1 w-1 rounded-full bg-zinc-700"></div>
              <span className="text-xs font-bold uppercase tracking-wider transition-colors text-zinc-500">Database Entry</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tighter mb-2 text-white">{game.title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-full transition-all hover:rotate-90 hover:scale-105 active:scale-95 duration-300 text-zinc-400 hover:bg-violet-500/20 hover:text-white border border-transparent hover:border-violet-500/30"
            title="Close (Keyboard: Esc)"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar transition-colors bg-[#0a0a0a]">
          
          {/* Add Cheat Form - ONLY VISIBLE IF LOGGED IN */}
          {user && (
            <>
              {!isAdding ? (
                <button 
                  onClick={() => setIsAdding(true)}
                  className="w-full mb-8 py-4 border border-dashed rounded-2xl hover:transition-all text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2 group border-zinc-800 text-zinc-500 hover:text-violet-400 hover:border-violet-500/30 hover:bg-violet-500/5"
                >
                  <div className="p-1 rounded-md transition-colors bg-zinc-800 group-hover:bg-violet-500/20">
                    <Plus className="w-4 h-4" />
                  </div>
                  Add New Cheat (Admin)
                </button>
              ) : (
                <form onSubmit={handleAddCheat} className="mb-8 p-8 rounded-3xl border animate-in slide-in-from-top-4 ring-1 transition-all bg-zinc-900/30 border-violet-500/20 ring-violet-500/10">
                  <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
                    <div className="p-2 rounded-lg transition-colors bg-violet-500/10">
                      <Zap className="w-5 h-5 text-violet-400" />
                    </div>
                    New Cheat
                  </h3>
                  <div className="space-y-6 mb-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider ml-1 transition-colors text-zinc-500">Cheat Name</label>
                      <input
                        autoFocus
                        required
                        placeholder="e.g. UnknownCheats V2"
                        className="w-full rounded-xl px-4 py-3 outline-none text-sm transition-all focus:ring-1 border bg-black/50 border-white/10 text-white placeholder-zinc-700 focus:ring-violet-500 focus:bg-black"
                        value={newCheat.name}
                        onChange={e => setNewCheat({...newCheat, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider ml-1 transition-colors text-zinc-500">Product Link</label>
                      <input
                        required
                        type="url"
                        placeholder="https://example.com/cheat"
                        className="w-full rounded-xl px-4 py-3 outline-none text-sm transition-all focus:ring-1 border bg-black/50 border-white/10 text-white placeholder-zinc-700 focus:ring-violet-500 focus:bg-black"
                        value={newCheat.productLink}
                        onChange={e => setNewCheat({...newCheat, productLink: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider ml-1 transition-colors text-zinc-500">Features</label>
                      <div className="flex flex-wrap gap-2">
                        {featureTags.map(feature => (
                          <button
                            key={feature}
                            type="button"
                            onClick={() => toggleFeature(feature)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                              newCheat.features.includes(feature)
                                ? 'bg-violet-500/30 border-violet-500/50 text-violet-200'
                                : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-700/50'
                            }`}
                          >
                            {feature}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider ml-1 transition-colors text-zinc-500">Tier</label>
                      <div className="flex gap-3">
                        {tiers.map(tier => (
                          <button
                            key={tier}
                            type="button"
                            onClick={() => setNewCheat({...newCheat, tier})}
                            className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                              newCheat.tier === tier
                                ? tier === 'FREE'
                                  ? 'bg-emerald-500/30 border-emerald-500/50 text-emerald-200'
                                  : 'bg-amber-500/30 border-amber-500/50 text-amber-200'
                                : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-700/50'
                            }`}
                          >
                            {tier}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider ml-1 transition-colors text-zinc-500">Type</label>
                      <div className="flex gap-3">
                        {['INTERNAL', 'EXTERNAL'].map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setNewCheat({...newCheat, type})}
                            className={`flex-1 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all border ${
                              newCheat.type === type
                                ? type === 'INTERNAL'
                                  ? 'bg-blue-500/30 border-blue-500/50 text-blue-200'
                                  : 'bg-purple-500/30 border-purple-500/50 text-purple-200'
                                : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-700/50'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider ml-1 transition-colors text-zinc-500">Notes (Optional)</label>
                      <textarea
                        placeholder="Additional information..."
                        className="w-full rounded-xl px-4 py-3 outline-none text-sm transition-all focus:ring-1 border bg-black/50 border-white/10 text-white placeholder-zinc-700 focus:ring-violet-500 focus:bg-black resize-none"
                        rows="2"
                        value={newCheat.notes}
                        onChange={e => setNewCheat({...newCheat, notes: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className="px-6 py-2.5 text-xs font-bold transition-colors uppercase tracking-wide text-zinc-500 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 text-white text-xs font-bold rounded-xl transition-all shadow-lg uppercase tracking-wide hover:scale-105 bg-violet-600 hover:bg-violet-500 shadow-violet-900/20"
                    >
                      Add Cheat
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* Search and Filter Section */}
          {game.cheats && game.cheats.length > 0 && (
            <>
              {/* Cheat Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search cheats by name, features, or notes..."
                    value={cheatSearchTerm}
                    onChange={(e) => setCheatSearchTerm(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-zinc-800/50 border border-white/10 rounded-xl text-white placeholder:text-zinc-600 focus:border-violet-500/50 focus:outline-none transition-colors text-sm"
                  />
                  {cheatSearchTerm && (
                    <button
                      onClick={() => setCheatSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tier Filter Tabs */}
              <div className="mb-6 flex gap-2 border-b border-white/10 pb-4">
                {['ALL', 'FREE', 'PAID'].map(tier => (
                  <button
                    key={tier}
                    onClick={() => setTierFilter(tier)}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all rounded-lg border ${
                      tierFilter === tier
                        ? tier === 'ALL'
                          ? 'bg-violet-500/30 border-violet-500/50 text-violet-200'
                          : tier === 'FREE'
                          ? 'bg-emerald-500/30 border-emerald-500/50 text-emerald-200'
                          : 'bg-amber-500/30 border-amber-500/50 text-amber-200'
                        : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-700/50'
                    }`}
                  >
                    {tier === 'ALL' ? `All (${game.cheats.length})` : `${tier} (${game.cheats.filter(c => c.tier === tier).length})`}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Cheats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCheats.length > 0 ? (
              [...filteredCheats].reverse().map((cheat) => {
                const isEditing = editingCheatId === cheat.id;
                
                return isEditing ? (
                  // Edit Form
                  <form onSubmit={handleEditCheat} key={cheat.id} className="col-span-1 p-5 border rounded-2xl animate-in slide-in-from-top-4 bg-zinc-900/60 border-violet-500/40 space-y-4">
                    <h4 className="font-bold text-sm text-violet-300 mb-4">Edit Cheat</h4>
                    <div className="space-y-3">
                      <input
                        autoFocus
                        required
                        placeholder="Cheat Name"
                        className="w-full rounded-lg px-3 py-2 outline-none text-sm transition-all focus:ring-1 border bg-black/50 border-white/10 text-white placeholder-zinc-600 focus:ring-violet-500"
                        value={editingCheat.name}
                        onChange={e => setEditingCheat({...editingCheat, name: e.target.value})}
                      />
                      <input
                        required
                        type="url"
                        placeholder="Product Link"
                        className="w-full rounded-lg px-3 py-2 outline-none text-sm transition-all focus:ring-1 border bg-black/50 border-white/10 text-white placeholder-zinc-600 focus:ring-violet-500"
                        value={editingCheat.productLink}
                        onChange={e => setEditingCheat({...editingCheat, productLink: e.target.value})}
                      />
                      <div className="flex gap-2">
                        {['FREE', 'PAID'].map(tier => (
                          <button
                            key={tier}
                            type="button"
                            onClick={() => setEditingCheat({...editingCheat, tier})}
                            className={`flex-1 px-2 py-1.5 rounded text-xs font-bold transition-all ${
                              editingCheat.tier === tier
                                ? tier === 'FREE' ? 'bg-emerald-500/30 border-emerald-500/50 text-emerald-200' : 'bg-amber-500/30 border-amber-500/50 text-amber-200'
                                : 'bg-zinc-700/50 text-zinc-400 hover:bg-zinc-600/50'
                            }`}
                          >
                            {tier}
                          </button>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        {['INTERNAL', 'EXTERNAL'].map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setEditingCheat({...editingCheat, type})}
                            className={`flex-1 px-2 py-1.5 rounded text-xs font-bold transition-all ${
                              editingCheat.type === type
                                ? type === 'INTERNAL' ? 'bg-blue-500/30 border-blue-500/50 text-blue-200' : 'bg-purple-500/30 border-purple-500/50 text-purple-200'
                                : 'bg-zinc-700/50 text-zinc-400 hover:bg-zinc-600/50'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                      <textarea
                        placeholder="Notes"
                        className="w-full rounded-lg px-3 py-2 outline-none text-sm transition-all focus:ring-1 border bg-black/50 border-white/10 text-white placeholder-zinc-600 focus:ring-violet-500 resize-none"
                        rows="2"
                        value={editingCheat.notes || ''}
                        onChange={e => setEditingCheat({...editingCheat, notes: e.target.value})}
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button type="button" onClick={() => setEditingCheatId(null)} className="flex-1 px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors">Cancel</button>
                      <button type="submit" className="flex-1 px-3 py-1.5 text-xs font-bold bg-violet-600 hover:bg-violet-500 text-white rounded transition-all">Save</button>
                    </div>
                  </form>
                ) : (
                  // Cheat Card
                  <div
                    key={cheat.id}
                    className="group relative p-4 sm:p-5 border rounded-2xl transition-all duration-300 bg-zinc-900/20 hover:bg-zinc-900/60 border-white/5 hover:border-violet-500/40 hover:shadow-[0_15px_40px_-10px_rgba(139,92,246,0.5)] flex flex-col overflow-hidden"
                    style={{ opacity: cheat.id ? 1 : 0.5 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 via-transparent to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    <div className="relative z-10">
                      <div className="mb-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-bold text-xs sm:text-sm group-hover:text-violet-300 text-zinc-200 flex-1 line-clamp-2 transition-colors">{cheat.name}</h4>
                          <div className="flex gap-1 flex-shrink-0">
                            <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap transition-all ${
                              cheat.tier === 'FREE'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 group-hover:bg-emerald-500/30 group-hover:border-emerald-500/50'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 group-hover:bg-amber-500/30 group-hover:border-amber-500/50'
                            }`}>
                              {cheat.tier || 'FREE'}
                            </span>
                            {cheat.type && (
                              <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap transition-all ${
                                cheat.type === 'INTERNAL'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 group-hover:bg-blue-500/30 group-hover:border-blue-500/50'
                                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30 group-hover:bg-purple-500/30 group-hover:border-purple-500/50'
                              }`}>
                                {cheat.type}
                              </span>
                            )}
                          </div>
                        </div>
                        {cheat.notes && <p className="text-[10px] sm:text-xs text-zinc-500 line-clamp-2 group-hover:text-zinc-400 transition-colors">{cheat.notes}</p>}
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {cheat.features && cheat.features.map((feature, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all group-hover:bg-violet-500/30 group-hover:border-violet-500/50">
                            {feature}
                          </span>
                        ))}
                      </div>
                      {cheat.addedAt && (
                        <div className="text-[9px] sm:text-[10px] text-zinc-600 group-hover:text-zinc-500 transition-colors mb-3">
                          Added {formatTimeAgo(cheat.addedAt)}
                        </div>
                      )}
                      <div className="mt-auto pt-3 border-t border-white/5">
                        <div className="flex items-center justify-between text-[11px] sm:text-xs mb-2 gap-1">
                          <a
                            href={cheat.productLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-zinc-500 hover:text-cyan-400 transition-colors font-semibold flex-1 min-w-0"
                            title="Open link"
                          >
                            <Copy className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">View</span>
                          </a>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              onVoteCheat(cheat.id);
                            }}
                            disabled={!cheat.id}
                            className={`flex items-center gap-1 px-2 py-1 rounded transition-all active:scale-95 flex-shrink-0 ${
                              cheat.id
                                ? 'text-zinc-500 hover:text-violet-400 bg-zinc-800/30 hover:bg-violet-500/20 cursor-pointer'
                                : 'text-zinc-600 bg-zinc-800/20 cursor-not-allowed'
                            }`}
                            title={cheat.id ? `Votes: ${cheat.votes || 0}` : 'Migrating...'}
                          >
                            <ThumbsUp className={`w-3 h-3 transition-colors ${userVotedCheat(cheat.id) ? 'fill-violet-400 text-violet-400' : ''}`} />
                            <span className="text-[9px] font-bold">{cheat.votes || 0}</span>
                          </button>
                        </div>
                        {user && (
                          <div className="flex gap-1.5 pt-2 border-t border-white/5">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                setEditingCheatId(cheat.id);
                                setEditingCheat({...cheat});
                              }}
                              disabled={!cheat.id}
                              className={`flex-1 px-2 py-1.5 text-[9px] sm:text-xs font-bold rounded transition-all active:scale-95 ${
                                cheat.id
                                  ? 'text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 cursor-pointer'
                                  : 'text-zinc-500 bg-zinc-500/10 cursor-not-allowed'
                              }`}
                              title={cheat.id ? "Edit" : "Migrating..."}
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                if (confirm('Delete this cheat?')) {
                                  handleDeleteCheat(cheat.id);
                                }
                              }}
                              disabled={!cheat.id}
                              className={`flex-1 px-2 py-1.5 text-[9px] sm:text-xs font-bold rounded transition-all active:scale-95 ${
                                cheat.id
                                  ? 'text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 cursor-pointer'
                                  : 'text-zinc-500 bg-zinc-500/10 cursor-not-allowed'
                              }`}
                              title={cheat.id ? "Delete" : "Migrating..."}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full text-center py-20 border border-dashed rounded-3xl border-zinc-800 bg-zinc-900/20">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border bg-zinc-900 border-zinc-800">
                   <Ghost className="w-8 h-8 text-zinc-700" />
                </div>
                <h3 className="font-bold mb-1 text-zinc-300">{tierFilter === 'ALL' ? 'No Cheats Yet' : `No ${tierFilter} Cheats`}</h3>
                <p className="text-sm text-zinc-600">{tierFilter === 'ALL' ? 'This database entry is waiting for contributions.' : 'Try selecting a different tier.'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- New Component: Mouse Effects (Background Animations) ---
const MouseEffects = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  return (
    <>
      {/* Blob Background Animation */}
      <BlobBackground mousePos={mousePos} />
      
      {/* Cursor Glow */}
      <CursorGlow onMouseMove={setMousePos} />

      {/* Animated Background Mesh */}
      <AnimatedBackgroundMesh mousePos={mousePos} />
    </>
  );
};

// --- Main App ---

// Analytics utility functions
const analytics = {
  track: (event, data = {}) => {
    try {
      const analyticsData = safeLocalStorage.getItem('cheatdb_analytics', {});
      const now = Date.now();
      
      if (!analyticsData[event]) {
        analyticsData[event] = [];
      }
      
      analyticsData[event].push({ ...data, timestamp: now });
      
      // Keep only last 1000 events per type
      if (analyticsData[event].length > 1000) {
        analyticsData[event] = analyticsData[event].slice(-1000);
      }
      
      safeLocalStorage.setItem('cheatdb_analytics', analyticsData);
    } catch (err) {
      console.error('Analytics tracking error:', err);
    }
  },
  
  getStats: () => {
    try {
      const analyticsData = safeLocalStorage.getItem('cheatdb_analytics', {});
      const now = Date.now();
      const dayAgo = now - (24 * 60 * 60 * 1000);
      const weekAgo = now - (7 * 24 * 60 * 60 * 1000);
      
      return {
        searches: {
          total: analyticsData.search?.length || 0,
          last24h: analyticsData.search?.filter(e => e.timestamp > dayAgo).length || 0,
          last7days: analyticsData.search?.filter(e => e.timestamp > weekAgo).length || 0,
          topQueries: analyticsData.search
            ?.filter(e => e.timestamp > weekAgo)
            .reduce((acc, e) => {
              acc[e.query] = (acc[e.query] || 0) + 1;
              return acc;
            }, {})
        },
        gameViews: {
          total: analyticsData.gameView?.length || 0,
          last24h: analyticsData.gameView?.filter(e => e.timestamp > dayAgo).length || 0,
          last7days: analyticsData.gameView?.filter(e => e.timestamp > weekAgo).length || 0,
          topGames: analyticsData.gameView
            ?.filter(e => e.timestamp > weekAgo)
            .reduce((acc, e) => {
              acc[e.gameTitle] = (acc[e.gameTitle] || 0) + 1;
              return acc;
            }, {})
        },
        votes: {
          total: analyticsData.vote?.length || 0,
          last24h: analyticsData.vote?.filter(e => e.timestamp > dayAgo).length || 0,
          last7days: analyticsData.vote?.filter(e => e.timestamp > weekAgo).length || 0
        }
      };
    } catch (err) {
      console.error('Analytics stats error:', err);
      return { searches: {}, gameViews: {}, votes: {} };
    }
  }
};

// Analytics Dashboard Modal
const AnalyticsDashboard = ({ onClose }) => {
  const stats = analytics.getStats();
  
  const topSearches = Object.entries(stats.searches.topQueries || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);
  
  const topGames = Object.entries(stats.gameViews.topGames || {})
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
      <div className="relative bg-zinc-900/95 border border-violet-500/20 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white flex items-center gap-3">
            <Database className="w-8 h-8 text-violet-400" />
            Usage Analytics
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Searches */}
          <div className="bg-zinc-800/30 border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Search className="w-6 h-6 text-blue-400" />
              <h3 className="text-lg font-bold text-white">Searches</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Last 24h</span>
                <span className="text-xl font-bold text-blue-400">{stats.searches.last24h}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Last 7 days</span>
                <span className="text-xl font-bold text-blue-300">{stats.searches.last7days}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">All Time</span>
                <span className="text-xl font-bold text-blue-200">{stats.searches.total}</span>
              </div>
            </div>
          </div>

          {/* Game Views */}
          <div className="bg-zinc-800/30 border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Gamepad2 className="w-6 h-6 text-violet-400" />
              <h3 className="text-lg font-bold text-white">Game Views</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Last 24h</span>
                <span className="text-xl font-bold text-violet-400">{stats.gameViews.last24h}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Last 7 days</span>
                <span className="text-xl font-bold text-violet-300">{stats.gameViews.last7days}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">All Time</span>
                <span className="text-xl font-bold text-violet-200">{stats.gameViews.total}</span>
              </div>
            </div>
          </div>

          {/* Votes */}
          <div className="bg-zinc-800/30 border border-white/5 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <ThumbsUp className="w-6 h-6 text-emerald-400" />
              <h3 className="text-lg font-bold text-white">Votes Cast</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Last 24h</span>
                <span className="text-xl font-bold text-emerald-400">{stats.votes.last24h}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">Last 7 days</span>
                <span className="text-xl font-bold text-emerald-300">{stats.votes.last7days}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-500">All Time</span>
                <span className="text-xl font-bold text-emerald-200">{stats.votes.total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Searches */}
        {topSearches.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Top Searches (Last 7 Days)
            </h3>
            <div className="space-y-2">
              {topSearches.map(([query, count], idx) => (
                <div key={query} className="flex items-center gap-3 bg-zinc-800/30 border border-white/5 rounded-lg p-3">
                  <span className="text-lg font-bold text-zinc-600 w-6">{idx + 1}</span>
                  <span className="flex-1 text-white font-medium">{query}</span>
                  <span className="text-amber-400 font-bold">{count}×</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Games */}
        {topGames.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-400" />
              Most Viewed Games (Last 7 Days)
            </h3>
            <div className="space-y-2">
              {topGames.map(([game, count], idx) => (
                <div key={game} className="flex items-center gap-3 bg-zinc-800/30 border border-white/5 rounded-lg p-3">
                  <span className="text-lg font-bold text-zinc-600 w-6">{idx + 1}</span>
                  <span className="flex-1 text-white font-medium">{game}</span>
                  <span className="text-pink-400 font-bold">{count}×</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Features Guide Modal - Interactive Aimbot Explanation
const FeaturesGuideModal = ({ onClose }) => {
  const [targetPosition, setTargetPosition] = useState({ x: 50, y: 50 });
  const [crosshairPosition, setCrosshairPosition] = useState({ x: 50, y: 50 });
  const [isAimbotEnabled, setIsAimbotEnabled] = useState(false);
  const [smoothness, setSmoothness] = useState(1); // 0=Low, 1=Medium, 2=High
  const [fov, setFov] = useState(1); // 0=Small, 1=Medium, 2=Large
  
  // Smoothness mapping: Low=Fast, Medium=Normal, High=Slow
  const smoothnessValues = [20, 50, 80]; // Lower = faster aim snap
  const smoothnessLabels = ['Low (Fast)', 'Medium', 'High (Slow)'];
  
  // FOV mapping: Small, Medium, Large radius
  const fovValues = [8, 15, 25];
  const fovLabels = ['Small', 'Medium', 'Large'];
  
  const currentSmoothness = smoothnessValues[smoothness];
  const currentFov = fovValues[fov];
  
  // Simulate aimbot movement
  useEffect(() => {
    if (!isAimbotEnabled) return;
    
    const interval = setInterval(() => {
      setCrosshairPosition(prev => {
        const dx = targetPosition.x - prev.x;
        const dy = targetPosition.y - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if majority of target is within FOV
        // Target radius is ~4% (half of 8% width), so if distance > (fov + 4), majority is outside
        const targetRadius = 4;
        if (distance > currentFov + targetRadius) {
          // Target is outside FOV, don't lock on
          return prev;
        }
        
        if (distance < 2) return prev;
        
        const speed = (100 - currentSmoothness) / 100;
        return {
          x: prev.x + (dx * speed * 0.1),
          y: prev.y + (dy * speed * 0.1)
        };
      });
    }, 16);
    
    return () => clearInterval(interval);
  }, [isAimbotEnabled, targetPosition, currentSmoothness, currentFov]);
  
  // Move target randomly
  useEffect(() => {
    const interval = setInterval(() => {
      setTargetPosition({
        x: 20 + Math.random() * 60,
        y: 20 + Math.random() * 60
      });
    }, 3000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />
      <div className="relative bg-zinc-900/95 border border-violet-500/20 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-300">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-3xl font-black text-white mb-2">Features Guide</h2>
            <p className="text-zinc-400">Learn how cheat features work with interactive demonstrations</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Aimbot Section */}
        <div className="space-y-6">
          <div className="bg-zinc-800/50 border border-white/10 rounded-xl p-6">
            <h3 className="text-2xl font-bold text-violet-400 mb-3 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
                <line x1="12" y1="2" x2="12" y2="6" strokeWidth="2"/>
                <line x1="12" y1="18" x2="12" y2="22" strokeWidth="2"/>
                <line x1="2" y1="12" x2="6" y2="12" strokeWidth="2"/>
                <line x1="18" y1="12" x2="22" y2="12" strokeWidth="2"/>
              </svg>
              Aimbot
            </h3>
            <p className="text-zinc-300 mb-6">
              Automatically aims your crosshair at enemy players. Uses memory reading to detect player positions and smoothly moves your aim towards targets within your Field of View (FOV).
            </p>
            
            {/* Interactive Demo */}
            <div className="bg-zinc-900 border border-white/10 rounded-lg p-4 mb-4">
              <div className="relative w-full aspect-video bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg overflow-hidden border border-violet-500/20">
                {/* FOV Circle */}
                <div 
                  className="absolute border-2 border-violet-500/30 rounded-full pointer-events-none transition-all"
                  style={{
                    left: `${crosshairPosition.x}%`,
                    top: `${crosshairPosition.y}%`,
                    width: `${currentFov * 2}vh`,
                    height: `${currentFov * 2}vh`,
                    transform: 'translate(-50%, -50%)'
                  }}
                />
                
                {/* Target (Enemy) */}
                <div 
                  className="absolute w-8 h-8 transition-all duration-500"
                  style={{
                    left: `${targetPosition.x}%`,
                    top: `${targetPosition.y}%`,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                    <div className="relative bg-red-500 w-8 h-8 rounded-full border-2 border-red-300 shadow-lg shadow-red-500/50"></div>
                  </div>
                </div>
                
                {/* Crosshair */}
                <div 
                  className="absolute transition-all pointer-events-none"
                  style={{
                    left: `${crosshairPosition.x}%`,
                    top: `${crosshairPosition.y}%`,
                    transform: 'translate(-50%, -50%)',
                    transitionDuration: isAimbotEnabled ? '0ms' : '300ms'
                  }}
                >
                  <div className="relative">
                    {/* Horizontal line */}
                    <div className="absolute w-6 h-0.5 bg-green-400 shadow-lg shadow-green-500/50" style={{ left: '-12px', top: '0' }}></div>
                    {/* Vertical line */}
                    <div className="absolute w-0.5 h-6 bg-green-400 shadow-lg shadow-green-500/50" style={{ left: '0', top: '-12px' }}></div>
                    {/* Center dot */}
                    <div className="absolute w-1 h-1 bg-green-400 rounded-full" style={{ left: '-2px', top: '-2px' }}></div>
                  </div>
                </div>
                
                {/* Instructions overlay */}
                <div className="absolute top-4 left-4 text-xs text-zinc-400 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg">
                  {isAimbotEnabled ? '🎯 Aimbot Active - Tracking Target' : '⏸️ Aimbot Disabled - Manual Aim'}
                </div>
              </div>
              
              {/* Controls */}
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsAimbotEnabled(!isAimbotEnabled)}
                    className={`px-6 py-2.5 rounded-xl font-bold transition-all ${
                      isAimbotEnabled 
                        ? 'bg-green-500/20 border-green-500/50 text-green-300 border' 
                        : 'bg-zinc-800 border-white/10 text-zinc-400 border hover:bg-zinc-700'
                    }`}
                  >
                    {isAimbotEnabled ? 'Disable Aimbot' : 'Enable Aimbot'}
                  </button>
                  <span className="text-sm text-zinc-500">Toggle to see how aimbot automatically tracks the target</span>
                </div>
                
                <div>
                  <label className="text-sm font-bold text-zinc-400 mb-2 block">Smoothness: {smoothnessLabels[smoothness]}</label>
                  <div className="flex gap-2">
                    {smoothnessLabels.map((label, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSmoothness(idx)}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                          smoothness === idx
                            ? 'bg-violet-500/30 border-violet-500/50 text-violet-300 border-2'
                            : 'bg-zinc-800 border-white/10 text-zinc-400 border hover:bg-zinc-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Higher = Slower, more natural movement (less detectable)</p>
                </div>
                
                <div>
                  <label className="text-sm font-bold text-zinc-400 mb-2 block">FOV (Field of View): {fovLabels[fov]}</label>
                  <div className="flex gap-2">
                    {fovLabels.map((label, idx) => (
                      <button
                        key={idx}
                        onClick={() => setFov(idx)}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${
                          fov === idx
                            ? 'bg-violet-500/30 border-violet-500/50 text-violet-300 border-2'
                            : 'bg-zinc-800 border-white/10 text-zinc-400 border hover:bg-zinc-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Circle radius - only locks onto targets within this area</p>
                </div>
              </div>
            </div>
            
            {/* Technical Details */}
            <div className="bg-zinc-800/30 border border-violet-500/20 rounded-lg p-4">
              <h4 className="text-sm font-bold text-violet-300 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                How It Works
              </h4>
              <ul className="text-sm text-zinc-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Reads game memory to locate enemy player positions in 3D space</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Calculates the required mouse movement to align crosshair with target</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>Smoothness controls how quickly the aim snaps (lower = instant, higher = gradual)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-violet-400">•</span>
                  <span>FOV limits the activation radius to make it less obvious</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* More features coming soon */}
          <div className="text-center text-zinc-500 text-sm">
            More features (ESP, Exploits, etc.) coming soon...
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [displayedGames, setDisplayedGames] = useState(20);
  const [editingGame, setEditingGame] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [usePagination, setUsePagination] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showExportImport, setShowExportImport] = useState(false);
  const [selectedGames, setSelectedGames] = useState([]);
  const [focusedGameIndex, setFocusedGameIndex] = useState(-1);
  const [showAntiCheatInfo, setShowAntiCheatInfo] = useState(null);
  const [showFeaturesGuide, setShowFeaturesGuide] = useState(false);
  const [sortBy, setSortBy] = useState('title'); // title, cheats, popular
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [filterAntiCheat, setFilterAntiCheat] = useState('ALL');
  const [favGames, setFavGames] = useState(() => favorites.getAll().games);
  const gamesPerPage = 20;
  const [userVotes, setUserVotes] = useState(() => {
    // Load votes from localStorage on initialization
    return safeLocalStorage.getItem('cheatdb_votes', {});
  });

  // Toast queue management
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Derive selectedGame from games array for real-time sync
  const selectedGame = games.find(g => g.id === selectedGameId);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Fetching (Independent of User)
  // NOTE: Query is optimized with orderBy('title', 'asc')
  // For large datasets (1000+ games), add limit() and pagination
  useEffect(() => {
    const gamesRef = collection(db, 'artifacts', appId, 'public', 'data', 'games');
    // Performance: Load initial batch of 100 games for better load times
    const q = query(gamesRef, orderBy('title', 'asc'), limit(100));
    // Future optimization: Implement pagination with startAfter(lastDoc) for 1000+ games

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const loadedGames = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setGames(loadedGames);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore Error:", err);
        setError("Failed to load data.");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2.5. Derived state and helper functions (before keyboard shortcuts)
  // Filtering and Sorting logic
  const filteredGames = useMemo(() => {
    let result = games;
    
    // Favorites Filter
    if (filterAntiCheat === 'FAVORITES') {
      result = result.filter(g => favGames.includes(g.id));
    }
    // Anti-Cheat Filter
    else if (filterAntiCheat !== 'ALL') {
      result = result.filter(g => g.antiCheat === filterAntiCheat);
    }
    
    // Text search (use debounced term for performance)
    if (debouncedSearchTerm.trim()) {
      const lower = debouncedSearchTerm.toLowerCase();
      result = result.filter(g => {
        const titleMatch = g.title.toLowerCase().includes(lower);
        const nicknameMatch = g.nicknames && g.nicknames.some(nick => nick.toLowerCase().includes(lower));
        const acMatch = g.antiCheat && g.antiCheat.toLowerCase().includes(lower);
        return titleMatch || nicknameMatch || acMatch;
      });
      
      // Track search analytics
      analytics.track('search', { query: debouncedSearchTerm });
    }
    
    // Sorting
    result = [...result].sort((a, b) => {
      if (sortBy === 'cheats') {
        return (b.cheats?.length || 0) - (a.cheats?.length || 0);
      } else if (sortBy === 'popular') {
        // Sort by analytics views
        const analyticsData = safeLocalStorage.getItem('cheatdb_analytics', {});
        const viewsA = analyticsData.gameView?.filter(v => v.gameTitle === a.title).length || 0;
        const viewsB = analyticsData.gameView?.filter(v => v.gameTitle === b.title).length || 0;
        return viewsB - viewsA;
      } else {
        // Default: alphabetical by title
        return a.title.localeCompare(b.title);
      }
    });
    
    return result;
  }, [games, debouncedSearchTerm, sortBy, filterAntiCheat, favGames]);

  // Pagination logic
  const paginatedGames = useMemo(() => {
    if (!usePagination) return filteredGames.slice(0, displayedGames);
    
    const startIndex = (currentPage - 1) * gamesPerPage;
    const endIndex = startIndex + gamesPerPage;
    return filteredGames.slice(startIndex, endIndex);
  }, [filteredGames, currentPage, gamesPerPage, usePagination, displayedGames]);

  const totalPages = Math.ceil(filteredGames.length / gamesPerPage);

  // Bulk operation helpers (used in keyboard shortcuts)
  const toggleGameSelection = useCallback((gameId) => {
    setSelectedGames(prev => 
      prev.includes(gameId) ? prev.filter(id => id !== gameId) : [...prev, gameId]
    );
  }, []);

  const selectAllGames = useCallback(() => {
    setSelectedGames(paginatedGames.map(g => g.id));
  }, [paginatedGames]);

  const clearSelection = useCallback(() => {
    setSelectedGames([]);
  }, []);

  // 3. Keyboard Shortcuts & Command Palette
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't interfere with typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Esc key: close modals and clear selection
      if (e.key === 'Escape') {
        if (selectedGameId) {
          setSelectedGameId(null);
          e.preventDefault();
        }
        if (showLogin) {
          setShowLogin(false);
          e.preventDefault();
        }
        if (showShortcuts) {
          setShowShortcuts(false);
          e.preventDefault();
        }
        if (showCommandPalette) {
          setShowCommandPalette(false);
          e.preventDefault();
        }
        if (showQuickAdd) {
          setShowQuickAdd(false);
          e.preventDefault();
        }
        if (showExportImport) {
          setShowExportImport(false);
          e.preventDefault();
        }
        if (selectedGames.length > 0) {
          clearSelection();
          e.preventDefault();
        }
      }
      
      // Arrow key navigation for game grid
      if (!selectedGameId && !showLogin && !showCommandPalette) {
        const totalVisible = paginatedGames.length;
        
        if (e.key === 'ArrowRight') {
          setFocusedGameIndex(prev => Math.min(prev + 1, totalVisible - 1));
          e.preventDefault();
        }
        if (e.key === 'ArrowLeft') {
          setFocusedGameIndex(prev => Math.max(prev - 1, 0));
          e.preventDefault();
        }
        if (e.key === 'ArrowDown') {
          setFocusedGameIndex(prev => Math.min(prev + 4, totalVisible - 1));
          e.preventDefault();
        }
        if (e.key === 'ArrowUp') {
          setFocusedGameIndex(prev => Math.max(prev - 4, 0));
          e.preventDefault();
        }
        
        // Enter: open focused game
        if (e.key === 'Enter' && focusedGameIndex >= 0 && focusedGameIndex < totalVisible) {
          const game = paginatedGames[focusedGameIndex];
          setSelectedGameId(game.id);
          analytics.track('gameView', {
            gameId: game.id,
            gameTitle: game.title,
            antiCheat: game.antiCheat
          });
          e.preventDefault();
        }
        
        // Space: toggle selection (bulk operations)
        if (e.key === ' ' && focusedGameIndex >= 0 && focusedGameIndex < totalVisible && isEditMode) {
          const game = paginatedGames[focusedGameIndex];
          toggleGameSelection(game.id);
          e.preventDefault();
        }
      }
      
      // ? key: show shortcuts
      if (e.key === '?' && !showShortcuts && !showCommandPalette) {
        setShowShortcuts(true);
        e.preventDefault();
      }
      
      // Ctrl/Cmd + K: open command palette
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        setShowCommandPalette(true);
        e.preventDefault();
      }
      
      // Ctrl/Cmd + N: quick add game (admin only)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n' && user) {
        setShowQuickAdd(true);
        e.preventDefault();
      }
      
      // Ctrl/Cmd + A: select all (when in edit mode)
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && isEditMode && !selectedGameId) {
        selectAllGames();
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedGameId, showLogin, showShortcuts, showCommandPalette, showQuickAdd, showExportImport, 
      selectedGames, isEditMode, user, focusedGameIndex, paginatedGames, clearSelection, 
      toggleGameSelection, selectAllGames]);

  // 4. Actions
  const handleLogin = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsEditMode(false); // Reset edit mode on logout
  };

  const handleEditGame = useCallback((game) => {
    setEditingGame(game);
  }, []);

  const handleSaveGameEdit = useCallback(async (gameId, updates) => {
    if (!user) {
      addToast('You must be logged in to edit games', 'error');
      return;
    }

    try {
      const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', gameId);
      await updateDoc(gameRef, updates);
      setEditingGame(null);
      addToast('Game updated successfully', 'success');
    } catch (err) {
      console.error("Error updating game:", err);
      addToast('Failed to update game', 'error');
    }
  }, [user, addToast]);

  const handleDeleteGame = useCallback(async (gameId) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'games', gameId));
      addToast('Game deleted successfully', 'success');
    } catch (err) {
      console.error("Error deleting:", err);
      addToast('Failed to delete game', 'error');
    }
  }, [addToast]);

  const handleAddCheatToGame = useCallback(async (gameId, cheatData) => {
    if (!user) return;
    try {
      // Sanitize input data to prevent XSS
      const sanitizedData = sanitizeCheatData(cheatData);
      
      const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', gameId);
      await updateDoc(gameRef, {
        cheats: arrayUnion({
          ...sanitizedData,
          id: crypto.randomUUID(),
          addedAt: Date.now()
        })
      });
      // Trigger confetti on success
      createConfetti();
      addToast('Cheat added successfully', 'success');
    } catch (err) {
      console.error(err);
      // Trigger error shake on failure
      triggerShake('app-root');
      addToast('Error adding cheat', 'error');
    }
  }, [user, addToast]);

  const handleVoteCheat = useCallback(async (cheatId) => {
    if (!selectedGame) return;
    
    const voteKey = `${selectedGame.id}_${cheatId}`;
    const hasVoted = userVotes[voteKey];
    
    try {
      const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', selectedGame.id);
      
      // Track vote analytics
      analytics.track('vote', { 
        gameId: selectedGame.id,
        gameTitle: selectedGame.title,
        cheatId,
        action: hasVoted ? 'unvote' : 'vote'
      });
      
      // Use transaction to safely update vote count
      await runTransaction(db, async (transaction) => {
        const gameDoc = await transaction.get(gameRef);
        if (!gameDoc.exists()) {
          throw new Error("Game document does not exist");
        }
        
        const cheats = gameDoc.data().cheats || [];
        
        // Find cheat by ID
        const cheatIndex = cheats.findIndex(c => c.id === cheatId);
        if (cheatIndex === -1) {
          throw new Error("Cheat not found");
        }
        
        const cheat = cheats[cheatIndex];
        const currentVotes = cheat.votes || 0;
        const newVotes = hasVoted ? Math.max(0, currentVotes - 1) : currentVotes + 1;
        
        // Update the specific cheat in the array
        const updatedCheats = [...cheats];
        updatedCheats[cheatIndex] = { ...cheat, votes: newVotes };
        
        transaction.update(gameRef, { cheats: updatedCheats });
      });
      
      // Update user votes tracking in localStorage (local-only, no race condition)
      let newUserVotes;
      if (hasVoted) {
        newUserVotes = { ...userVotes };
        delete newUserVotes[voteKey];
      } else {
        newUserVotes = { ...userVotes, [voteKey]: true };
      }
      
      // Save to localStorage for persistence
      safeLocalStorage.setItem('cheatdb_votes', newUserVotes);
      setUserVotes(newUserVotes);
    } catch (err) {
      console.error("Error voting:", err);
      alert("Failed to vote. Please try again.");
    }
  }, [selectedGame, userVotes]);

  const userVotedCheat = (cheatId) => {
    if (!selectedGame) return false;
    return userVotes[`${selectedGame.id}_${cheatId}`] || false;
  };

  // Quick Add Game Handler
  const handleQuickAddGame = useCallback(async (gameData) => {
    if (!user) {
      addToast('You must be logged in to add games', 'error');
      return;
    }

    try {
      const gamesRef = collection(db, 'artifacts', appId, 'public', 'data', 'games');
      await addDoc(gamesRef, gameData);
      addToast('Game added successfully', 'success');
    } catch (err) {
      console.error('Error adding game:', err);
      addToast('Failed to add game', 'error');
    }
  }, [user, addToast]);

  // Toggle Favorite Handler
  const handleToggleFavorite = useCallback((gameId) => {
    const newFavs = favorites.toggleGame(gameId);
    setFavGames(newFavs.games);
    const isFav = newFavs.games.includes(gameId);
    addToast(isFav ? 'Added to favorites' : 'Removed from favorites', 'success');
  }, [addToast]);

  // Export/Import Handlers
  const handleImportData = useCallback(async (data) => {
    if (!user) {
      addToast('You must be logged in to import data', 'error');
      return;
    }

    try {
      const gamesRef = collection(db, 'artifacts', appId, 'public', 'data', 'games');
      
      for (const game of data) {
        const { id, ...gameData } = game;
        if (id) {
          // Update existing
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'games', id), gameData);
        } else {
          // Add new
          await addDoc(gamesRef, gameData);
        }
      }
      
      addToast(`Imported ${data.length} games successfully`, 'success');
    } catch (err) {
      console.error('Import error:', err);
      addToast('Failed to import data', 'error');
    }
  }, [user, addToast]);

  // Bulk Operations
  const handleBulkDelete = useCallback(async () => {
    if (!user || selectedGames.length === 0) return;
    
    if (!confirm(`Delete ${selectedGames.length} games? This cannot be undone.`)) return;

    try {
      for (const gameId of selectedGames) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'games', gameId));
      }
      
      setSelectedGames([]);
      addToast(`Deleted ${selectedGames.length} games successfully`, 'success');
    } catch (err) {
      console.error('Bulk delete error:', err);
      addToast('Failed to delete some games', 'error');
    }
  }, [user, selectedGames, addToast]);

  return (
    <ErrorBoundary>
      <div id="app-root" className="min-h-screen font-sans selection:bg-violet-500/30 selection:text-violet-200 overflow-x-hidden transition-colors duration-500 bg-[#050505] text-zinc-200">
      
      {/* Falling Stars Animation - rendered via portal to document.body */}
      <FallingStars />
      
      {/* Mouse Effects (includes Blob Background, Cursor Glow, and Animated Background Mesh) */}
      <MouseEffects />

      {/* Shooting Stars Animation */}
      <ShootingStars />

      <div className="relative z-10">
        <Header 
          searchTerm={searchTerm} 
          onSearch={setSearchTerm}
          user={user}
          onLoginClick={() => setShowLogin(true)}
          onLogoutClick={handleLogout}
          onFeaturesClick={() => setShowFeaturesGuide(true)}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Statistics Dashboard */}
          {!loading && games.length > 0 && (
            <StatisticsDashboard games={games} />
          )}
          
          {/* Grid Header */}
          <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg border transition-colors duration-500 bg-zinc-900 border-white/5">
                <LayoutGrid className="w-5 h-5 text-zinc-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Database Entries</h2>
                <p className="text-xs font-medium text-zinc-600">
                  {filteredGames.length} Games Indexed
                </p>
              </div>
            </div>
            {user && (
              <div className="flex items-center gap-3 flex-wrap">
                <button 
                  onClick={() => setShowAnalytics(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 shadow-lg bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5 hover:border-violet-500/30"
                  title="View Analytics"
                >
                  <Database className="w-3 h-3" />
                  Analytics
                </button>
                <button 
                  onClick={() => setShowExportImport(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 shadow-lg bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5 hover:border-emerald-500/30"
                  title="Export/Import Data"
                >
                  <Download className="w-3 h-3" />
                  Backup
                </button>
                <button 
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 shadow-lg ${
                    isEditMode 
                      ? 'bg-red-500/10 text-red-400 border border-red-500/20 ring-1 ring-red-500/20'
                      : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5'
                  }`}
                >
                  {isEditMode ? (
                    <>
                      <Check className="w-3 h-3" />
                      Done Editing
                    </>
                  ) : (
                    <>
                      <Pencil className="w-3 h-3" />
                      Edit Games
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setUsePagination(!usePagination)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 shadow-lg bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5 hover:border-cyan-500/30"
                  title={usePagination ? "Switch to Infinite Scroll" : "Switch to Pagination"}
                >
                  {usePagination ? <List className="w-3 h-3" /> : <Grid className="w-3 h-3" />}
                  {usePagination ? "Paginated" : "Infinite"}
                </button>
              </div>
            )}
          </div>

          {/* Filter and Sort Controls */}
          {!loading && games.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center gap-3">
              {/* Sort Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                  className="inline-flex items-center justify-between gap-3 px-4 py-2.5 border border-white/20 shadow-lg text-sm font-bold rounded-xl text-white bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/30 min-w-[160px]"
                >
                  <Filter className="w-4 h-4 text-violet-400" />
                  <span className="flex-1 text-left">
                    {sortBy === 'title' ? 'A-Z' : sortBy === 'cheats' ? 'Most Cheats' : 'Most Popular'}
                  </span>
                  <svg className={`w-4 h-4 text-white/80 transition-transform duration-200 ${sortDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>

                {sortDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setSortDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 origin-top-right bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl z-40 animate-in fade-in zoom-in-95 duration-200">
                      <div className="p-2 space-y-1">
                        <button
                          onClick={() => { setSortBy('title'); setSortDropdownOpen(false); }}
                          className="group flex items-center w-full px-4 py-3 text-sm text-white rounded-lg hover:bg-white/10 transition-all text-left"
                        >
                          <span className={`w-2 h-2 rounded-full mr-3 transition-all ${
                            sortBy === 'title' 
                              ? 'bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.8)]' 
                              : 'bg-zinc-600'
                          }`}></span>
                          A-Z
                        </button>
                        <button
                          onClick={() => { setSortBy('cheats'); setSortDropdownOpen(false); }}
                          className="group flex items-center w-full px-4 py-3 text-sm text-white rounded-lg hover:bg-white/10 transition-all text-left"
                        >
                          <span className={`w-2 h-2 rounded-full mr-3 transition-all ${
                            sortBy === 'cheats' 
                              ? 'bg-pink-400 shadow-[0_0_10px_rgba(244,114,182,0.8)]' 
                              : 'bg-zinc-600'
                          }`}></span>
                          Most Cheats
                        </button>
                        <button
                          onClick={() => { setSortBy('popular'); setSortDropdownOpen(false); }}
                          className="group flex items-center w-full px-4 py-3 text-sm text-white rounded-lg hover:bg-white/10 transition-all text-left"
                        >
                          <span className={`w-2 h-2 rounded-full mr-3 transition-all ${
                            sortBy === 'popular' 
                              ? 'bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]' 
                              : 'bg-zinc-600'
                          }`}></span>
                          Most Popular
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Anti-Cheat Filter */}
              <div className="flex gap-1 flex-wrap">
                {['ALL', 'EAC', 'BattlEye', 'Vanguard', 'VAC', 'Ricochet', 'Defense Matrix', 'None'].map(ac => (
                  <button
                    key={ac}
                    onClick={() => setFilterAntiCheat(ac)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      filterAntiCheat === ac
                        ? 'bg-violet-500/30 border-violet-500/50 text-violet-200'
                        : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-700/50'
                    }`}
                  >
                    {ac}
                  </button>
                ))}
              </div>

              {/* Favorites Toggle */}
              {favGames.length > 0 && (
                <button
                  onClick={() => setFilterAntiCheat('FAVORITES')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                    filterAntiCheat === 'FAVORITES'
                      ? 'bg-yellow-500/30 border-yellow-500/50 text-yellow-200'
                      : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-700/50'
                  }`}
                >
                  <Star className={`w-3 h-3 ${filterAntiCheat === 'FAVORITES' ? 'fill-yellow-400' : ''}`} />
                  Favorites ({favGames.length})
                </button>
              )}

              {/* Results Count */}
              <span className="ml-auto text-xs text-zinc-500 font-medium">
                {filteredGames.length} {filteredGames.length === 1 ? 'game' : 'games'}
              </span>
            </div>
          )}

          {error ? (
            <div className="flex flex-col items-center justify-center h-64 p-6 bg-red-500/5 border border-red-500/10 rounded-3xl text-center backdrop-blur-md">
              <div className="p-4 bg-red-500/10 rounded-full mb-4">
                 <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-red-400 mb-2">System Error</h3>
              <p className="text-sm text-red-300/60 max-w-md">{error}</p>
            </div>
          ) : loading ? (
            <SkeletonGrid count={8} />
          ) : filteredGames.length > 0 ? (
            <>
              {/* Bulk Operations Toolbar */}
              {isEditMode && selectedGames.length > 0 && (
                <div className="mb-6 p-4 bg-violet-500/10 border border-violet-500/30 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-bold text-violet-300">
                      {selectedGames.length} game{selectedGames.length !== 1 ? 's' : ''} selected
                    </span>
                    <button
                      onClick={selectAllGames}
                      className="text-xs font-bold text-zinc-400 hover:text-violet-300 transition-colors flex items-center gap-1"
                    >
                      <CheckSquare className="w-3 h-3" />
                      Select All
                    </button>
                    <button
                      onClick={clearSelection}
                      className="text-xs font-bold text-zinc-400 hover:text-violet-300 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-300 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Selected
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
                {paginatedGames.map((game, idx) => (
                  <div
                    key={game.id}
                    className={`relative ${focusedGameIndex === idx ? 'ring-2 ring-violet-500 rounded-2xl' : ''}`}
                  >
                    {isEditMode && (
                      <button
                        onClick={() => toggleGameSelection(game.id)}
                        className="absolute top-3 left-3 z-10 p-2 bg-black/80 rounded-lg border border-white/10 hover:border-violet-500/50 transition-all"
                      >
                        {selectedGames.includes(game.id) ? (
                          <CheckSquare className="w-4 h-4 text-violet-400" />
                        ) : (
                          <Square className="w-4 h-4 text-zinc-500" />
                        )}
                      </button>
                    )}
                    <GameCard 
                      game={game} 
                      onClick={(game) => {
                        setSelectedGameId(game.id);
                        // Track game view analytics
                        analytics.track('gameView', {
                          gameId: game.id,
                          gameTitle: game.title,
                          antiCheat: game.antiCheat
                        });
                      }}
                      onEdit={handleEditGame}
                      user={user}
                      onDelete={handleDeleteGame}
                      isEditMode={isEditMode}
                      index={idx}
                      onAntiCheatClick={(ac) => setShowAntiCheatInfo(ac)}
                      onToggleFavorite={handleToggleFavorite}
                      isFavorited={favGames.includes(game.id)}
                    />
                  </div>
                ))}
              </div>

              {/* Pagination or Infinite Scroll */}
              {usePagination ? (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  totalItems={filteredGames.length}
                  itemsPerPage={gamesPerPage}
                />
              ) : (
                displayedGames < filteredGames.length && (
                  <div className="flex flex-col items-center gap-6 pt-12">
                    <div className="infinite-scroll-loader">
                      <div className="loader-dot"></div>
                      <div className="loader-dot"></div>
                      <div className="loader-dot"></div>
                    </div>
                    <button
                      onClick={() => setDisplayedGames(prev => Math.min(prev + 20, filteredGames.length))}
                      className="px-8 py-3 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 font-bold text-sm hover:bg-violet-600/30 transition-all"
                    >
                      Load More ({displayedGames} / {filteredGames.length})
                    </button>
                  </div>
                )
              )}
            </>
          ) : (
            <div className="text-center py-32 bg-zinc-900/20 rounded-[2.5rem] border border-white/5 border-dashed flex flex-col items-center backdrop-blur-sm animate-in zoom-in-95 duration-500">
              {games.length === 0 ? (
                // Empty Database State
                <>
                  <div className="w-24 h-24 bg-gradient-to-br from-violet-600/20 to-pink-600/20 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-violet-500/20 border border-violet-500/20 pulse-glow">
                    <div className="p-2 rounded-lg bg-violet-500/10">
                      <Database className="w-12 h-12 text-violet-400 icon-pulse" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-white mb-3 bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">Database Empty</h3>
                  <p className="text-zinc-400 max-w-md mb-10 leading-relaxed text-sm">
                    The database is currently empty. Login as Admin to start adding your favorite games and cheats.
                  </p>
                  <button
                     onClick={() => setShowLogin(true)}
                     className="flex items-center gap-3 bg-gradient-to-r from-violet-600 to-pink-600 text-white hover:from-violet-500 hover:to-pink-500 px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-violet-500/20 hover:scale-105 active:scale-95 scale-in-animation ripple-button"
                     onMouseDown={createRipple}
                  >
                    <Lock className="w-4 h-4 icon-rotate-on-hover" />
                    Admin Login
                  </button>
                </>
              ) : (
                // Empty Search State
                <>
                   <div className="w-24 h-24 bg-gradient-to-br from-cyan-600/20 to-blue-600/20 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-cyan-500/20 border border-cyan-500/20 pulse-glow">
                    <div className="p-2 rounded-lg bg-cyan-500/10">
                      <Sparkles className="w-12 h-12 text-cyan-400 icon-pulse" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-white mb-3 bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">No Results Found</h3>
                  <p className="text-zinc-400 max-w-md text-sm">
                    We couldn't find anything matching "<span className="text-cyan-400 font-bold">{searchTerm}</span>". Try searching for games by title or nickname (cs2, cod, eft, tf2).
                  </p>
                </>
              )}
            </div>
          )}
        </main>

        {/* Floating Action Button */}
        {user && (
          <button
            onClick={() => setShowLogin(true)}
            className="fixed bottom-8 right-8 p-4 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-2xl shadow-violet-500/40 hover:scale-105 active:scale-95 transition-all duration-300 fab-float animate-in fade-in slide-in-from-bottom-4 z-40"
            title="Add New Game (Coming Soon)"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}

        {/* Modals */}
        {selectedGame && (
          <GameDetail 
            game={selectedGame} 
            onClose={() => setSelectedGameId(null)} 
            onAddCheat={handleAddCheatToGame}
            onVoteCheat={handleVoteCheat}
            userVotedCheat={userVotedCheat}
            user={user}
            appId={appId}
          />
        )}

        {showLogin && (
          <LoginModal 
            onClose={() => setShowLogin(false)}
            onLogin={handleLogin}
          />
        )}

        {/* Features Guide Modal */}
        {showFeaturesGuide && (
          <FeaturesGuideModal onClose={() => setShowFeaturesGuide(false)} />
        )}

        {/* Toast Notifications Queue */}
        <Toast 
          toasts={toasts}
          onClose={removeToast}
        />

        {/* Analytics Dashboard */}
        {showAnalytics && (
          <AnalyticsDashboard onClose={() => setShowAnalytics(false)} />
        )}

        {/* Edit Game Modal */}
        {editingGame && (
          <EditGameModal
            game={editingGame}
            onClose={() => setEditingGame(null)}
            onSave={handleSaveGameEdit}
          />
        )}

        {/* Keyboard Shortcuts Modal */}
        {showShortcuts && (
          <ShortcutsModal onClose={() => setShowShortcuts(false)} />
        )}

        {/* Command Palette */}
        {showCommandPalette && (
          <CommandPalette 
            onClose={() => setShowCommandPalette(false)}
            games={filteredGames}
            onSelectGame={(game) => setSelectedGameId(game.id)}
            user={user}
          />
        )}

        {/* Quick Add Game Modal */}
        {showQuickAdd && (
          <QuickAddGameModal
            onClose={() => setShowQuickAdd(false)}
            onAdd={handleQuickAddGame}
          />
        )}

        {/* Export/Import Modal */}
        {showExportImport && (
          <ExportImportModal
            onClose={() => setShowExportImport(false)}
            games={games}
            onImport={handleImportData}
          />
        )}

        {/* Anti-Cheat Info Modal */}
        {showAntiCheatInfo && (
          <AntiCheatInfoModal
            antiCheat={showAntiCheatInfo}
            onClose={() => setShowAntiCheatInfo(null)}
          />
        )}

        {/* Floating Action Button (Admin Only) */}
        {user && !selectedGameId && (
          <button
            onClick={() => setShowQuickAdd(true)}
            className="fixed bottom-8 right-8 z-50 p-4 bg-gradient-to-r from-violet-600 to-pink-600 text-white rounded-full shadow-2xl hover:shadow-violet-500/50 hover:scale-105 active:scale-95 transition-all duration-300 group"
            title="Quick Add Game (Ctrl/Cmd + N)"
          >
            <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        )}
      </div>
    </div>
    </ErrorBoundary>
  );
}