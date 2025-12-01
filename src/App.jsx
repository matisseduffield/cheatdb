import React, { useState, useEffect, useMemo } from 'react';
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
  updateDoc,
  deleteDoc,
  doc,
  arrayUnion,
  addDoc,
  serverTimestamp
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
  Sparkles
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyBKlRLMFGn2zQJT3bYRykTuSne4TvQU4Y4",
  authDomain: "cheatsdatabase.firebaseapp.com",
  projectId: "cheatsdatabase",
  storageBucket: "cheatsdatabase.firebasestorage.app",
  messagingSenderId: "885527786972",
  appId: "1:885527786972:web:dc6dd624a9b82fb4340b19"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'cheatdb-games-v2';

// --- New Component: Animated Background Mesh ---
const AnimatedBackgroundMesh = ({ mousePos }) => {
  const getOrbPosition = (baseX, baseY, intensity = 1) => {
    const offset = 40 * intensity;
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
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 92, 246, 0.03) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
};

// --- New Component: Animated Counter ---
const AnimatedCounter = ({ value, label, icon: Icon, color = 'violet' }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (displayValue === value) return;

    const duration = 1000;
    const start = Date.now();
    const startValue = displayValue;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - start) / duration, 1);
      const current = Math.floor(startValue + (value - startValue) * progress);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, displayValue]);

  const colorClasses = {
    violet: 'text-violet-400',
    blue: 'text-blue-400',
    emerald: 'text-emerald-400',
    rose: 'text-rose-400',
    amber: 'text-amber-400',
  };

  return (
    <div className="flex flex-col items-center p-6 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all duration-300 group">
      <div className={`p-3 rounded-xl bg-${color}-500/10 mb-3 group-hover:scale-110 transition-transform`}>
        <Icon className={`w-6 h-6 ${colorClasses[color]}`} />
      </div>
      <div className={`text-3xl font-bold ${colorClasses[color]} mb-1`}>
        {displayValue}
      </div>
      <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
};

