import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  query, 
  orderBy,
  updateDoc,
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
  Database
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

// --- Components ---

const Header = ({ onSearch, searchTerm }) => (
  <header className="sticky top-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/10">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-20 gap-6">
        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0 cursor-pointer group" onClick={() => window.location.reload()}>
          <div className="relative">
            <div className="absolute inset-0 bg-violet-600 blur-lg opacity-50 group-hover:opacity-100 transition-opacity rounded-full"></div>
            <div className="relative bg-zinc-900 p-2.5 rounded-xl border border-white/10 group-hover:border-violet-500/50 transition-colors">
              <Gamepad2 className="w-6 h-6 text-violet-400" />
            </div>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-2xl font-black tracking-tight text-white">
              CHEAT<span className="text-violet-500">DB</span>
            </h1>
            <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-[0.2em] -mt-1">
              Gaming Database
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-500 group-focus-within:text-violet-400 transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 bg-zinc-900/50 border border-white/5 rounded-2xl leading-5 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:bg-zinc-900 focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 sm:text-sm transition-all shadow-xl shadow-black/20"
            placeholder="Search games (e.g., 'Rust', 'Apex Legends')..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>
    </div>
  </header>
);

const AntiCheatBadge = ({ ac }) => {
  const styles = {
    'EAC': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'BattlEye': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    'Vanguard': 'bg-red-500/10 text-red-400 border-red-500/20',
    'VAC': 'bg-green-500/10 text-green-400 border-green-500/20',
    'Ricochet': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    'None': 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  };
  
  const acName = ac || 'Unknown';
  
  return (
    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${styles[acName] || styles.None}`}>
      {acName}
    </span>
  );
};

const GameCard = ({ game, onClick }) => (
  <div 
    onClick={() => onClick(game)}
    className="group relative bg-zinc-900/40 hover:bg-zinc-900/80 border border-white/5 hover:border-violet-500/30 rounded-2xl p-6 transition-all cursor-pointer hover:-translate-y-1 overflow-hidden"
  >
    {/* Glow Effect */}
    <div className="absolute -inset-px bg-gradient-to-b from-violet-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" />
    
    <div className="relative z-10 flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 shadow-inner">
          <ShieldAlert className="w-6 h-6 text-zinc-400 group-hover:text-violet-400 transition-colors" />
        </div>
        <AntiCheatBadge ac={game.antiCheat} />
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-violet-300 transition-colors">
        {game.title}
      </h3>
      
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-zinc-600 flex items-center gap-1">
          <Zap className="w-3 h-3" />
          {game.cheats?.length || 0} Cheats
        </span>
      </div>

      <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-zinc-500 text-sm group-hover:text-zinc-400">
        <span className="text-xs">View Cheats</span>
        <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1 text-violet-500" />
      </div>
    </div>
  </div>
);

const GameDetail = ({ game, onClose, onAddCheat }) => {
  const [newCheat, setNewCheat] = useState({ code: '', effect: '' });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddCheat = async (e) => {
    e.preventDefault();
    if (!newCheat.code || !newCheat.effect) return;
    await onAddCheat(game.id, newCheat);
    setNewCheat({ code: '', effect: '' });
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />
      <div className="relative bg-zinc-950 border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-white/10">
        
        {/* Header */}
        <div className="flex items-start justify-between px-8 py-6 border-b border-white/5 bg-gradient-to-r from-zinc-900 to-zinc-950">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <AntiCheatBadge ac={game.antiCheat} />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">{game.title}</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-zinc-950">
          
          {/* Add Cheat Form */}
          {!isAdding ? (
             <button 
             onClick={() => setIsAdding(true)}
             className="w-full mb-8 py-3 border border-dashed border-zinc-800 rounded-xl text-zinc-500 hover:text-violet-400 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all text-sm font-medium flex items-center justify-center gap-2"
           >
             <Plus className="w-4 h-4" />
             Submit a new cheat code for this game
           </button>
          ) : (
            <form onSubmit={handleAddCheat} className="mb-8 bg-zinc-900/50 p-6 rounded-2xl border border-violet-500/20 animate-in slide-in-from-top-2">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-400" />
                New Cheat Code
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 uppercase ml-1">Effect / Description</label>
                  <input
                    autoFocus
                    required
                    placeholder="e.g. Infinite Health"
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-700 focus:ring-1 focus:ring-violet-500 outline-none text-sm"
                    value={newCheat.effect}
                    onChange={e => setNewCheat({...newCheat, effect: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 uppercase ml-1">Code / Combination</label>
                  <input
                    required
                    placeholder="e.g. UP, DOWN, L1, R2..."
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-zinc-700 focus:ring-1 focus:ring-violet-500 outline-none text-sm font-mono"
                    value={newCheat.code}
                    onChange={e => setNewCheat({...newCheat, code: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-violet-900/20"
                >
                  Save Cheat
                </button>
              </div>
            </form>
          )}

          {/* List */}
          <div className="space-y-3">
            {game.cheats && game.cheats.length > 0 ? (
              [...game.cheats].reverse().map((cheat, idx) => (
                <div key={idx} className="group flex flex-col md:flex-row md:items-center justify-between p-4 bg-zinc-900/30 hover:bg-zinc-900/60 border border-white/5 hover:border-white/10 rounded-xl transition-colors">
                  <div className="mb-2 md:mb-0">
                    <div className="font-bold text-zinc-200">{cheat.effect}</div>
                    {cheat.notes && <div className="text-xs text-zinc-500 mt-1">{cheat.notes}</div>}
                  </div>
                  <div className="flex items-center gap-4">
                    <code className="px-3 py-1.5 bg-zinc-950 rounded-lg text-violet-300 font-mono text-sm border border-white/5 tracking-wider select-all">
                      {cheat.code}
                    </code>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(cheat.code);
                        // Visual feedback could go here
                      }}
                      className="p-2 text-zinc-600 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                      title="Copy Code"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl">
                <Ghost className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500">No cheats found for this game yet.</p>
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGame, setSelectedGame] = useState(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // 1. Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth failed:", err);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. Data
  useEffect(() => {
    if (!user) return;
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
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  // 3. Filter
  const filteredGames = useMemo(() => {
    if (!searchTerm.trim()) return games;
    const lower = searchTerm.toLowerCase();
    return games.filter(g => g.title.toLowerCase().includes(lower));
  }, [games, searchTerm]);

  // 4. Actions
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
    }
  };

  const handleSeedDatabase = async () => {
    if (!user) return;
    setIsSeeding(true);
    const defaultGames = [
      { title: 'Rust', antiCheat: 'EAC' },
      { title: 'Apex Legends', antiCheat: 'EAC' },
      { title: 'CS:GO', antiCheat: 'VAC' },
      { title: 'Escape from Tarkov', antiCheat: 'BattlEye' },
      { title: 'Team Fortress 2', antiCheat: 'VAC' },
      { title: 'Valorant', antiCheat: 'Vanguard' },
      { title: 'Call of Duty: Warzone', antiCheat: 'Ricochet' },
      { title: 'Overwatch 2', antiCheat: 'Defense Matrix' },
    ];

    try {
      const gamesRef = collection(db, 'artifacts', appId, 'public', 'data', 'games');
      const promises = defaultGames.map(game => addDoc(gamesRef, {
        ...game,
        cheats: [],
        addedBy: user.uid,
        createdAt: serverTimestamp()
      }));
      await Promise.all(promises);
    } catch (err) {
      console.error("Error seeding database:", err);
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-violet-500/30 selection:text-violet-200">
      <Header 
        searchTerm={searchTerm} 
        onSearch={setSearchTerm} 
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Grid Header */}
        <div className="flex items-center gap-2 mb-6">
          <LayoutGrid className="w-5 h-5 text-zinc-500" />
          <h2 className="text-lg font-bold text-white">Latest Games</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
          </div>
        ) : filteredGames.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGames.map(game => (
              <GameCard 
                key={game.id} 
                game={game} 
                onClick={setSelectedGame} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-zinc-900/30 rounded-3xl border border-white/5 border-dashed flex flex-col items-center">
            {games.length === 0 ? (
              // Empty Database State
              <>
                <Database className="w-12 h-12 text-zinc-700 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Database Empty</h3>
                <p className="text-zinc-500 max-w-md mb-8">
                  The database is currently empty. Initialize it with default games to get started.
                </p>
                <button
                  onClick={handleSeedDatabase}
                  disabled={isSeeding}
                  className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-lg shadow-violet-900/20"
                >
                  {isSeeding ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Initialize Database
                    </>
                  )}
                </button>
              </>
            ) : (
              // Empty Search State
              <>
                <Gamepad2 className="w-12 h-12 text-zinc-700 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No games found</h3>
                <p className="text-zinc-500 max-w-md">
                  We couldn't find anything matching "{searchTerm}".
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
        />
      )}
    </div>
  );
}