// --- New Component: Statistics Dashboard ---
const StatisticsDashboard = ({ games, isDarkMode }) => {
  const totalGames = games.length;
  const totalCheats = games.reduce((sum, game) => sum + (game.cheats?.length || 0), 0);
  
  const antiCheatBreakdown = games.reduce((acc, game) => {
    const ac = game.antiCheat || 'Unknown';
    acc[ac] = (acc[ac] || 0) + 1;
    return acc;
  }, {});

  const antiCheatStats = [
    { name: 'EAC', count: antiCheatBreakdown['EAC'] || 0, color: 'blue' },
    { name: 'BattlEye', count: antiCheatBreakdown['BattlEye'] || 0, color: 'amber' },
    { name: 'Vanguard', count: antiCheatBreakdown['Vanguard'] || 0, color: 'rose' },
    { name: 'VAC', count: antiCheatBreakdown['VAC'] || 0, color: 'emerald' },
    { name: 'Ricochet', count: antiCheatBreakdown['Ricochet'] || 0, color: 'violet' },
    { name: 'None', count: antiCheatBreakdown['None'] || 0, color: 'zinc' },
  ];

  return (
    <div className={`mb-12 p-8 rounded-3xl border backdrop-blur-sm transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-zinc-900/20 to-zinc-900/10 border-white/10' 
        : 'bg-gradient-to-br from-neutral-800/15 to-neutral-800/5 border-neutral-700/20'
    }`}>
      <div className={`mb-8 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
        <h2 className="text-2xl font-black mb-2">Database Statistics</h2>
        <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
          Real-time analytics of your cheat database
        </p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <AnimatedCounter value={totalGames} label="Total Games" icon={Gamepad2} color="violet" />
        <AnimatedCounter value={totalCheats} label="Total Cheats" icon={Zap} color="amber" />
      </div>

      {/* Anti-Cheat Breakdown */}
      <div>
        <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
          Anti-Cheat Distribution
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {antiCheatStats.map((stat) => (
            <div
              key={stat.name}
              className={`flex flex-col items-center p-4 rounded-xl border transition-all duration-300 ${
                isDarkMode
                  ? 'bg-white/5 border-white/10 hover:border-white/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className={`text-lg font-bold mb-1 ${
                stat.color === 'blue' ? (isDarkMode ? 'text-blue-400' : 'text-blue-600') :
                stat.color === 'amber' ? (isDarkMode ? 'text-amber-400' : 'text-amber-600') :
                stat.color === 'rose' ? (isDarkMode ? 'text-rose-400' : 'text-rose-600') :
                stat.color === 'emerald' ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600') :
                stat.color === 'violet' ? (isDarkMode ? 'text-violet-400' : 'text-violet-600') :
                isDarkMode ? 'text-zinc-400' : 'text-slate-500'
              }`}>
                {stat.count}
              </div>
              <div className={`text-xs font-semibold uppercase tracking-wider ${
                isDarkMode ? 'text-zinc-500' : 'text-slate-500'
              }`}>
                {stat.name}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- New Component: Particle Effect ---
const ParticleEffect = ({ x, y }) => {
  const particles = Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    angle: (i / 8) * Math.PI * 2,
  }));

  return (
    <>
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="pointer-events-none fixed w-1 h-1 bg-violet-400 rounded-full"
          style={{
            left: `${x}px`,
            top: `${y}px`,
            animation: `particle-rise 1s ease-out forwards`,
            '--tx': `${Math.cos(particle.angle) * 50}px`,
            animationDelay: `${particle.id * 50}ms`,
          }}
        />
      ))}
    </>
  );
};
const CursorGlow = ({ onMouseMove, isDarkMode = true }) => {
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
          animation: pulse-scale 2s ease-in-out infinite;
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
          filter: isDarkMode 
            ? `drop-shadow(0 0 30px rgba(139, 92, 246, 0.6))`
            : `drop-shadow(0 0 30px rgba(59, 130, 246, 0.4))`,
          zIndex: 0,
        }}
      >
        {/* Outer rippling bubble */}
        <div
          className="bubble-ripple-fast absolute inset-0 rounded-full blur-2xl opacity-60"
          style={{
            backgroundColor: isDarkMode ? 'rgb(139, 92, 246)' : 'rgb(59, 130, 246)',
            transform: `rotate(${angle}deg) scale(1.1)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
        
        {/* Middle glow layer */}
        <div
          className="bubble-ripple absolute inset-0 rounded-full blur-xl opacity-50"
          style={{
            background: isDarkMode 
              ? 'linear-gradient(135deg, rgb(167, 139, 250) to rgb(232, 121, 250))'
              : 'linear-gradient(135deg, rgb(96, 165, 250) to rgb(96, 165, 250))',
            transform: `rotate(${angle * 0.7}deg) scale(0.95)`,
            transition: 'transform 0.3s ease-out',
          }}
        />
        
        {/* Inner bright core - solid bubble */}
        <div
          className="bubble-ripple-fast absolute inset-6 rounded-full blur-lg opacity-60"
          style={{
            background: isDarkMode
              ? 'linear-gradient(135deg, rgb(196, 181, 253) to rgb(243, 194, 231))'
              : 'linear-gradient(135deg, rgb(147, 197, 253) to rgb(191, 219, 254))',
            boxShadow: 'inset 0 -20px 40px rgba(0, 0, 0, 0.2), inset 0 20px 40px rgba(255, 255, 255, 0.4)',
            transform: `scale(0.9)`,
            animation: 'ripple-wave 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) infinite 0.2s',
          }}
        />
        
        {/* Outer border with ripple */}
        <div
          className="bubble-ripple absolute inset-0 rounded-full border-2"
          style={{
            borderColor: isDarkMode ? 'rgb(196, 181, 253)' : 'rgb(147, 197, 253)',
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

// --- Components ---

const Header = ({ onSearch, searchTerm, user, onLoginClick, onLogoutClick, isDarkMode, onThemeChange }) => (
  <header className={`sticky top-0 z-50 border-b transition-all duration-500 ${
    isDarkMode
      ? 'border-white/5 bg-black/40 backdrop-blur-2xl supports-[backdrop-filter]:bg-black/20'
      : 'border-slate-200 bg-white/40 backdrop-blur-2xl supports-[backdrop-filter]:bg-white/20'
  }`}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-24 gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0 cursor-pointer group" onClick={() => window.location.reload()}>
          <div className="relative">
            <div className="absolute inset-0 bg-violet-600 blur-xl opacity-20 group-hover:opacity-60 transition-opacity duration-500 rounded-full animate-pulse"></div>
            <div className="relative bg-zinc-900/80 p-3 rounded-2xl border border-white/10 group-hover:border-violet-500/50 transition-all duration-300 shadow-xl shadow-black/50">
              <Gamepad2 className="w-6 h-6 text-violet-400 group-hover:text-white transition-colors" />
            </div>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-3xl font-black tracking-tighter text-white drop-shadow-lg">
              CHEAT<span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">DB</span>
            </h1>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] pl-1">
              v2.0 // Database
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
            <Search className="h-5 w-5 text-zinc-500 group-focus-within:text-violet-400 transition-colors duration-300" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 pr-4 py-4 bg-zinc-900/40 border border-white/5 rounded-2xl leading-5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:bg-zinc-900/80 focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 focus:shadow-[0_0_30px_-5px_rgba(139,92,246,0.2)] sm:text-sm transition-all duration-300 backdrop-blur-sm"
            placeholder="Search database..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        {/* Admin / Login Button */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            onClick={onThemeChange}
            className="p-3 bg-zinc-900/50 border border-white/5 rounded-xl text-zinc-500 hover:text-amber-400 hover:bg-zinc-800 hover:border-amber-500/20 transition-all duration-300"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? '☀️' : '🌙'}
          </button>

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

const AntiCheatBadge = ({ ac, isDarkMode = true }) => {
  const styles = isDarkMode ? {
    'EAC': 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_-4px_rgba(59,130,246,0.3)]',
    'BattlEye': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_10px_-4px_rgba(234,179,8,0.3)]',
    'Vanguard': 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_-4px_rgba(239,68,68,0.3)]',
    'VAC': 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_10px_-4px_rgba(34,197,94,0.3)]',
    'Ricochet': 'bg-purple-500/10 text-purple-400 border-purple-500/20 shadow-[0_0_10px_-4px_rgba(168,85,247,0.3)]',
    'None': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  } : {
    'EAC': 'bg-blue-200/60 text-blue-900 border-blue-300 shadow-[0_0_10px_-4px_rgba(59,130,246,0.15)]',
    'BattlEye': 'bg-yellow-200/60 text-yellow-900 border-yellow-300 shadow-[0_0_10px_-4px_rgba(234,179,8,0.15)]',
    'Vanguard': 'bg-red-200/60 text-red-900 border-red-300 shadow-[0_0_10px_-4px_rgba(239,68,68,0.15)]',
    'VAC': 'bg-green-200/60 text-green-900 border-green-300 shadow-[0_0_10px_-4px_rgba(34,197,94,0.15)]',
    'Ricochet': 'bg-purple-200/60 text-purple-900 border-purple-300 shadow-[0_0_10px_-4px_rgba(168,85,247,0.15)]',
    'None': 'bg-amber-200/60 text-amber-900 border-amber-300',
  };
  
  const acName = ac || 'Unknown';
  
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md ${styles[acName] || styles.None}`}>
      {acName}
    </span>
  );
};

const GameCard = ({ game, onClick, user, onDelete, isEditMode, index, isDarkMode }) => (
  <div 
    onClick={() => onClick(game)}
    className={`group relative rounded-3xl p-6 transition-all duration-500 cursor-pointer hover:-translate-y-2 overflow-hidden backdrop-blur-sm card-bounce-enter border ${
      isDarkMode
        ? 'bg-zinc-900/30 hover:bg-zinc-900/60 border-white/5 hover:border-violet-500/40'
        : 'bg-white/40 hover:bg-white/60 border-slate-200 hover:border-violet-300'
    }`}
    style={{ animationDelay: `${index * 50}ms` }}
  >
    {/* Animated Gradient Background on Hover */}
    <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-fuchsia-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    
    <div className="relative z-10 flex flex-col h-full">
      <div className="flex justify-between items-start mb-5">
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl border shadow-inner group-hover:scale-110 transition-transform duration-300 ${
            isDarkMode
              ? 'bg-black/40 border-white/5'
              : 'bg-white/40 border-slate-300'
          }`}>
            <ShieldAlert className={`w-5 h-5 transition-colors icon-pulse ${
              isDarkMode
                ? 'text-zinc-400 group-hover:text-violet-400'
                : 'text-slate-600 group-hover:text-violet-600'
            }`} />
          </div>
          <AntiCheatBadge ac={game.antiCheat} isDarkMode={isDarkMode} />
        </div>
        
        {/* DELETE BUTTON (Admin Only + Edit Mode) */}
        {user && isEditMode && (
          <button
            onClick={(e) => {
              e.stopPropagation(); 
              onDelete(game.id);
            }}
            className="p-2 text-red-400 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300 rounded-xl transition-all border border-red-500/20 hover:scale-110 shadow-lg shadow-red-500/10 animate-in zoom-in duration-200"
            title="Delete Game"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      
      <h3 className={`text-2xl font-black mb-2 leading-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r transition-all ${
        isDarkMode
          ? 'text-white group-hover:from-white group-hover:to-violet-200'
          : 'text-amber-950 group-hover:from-amber-950 group-hover:to-violet-700'
      }`}>
        {game.title}
      </h3>
      
      <div className="flex items-center gap-2 mb-8">
        <span className={`text-xs font-medium px-2 py-1 rounded-md border flex items-center gap-1.5 transition-colors ${
          isDarkMode
            ? 'text-zinc-500 bg-zinc-800/50 border-white/5 group-hover:border-violet-500/20'
            : 'text-amber-900 bg-amber-200/60 border-amber-300 group-hover:border-violet-400/50'
        }`}>
          <Zap className={`w-3 h-3 ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`} />
          {game.cheats?.length || 0} Cheats
        </span>
      </div>

      <div className={`mt-auto pt-5 border-t flex items-center justify-between text-sm transition-colors ${
        isDarkMode
          ? 'border-white/5 text-zinc-500 group-hover:text-violet-300'
          : 'border-amber-200/60 text-amber-800 group-hover:text-violet-600'
      }`}>
        <span className="text-xs font-bold uppercase tracking-wider">Access Database</span>
        <div className={`p-1.5 rounded-full transition-colors ${
          isDarkMode
            ? 'bg-white/5 group-hover:bg-violet-500/20'
            : 'bg-slate-200 group-hover:bg-violet-200'
        }`}>
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </div>
  </div>
);

const LoginModal = ({ onClose, onLogin, isDarkMode = true }) => {
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
      <div className={`absolute inset-0 backdrop-blur-md transition-opacity duration-300 ${
        isDarkMode ? 'bg-black/60' : 'bg-white/40'
      }`} onClick={onClose} />
      <div className={`relative w-full max-w-sm rounded-3xl shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-300 ring-1 border transition-colors ${
        isDarkMode
          ? 'bg-[#0a0a0a] border-white/10 ring-white/10'
          : 'bg-amber-50 border-amber-200 ring-amber-200/30'
      }`}>
        
        <div className={`absolute top-0 inset-x-0 h-px bg-gradient-to-r ${
          isDarkMode
            ? 'from-transparent via-violet-500/50 to-transparent'
            : 'from-transparent via-violet-400/40 to-transparent'
        }`}></div>
        
        <h2 className={`text-2xl font-black mb-6 flex items-center gap-3 ${
          isDarkMode ? 'text-white' : 'text-amber-950'
        }`}>
          <div className={`p-2 rounded-xl transition-colors ${
            isDarkMode
              ? 'bg-violet-500/10'
              : 'bg-amber-200/60'
          }`}>
             <Lock className={`w-6 h-6 ${isDarkMode ? 'text-violet-500' : 'text-amber-900'}`} />
          </div>
          Admin Access
        </h2>
        {error && (
          <div className={`mb-6 p-4 rounded-2xl text-sm flex items-center gap-2 border transition-colors ${
            isDarkMode
              ? 'bg-red-500/5 border-red-500/10 text-red-400'
              : 'bg-red-100/50 border-red-300 text-red-700'
          }`}>
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 transition-colors ${
              isDarkMode ? 'text-zinc-500' : 'text-amber-900'
            }`}>Email</label>
            <input 
              type="email" 
              required
              className={`w-full rounded-xl px-4 py-3 outline-none transition-all focus:ring-1 border ${
                isDarkMode
                  ? 'bg-zinc-900/50 border-white/10 text-white focus:ring-violet-500 focus:bg-zinc-900'
                  : 'bg-amber-100/50 border-amber-200 text-amber-950 focus:ring-violet-500 focus:bg-amber-100/70'
              }`}
              placeholder="admin@cheatdb.org"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 transition-colors ${
              isDarkMode ? 'text-zinc-500' : 'text-amber-900'
            }`}>Password</label>
            <input 
              type="password" 
              required
              className={`w-full rounded-xl px-4 py-3 outline-none transition-all focus:ring-1 border ${
                isDarkMode
                  ? 'bg-zinc-900/50 border-white/10 text-white focus:ring-violet-500 focus:bg-zinc-900'
                  : 'bg-amber-100/50 border-amber-200 text-amber-950 focus:ring-violet-500 focus:bg-amber-100/70'
              }`}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full text-white font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98] ${
              isDarkMode
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-lg shadow-violet-500/20'
                : 'bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 shadow-lg shadow-violet-300/20'
            }`}
          >
            {loading ? 'Verifying...' : 'Unlock Database'}
          </button>
        </form>
      </div>
    </div>
  );
};

const GameDetail = ({ game, onClose, onAddCheat, user, isDarkMode = true }) => {
  const [newCheat, setNewCheat] = useState({ code: '', effect: '' });
  const [isAdding, setIsAdding] = useState(false);
  const [particles, setParticles] = useState([]);

  const handleAddCheat = async (e) => {
    e.preventDefault();
    if (!newCheat.code || !newCheat.effect) return;
    await onAddCheat(game.id, newCheat);
    setNewCheat({ code: '', effect: '' });
    setIsAdding(false);
  };

  const handleCopyCode = (code, e) => {
    navigator.clipboard.writeText(code);
    
    // Create particle effect at click position
    const newParticle = {
      id: Date.now(),
      x: e.clientX,
      y: e.clientY,
    };
    setParticles([...particles, newParticle]);
    
    // Remove particle after animation
    setTimeout(() => {
      setParticles(p => p.filter(particle => particle.id !== newParticle.id));
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-xl transition-opacity duration-300" 
        onClick={onClose}
      />
      <div className="relative rounded-[2rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-300 w-full max-w-4xl max-h-[90vh] ring-1 border transition-colors" style={{
        backgroundColor: isDarkMode ? '#0a0a0a' : 'rgba(251, 245, 235, 0.98)',
        borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(217, 119, 6, 0.2)',
        ringColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(217, 119, 6, 0.1)',
      }}>
        
        {/* Particles */}
        {particles.map(particle => (
          <ParticleEffect key={particle.id} x={particle.x} y={particle.y} />
        ))}
        
        {/* Header */}
        <div className={`flex items-start justify-between px-8 py-8 border-b transition-colors ${
          isDarkMode
            ? 'border-white/5 bg-gradient-to-b from-zinc-900/50 to-transparent'
            : 'border-orange-200 bg-gradient-to-b from-orange-100/40 to-transparent'
        }`}>
          <div>
            <div className="flex items-center gap-3 mb-3">
              <AntiCheatBadge ac={game.antiCheat} isDarkMode={isDarkMode} />
              <div className={`h-1 w-1 rounded-full ${isDarkMode ? 'bg-zinc-700' : 'bg-slate-400'}`}></div>
              <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                isDarkMode ? 'text-zinc-500' : 'text-slate-600'
              }`}>Database Entry</span>
            </div>
            <h2 className={`text-4xl sm:text-5xl font-black tracking-tighter mb-2 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>{game.title}</h2>
          </div>
          <button 
            onClick={onClose}
            className={`p-3 rounded-full transition-all hover:rotate-90 duration-300 ${
              isDarkMode
                ? 'text-zinc-400 hover:bg-white/5 hover:text-white'
                : 'text-slate-600 hover:bg-slate-300 hover:text-slate-900'
            }`}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className={`flex-1 overflow-y-auto p-8 custom-scrollbar transition-colors ${
          isDarkMode ? 'bg-[#0a0a0a]' : 'bg-amber-50/50'
        }`}>
          
          {/* Add Cheat Form - ONLY VISIBLE IF LOGGED IN */}
          {user && (
            <>
              {!isAdding ? (
                <button 
                  onClick={() => setIsAdding(true)}
                  className={`w-full mb-8 py-4 border border-dashed rounded-2xl hover:transition-all text-sm font-bold uppercase tracking-wide flex items-center justify-center gap-2 group ${
                    isDarkMode
                      ? 'border-zinc-800 text-zinc-500 hover:text-violet-400 hover:border-violet-500/30 hover:bg-violet-500/5'
                      : 'border-amber-300 text-amber-800 hover:text-violet-600 hover:border-violet-400 hover:bg-violet-100/15'
                  }`}
                >
                  <div className={`p-1 rounded-md transition-colors ${
                    isDarkMode
                      ? 'bg-zinc-800 group-hover:bg-violet-500/20'
                      : 'bg-neutral-700/40 group-hover:bg-violet-500/30'
                  }`}>
                    <Plus className="w-4 h-4" />
                  </div>
                  Add New Cheat (Admin)
                </button>
              ) : (
                <form onSubmit={handleAddCheat} className={`mb-8 p-8 rounded-3xl border animate-in slide-in-from-top-4 ring-1 transition-all ${
                  isDarkMode
                    ? 'bg-zinc-900/30 border-violet-500/20 ring-violet-500/10'
                    : 'bg-orange-100/30 border-violet-400/40 ring-violet-400/15'
                }`}>
                  <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}>
                    <div className={`p-2 rounded-lg transition-colors ${
                      isDarkMode
                        ? 'bg-violet-500/10'
                        : 'bg-violet-200'
                    }`}>
                      <Zap className={`w-5 h-5 ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`} />
                    </div>
                    New Cheat Code
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="space-y-2">
                      <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 transition-colors ${
                        isDarkMode ? 'text-zinc-500' : 'text-amber-900'
                      }`}>Effect / Description</label>
                      <input
                        autoFocus
                        required
                        placeholder="e.g. Infinite Health"
                        className={`w-full rounded-xl px-4 py-3 outline-none text-sm transition-all focus:ring-1 border ${
                          isDarkMode
                            ? 'bg-black/50 border-white/10 text-white placeholder-zinc-700 focus:ring-violet-500 focus:bg-black'
                            : 'bg-amber-100/40 border-amber-200 text-amber-950 placeholder-amber-700 focus:ring-violet-500 focus:bg-amber-100/60'
                        }`}
                        value={newCheat.effect}
                        onChange={e => setNewCheat({...newCheat, effect: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 transition-colors ${
                        isDarkMode ? 'text-zinc-500' : 'text-amber-900'
                      }`}>Code / Combination</label>
                      <input
                        required
                        placeholder="e.g. UP, DOWN, L1, R2..."
                        className={`w-full rounded-xl px-4 py-3 outline-none text-sm font-mono transition-all focus:ring-1 border ${
                          isDarkMode
                            ? 'bg-black/50 border-white/10 text-white placeholder-zinc-700 focus:ring-violet-500 focus:bg-black'
                            : 'bg-amber-100/40 border-amber-200 text-amber-950 placeholder-amber-700 focus:ring-violet-500 focus:bg-amber-100/60'
                        }`}
                        value={newCheat.code}
                        onChange={e => setNewCheat({...newCheat, code: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAdding(false)}
                      className={`px-6 py-2.5 text-xs font-bold transition-colors uppercase tracking-wide ${
                        isDarkMode
                          ? 'text-zinc-500 hover:text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`px-6 py-2.5 text-white text-xs font-bold rounded-xl transition-all shadow-lg uppercase tracking-wide hover:scale-105 ${
                        isDarkMode
                          ? 'bg-violet-600 hover:bg-violet-500 shadow-violet-900/20'
                          : 'bg-violet-500 hover:bg-violet-600 shadow-violet-300/20'
                      }`}
                    >
                      Save Cheat
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* List */}
          <div className="space-y-3">
            {game.cheats && game.cheats.length > 0 ? (
              [...game.cheats].reverse().map((cheat, idx) => (
                <div key={idx} className={`group flex flex-col md:flex-row md:items-center justify-between p-5 border rounded-2xl transition-all duration-300 ${
                  isDarkMode
                    ? 'bg-zinc-900/20 hover:bg-zinc-900/50 border-white/5 hover:border-violet-500/20'
                    : 'bg-amber-100/25 hover:bg-amber-100/40 border-amber-200/60 hover:border-violet-400/50'
                }`}>
                  <div className="mb-3 md:mb-0">
                    <div className={`font-bold text-lg group-hover:transition-colors ${
                      isDarkMode
                        ? 'text-zinc-200 group-hover:text-violet-200'
                        : 'text-amber-950 group-hover:text-violet-700'
                    }`}>{cheat.effect}</div>
                    {cheat.notes && <div className={`text-xs mt-1 ${isDarkMode ? 'text-zinc-500' : 'text-amber-800'}`}>{cheat.notes}</div>}
                  </div>
                  <div className={`flex items-center gap-4 pl-4 md:border-l-0 ${
                    isDarkMode ? 'border-l border-white/5' : 'border-l border-neutral-700/30'
                  }`}>
                    <code className={`px-4 py-2 rounded-lg font-mono text-sm border tracking-wider select-all shadow-inner group-hover:transition-colors ${
                      isDarkMode
                        ? 'bg-black/50 text-violet-300 border-white/5 group-hover:border-violet-500/30'
                        : 'bg-amber-200/50 text-violet-700 border-amber-300 group-hover:border-violet-400/60'
                    }`}>
                      {cheat.code}
                    </code>
                    <button 
                      onClick={(e) => handleCopyCode(cheat.code, e)}
                      className={`p-2 transition-colors opacity-0 group-hover:opacity-100 rounded-lg ${
                        isDarkMode
                          ? 'text-zinc-600 hover:text-white hover:bg-white/5'
                          : 'text-amber-700 hover:text-amber-950 hover:bg-amber-200/50'
                      }`}
                      title="Copy Code"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className={`text-center py-20 border border-dashed rounded-3xl ${
                isDarkMode
                  ? 'border-zinc-800 bg-zinc-900/20'
                  : 'border-amber-300 bg-amber-100/20'
              }`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border ${
                  isDarkMode
                    ? 'bg-zinc-900 border-zinc-800'
                    : 'bg-amber-200/50 border-amber-300'
                }`}>
                   <Ghost className={`w-8 h-8 ${isDarkMode ? 'text-zinc-700' : 'text-amber-800'}`} />
                </div>
                <h3 className={`font-bold mb-1 ${isDarkMode ? 'text-zinc-300' : 'text-amber-950'}`}>No Cheats Yet</h3>
                <p className={`text-sm ${isDarkMode ? 'text-zinc-600' : 'text-amber-800'}`}>This database entry is waiting for contributions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDarkMode, setIsDarkMode] = useState(true);

  // 1. Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 2. Data Fetching (Independent of User)
  useEffect(() => {
    const gamesRef = collection(db, 'artifacts', appId, 'public', 'data', 'games');
    const q = query(gamesRef, orderBy('title', 'asc')); 

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

  // 3. Filter
  const filteredGames = useMemo(() => {
    if (!searchTerm.trim()) return games;
    const lower = searchTerm.toLowerCase();
    return games.filter(g => g.title.toLowerCase().includes(lower));
  }, [games, searchTerm]);

  // 4. Actions
  const handleLogin = async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setIsEditMode(false); // Reset edit mode on logout
  };

  const handleDeleteGame = async (gameId) => {
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'games', gameId));
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  const handleAddCheatToGame = async (gameId, cheatData) => {
    if (!user) return;
    try {
      const gameRef = doc(db, 'artifacts', appId, 'public', 'data', 'games', gameId);
      await updateDoc(gameRef, {
        cheats: arrayUnion({
          ...cheatData,
          addedAt: Date.now()
        })
      });
      if (selectedGame && selectedGame.id === gameId) {
        setSelectedGame(prev => ({
          ...prev,
          cheats: [...(prev.cheats || []), cheatData]
        }));
      }
    } catch (err) {
      console.error(err);
      alert("Error adding cheat. Do you have permission?");
    }
  };

  return (
    <div className={`min-h-screen font-sans selection:bg-violet-500/30 selection:text-violet-200 overflow-x-hidden transition-colors duration-500 ${
      isDarkMode
        ? 'bg-[#050505] text-zinc-200'
        : 'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-50 text-amber-950'
    }`}>
      
      {/* ADDED CURSOR GLOW HERE */}
      <CursorGlow onMouseMove={setMousePos} isDarkMode={isDarkMode} />

      {/* Animated Background Mesh */}
      {isDarkMode && <AnimatedBackgroundMesh mousePos={mousePos} />}

      <div className="relative z-10">
        <Header 
          searchTerm={searchTerm} 
          onSearch={setSearchTerm}
          user={user}
          onLoginClick={() => setShowLogin(true)}
          onLogoutClick={handleLogout}
          isDarkMode={isDarkMode}
          onThemeChange={() => setIsDarkMode(!isDarkMode)}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          {/* Statistics Dashboard */}
          {!loading && games.length > 0 && (
            <StatisticsDashboard games={games} isDarkMode={isDarkMode} />
          )}
          
          {/* Grid Header */}
          <div className={`flex items-center justify-between mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ${
            isDarkMode ? '' : 'text-slate-900'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg border transition-colors duration-500 ${
                isDarkMode
                  ? 'bg-zinc-900 border-white/5'
                  : 'bg-slate-200 border-slate-300'
              }`}>
                <LayoutGrid className={`w-5 h-5 ${isDarkMode ? 'text-zinc-500' : 'text-slate-600'}`} />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Database Entries</h2>
                <p className={`text-xs font-medium ${isDarkMode ? 'text-zinc-600' : 'text-slate-500'}`}>
                  {filteredGames.length} Games Indexed
                </p>
              </div>
            </div>
            {user && (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 shadow-lg ${
                    isEditMode 
                      ? isDarkMode
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20 ring-1 ring-red-500/20'
                        : 'bg-red-100 text-red-700 border border-red-300 ring-1 ring-red-200'
                      : isDarkMode
                        ? 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-white/5'
                        : 'bg-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-300 border border-slate-300'
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
              </div>
            )}
          </div>

          {error ? (
            <div className="flex flex-col items-center justify-center h-64 p-6 bg-red-500/5 border border-red-500/10 rounded-3xl text-center backdrop-blur-md">
              <div className="p-4 bg-red-500/10 rounded-full mb-4">
                 <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-red-400 mb-2">System Error</h3>
              <p className="text-sm text-red-300/60 max-w-md">{error}</p>
            </div>
          ) : loading ? (
            <div className="flex flex-col items-center justify-center h-96">
              <Loader2 className="w-10 h-10 text-violet-500 animate-spin mb-4" />
              <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest animate-pulse">Loading Assets...</p>
            </div>
          ) : filteredGames.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
              {filteredGames.map((game, idx) => (
                <GameCard 
                  key={game.id} 
                  game={game} 
                  onClick={setSelectedGame}
                  user={user}
                  onDelete={handleDeleteGame}
                  isEditMode={isEditMode}
                  index={idx}
                  isDarkMode={isDarkMode}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-32 bg-zinc-900/20 rounded-[2.5rem] border border-white/5 border-dashed flex flex-col items-center backdrop-blur-sm animate-in zoom-in-95 duration-500">
              {games.length === 0 ? (
                // Empty Database State
                <>
                  <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-black/50 border border-white/5">
                    <Database className="w-10 h-10 text-zinc-700" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">Database Empty</h3>
                  <p className="text-zinc-500 max-w-md mb-8 leading-relaxed">
                    The database is currently empty. Login as Admin to add games.
                  </p>
                  <button
                     onClick={() => setShowLogin(true)}
                     className="flex items-center gap-3 bg-white text-black hover:bg-zinc-200 px-8 py-4 rounded-2xl font-bold transition-all shadow-xl hover:scale-105 active:scale-95"
                  >
                    <Lock className="w-4 h-4" />
                    Admin Login
                  </button>
                </>
              ) : (
                // Empty Search State
                <>
                   <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-black/50 border border-white/5">
                    <Sparkles className="w-10 h-10 text-zinc-700" />
                  </div>
                  <h3 className="text-2xl font-black text-white mb-2">No Results Found</h3>
                  <p className="text-zinc-500 max-w-md">
                    We couldn't find anything matching "<span className="text-violet-400">{searchTerm}</span>".
                  </p>
                </>
              )}
            </div>
          )}
        </main>

        {/* Modals */}
        {selectedGame && (
          <GameDetail 
            game={selectedGame} 
            onClose={() => setSelectedGame(null)} 
            onAddCheat={handleAddCheatToGame}
            user={user}
            isDarkMode={isDarkMode}
          />
        )}

        {showLogin && (
          <LoginModal 
            onClose={() => setShowLogin(false)}
            onLogin={handleLogin}
            isDarkMode={isDarkMode}
          />
        )}
      </div>
    </div>
  );
}