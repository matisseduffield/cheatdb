import { useState, useEffect } from 'react';
import { ArrowLeft, Info } from 'lucide-react';

// Visual Effects Components (copy from App.jsx)
const CursorGlow = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      const target = e.target;
      setIsPointer(window.getComputedStyle(target).cursor === 'pointer');
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <>
      <div 
        className="pointer-events-none fixed inset-0 z-[9999] transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle 600px at ${position.x}px ${position.y}px, rgba(139, 92, 246, 0.06), transparent 40%)`,
        }}
      />
      <div
        className="pointer-events-none fixed w-4 h-4 z-[10000] transition-transform duration-150"
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: `translate(-50%, -50%) scale(${isPointer ? 1.5 : 1})`,
        }}
      >
        <div className="w-full h-full rounded-full bg-violet-400/50 blur-sm" />
      </div>
    </>
  );
};

const AnimatedBackgroundMesh = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div 
        className="absolute w-[800px] h-[800px] rounded-full blur-3xl opacity-20 animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4), transparent 70%)',
          left: `${mousePosition.x * 0.05}%`,
          top: `${mousePosition.y * 0.05}%`,
          transform: 'translate(-50%, -50%)',
          transition: 'left 0.3s, top 0.3s',
        }}
      />
      <div 
        className="absolute w-[600px] h-[600px] rounded-full blur-3xl opacity-20 animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3), transparent 70%)',
          left: `${100 - mousePosition.x * 0.05}%`,
          top: `${100 - mousePosition.y * 0.05}%`,
          transform: 'translate(-50%, -50%)',
          transition: 'left 0.3s, top 0.3s',
          animationDelay: '1s',
        }}
      />
      <div 
        className="absolute w-[700px] h-[700px] rounded-full blur-3xl opacity-15 animate-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(34, 211, 238, 0.3), transparent 70%)',
          left: `${50 + mousePosition.x * 0.03}%`,
          top: `${50 + mousePosition.y * 0.03}%`,
          transform: 'translate(-50%, -50%)',
          transition: 'left 0.3s, top 0.3s',
          animationDelay: '2s',
        }}
      />
    </div>
  );
};

const FeaturesPage = () => {
  const [activeTab, setActiveTab] = useState('aimbot'); // 'aimbot' or 'esp'
  const [targetPosition, setTargetPosition] = useState({ x: 50, y: 50 });
  const [crosshairPosition, setCrosshairPosition] = useState({ x: 50, y: 50 });
  const [isAimbotEnabled, setIsAimbotEnabled] = useState(false);
  const [smoothness, setSmoothness] = useState(1); // 0=Low, 1=Medium, 2=High
  const [fov, setFov] = useState(1); // 0=Small, 1=Medium, 2=Large
  
  // ESP Features
  const [espFeatures, setEspFeatures] = useState({
    box: false,
    skeleton: false,
    names: false,
    health: false,
    distance: false,
    weapon: false
  });
  
  // Smoothness mapping: Low=Fast, Medium=Normal, High=Slow
  const smoothnessValues = [20, 50, 80]; // Lower = faster aim snap
  const smoothnessLabels = ['Low (Fast)', 'Medium', 'High (Slow)'];
  
  // FOV mapping: Small, Medium, Large radius
  const fovValues = [8, 15, 25];
  const fovLabels = ['Small', 'Medium', 'Large'];
  
  const currentSmoothness = smoothnessValues[smoothness];
  const currentFov = fovValues[fov];
  
  const toggleEspFeature = (feature) => {
    setEspFeatures(prev => ({
      ...prev,
      [feature]: !prev[feature]
    }));
  };
  
  // Simulate aimbot movement
  useEffect(() => {
    if (!isAimbotEnabled) return;
    
    const interval = setInterval(() => {
      setCrosshairPosition(prev => {
        const dx = targetPosition.x - prev.x;
        const dy = targetPosition.y - prev.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Check if target is within FOV (using percentage distance)
        // currentFov is in vh units, convert to percentage approximation
        const fovThreshold = currentFov * 1.5; // Scale factor for percentage vs vh
        if (distance > fovThreshold) {
          // Target is outside FOV, don't lock on
          return prev;
        }
        
        if (distance < 0.5) return prev; // Already on target
        
        const speed = (100 - currentSmoothness) / 100;
        return {
          x: prev.x + (dx * speed * 0.15),
          y: prev.y + (dy * speed * 0.15)
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
    <div className="min-h-screen bg-[#050505] text-white">
      <CursorGlow />
      <AnimatedBackgroundMesh />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-12">
          <a 
            href="/"
            className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Database
          </a>
          <h1 className="text-5xl font-black text-white mb-4 bg-gradient-to-r from-violet-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
            Features Guide
          </h1>
          <p className="text-xl text-zinc-400">Learn how cheat features work with interactive demonstrations</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-3 mb-8 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab('aimbot')}
            className={`px-6 py-3 rounded-t-xl font-bold transition-all ${
              activeTab === 'aimbot'
                ? 'bg-violet-500/20 border-2 border-violet-500/50 border-b-0 text-violet-300'
                : 'bg-zinc-900/50 border border-white/10 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
                <line x1="12" y1="2" x2="12" y2="6" strokeWidth="2"/>
                <line x1="12" y1="18" x2="12" y2="22" strokeWidth="2"/>
                <line x1="2" y1="12" x2="6" y2="12" strokeWidth="2"/>
                <line x1="18" y1="12" x2="22" y2="12" strokeWidth="2"/>
              </svg>
              Aimbot
            </div>
          </button>
          <button
            onClick={() => setActiveTab('esp')}
            className={`px-6 py-3 rounded-t-xl font-bold transition-all ${
              activeTab === 'esp'
                ? 'bg-cyan-500/20 border-2 border-cyan-500/50 border-b-0 text-cyan-300'
                : 'bg-zinc-900/50 border border-white/10 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
                <path d="M3 9h18M9 21V9" strokeWidth="2"/>
              </svg>
              ESP
            </div>
          </button>
        </div>

        {/* Aimbot Section */}
        {activeTab === 'aimbot' && (
        <div className="space-y-8">
          <div className="bg-zinc-900/50 border border-violet-500/20 rounded-2xl p-8 backdrop-blur-xl">
            <h2 className="text-3xl font-bold text-violet-400 mb-4 flex items-center gap-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
                <line x1="12" y1="2" x2="12" y2="6" strokeWidth="2"/>
                <line x1="12" y1="18" x2="12" y2="22" strokeWidth="2"/>
                <line x1="2" y1="12" x2="6" y2="12" strokeWidth="2"/>
                <line x1="18" y1="12" x2="22" y2="12" strokeWidth="2"/>
              </svg>
              Aimbot
            </h2>
            <p className="text-zinc-300 mb-8 text-lg">
              Automatically aims your crosshair at enemy players. Uses memory reading to detect player positions and smoothly moves your aim towards targets within your Field of View (FOV).
            </p>
            
            {/* Interactive Demo */}
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 mb-6">
              <div className="relative w-full aspect-video bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl overflow-hidden border border-violet-500/20">
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
                <img
                  src="/logos/crosshair.png"
                  alt="Crosshair"
                  className="absolute w-8 h-8 pointer-events-none"
                  style={{
                    left: `${crosshairPosition.x}%`,
                    top: `${crosshairPosition.y}%`,
                    transform: 'translate(-50%, -50%)',
                    transition: isAimbotEnabled ? 'none' : 'all 300ms'
                  }}
                />
                
                {/* Instructions overlay */}
                <div className="absolute top-4 left-4 text-xs text-zinc-400 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
                  {isAimbotEnabled ? '🎯 Aimbot Active - Tracking Target' : '⏸️ Aimbot Disabled - Manual Aim'}
                </div>
              </div>
              
              {/* Controls */}
              <div className="mt-6 space-y-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsAimbotEnabled(!isAimbotEnabled)}
                    className={`px-8 py-3 rounded-xl font-bold transition-all active:scale-95 ${
                      isAimbotEnabled 
                        ? 'bg-green-500/20 border-green-500/50 text-green-300 border-2' 
                        : 'bg-zinc-800 border-white/10 text-zinc-400 border hover:bg-zinc-700'
                    }`}
                  >
                    {isAimbotEnabled ? 'Disable Aimbot' : 'Enable Aimbot'}
                  </button>
                  <span className="text-sm text-zinc-500">Toggle to see how aimbot automatically tracks the target</span>
                </div>
                
                <div>
                  <label className="text-sm font-bold text-zinc-400 mb-3 block">Smoothness: {smoothnessLabels[smoothness]}</label>
                  <div className="flex gap-3">
                    {smoothnessLabels.map((label, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSmoothness(idx)}
                        className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all active:scale-95 ${
                          smoothness === idx
                            ? 'bg-violet-500/30 border-violet-500/50 text-violet-300 border-2'
                            : 'bg-zinc-800 border-white/10 text-zinc-400 border hover:bg-zinc-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">Higher = Slower, more natural movement (less detectable)</p>
                </div>
                
                <div>
                  <label className="text-sm font-bold text-zinc-400 mb-3 block">FOV (Field of View): {fovLabels[fov]}</label>
                  <div className="flex gap-3">
                    {fovLabels.map((label, idx) => (
                      <button
                        key={idx}
                        onClick={() => setFov(idx)}
                        className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all active:scale-95 ${
                          fov === idx
                            ? 'bg-violet-500/30 border-violet-500/50 text-violet-300 border-2'
                            : 'bg-zinc-800 border-white/10 text-zinc-400 border hover:bg-zinc-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">Circle radius - only locks onto targets within this area</p>
                </div>
              </div>
            </div>
            
            {/* Technical Details */}
            <div className="bg-zinc-800/30 border border-violet-500/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-violet-300 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5" />
                How It Works
              </h3>
              <ul className="text-zinc-400 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-violet-400 text-xl">•</span>
                  <span>Reads game memory to locate enemy player positions in 3D space</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-violet-400 text-xl">•</span>
                  <span>Calculates the required mouse movement to align crosshair with target</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-violet-400 text-xl">•</span>
                  <span>Smoothness controls how quickly the aim snaps (lower = instant, higher = gradual)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-violet-400 text-xl">•</span>
                  <span>FOV limits the activation radius to make it less obvious</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        )}

        {/* ESP Section */}
        {activeTab === 'esp' && (
        <div className="space-y-8">
          <div className="bg-zinc-900/50 border border-cyan-500/20 rounded-2xl p-8 backdrop-blur-xl">
            <h2 className="text-3xl font-bold text-cyan-400 mb-4 flex items-center gap-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
                <path d="M3 9h18M9 21V9" strokeWidth="2"/>
              </svg>
              ESP (Extra Sensory Perception)
            </h2>
            <p className="text-zinc-300 mb-8 text-lg">
              Displays visual overlays showing enemy positions, health, distance, and other information. ESP reveals opponent locations even through walls for tactical advantage.
            </p>
            
            {/* Interactive Demo */}
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 mb-6">
              <div className="relative w-full aspect-video bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl overflow-hidden border border-cyan-500/20 flex items-center justify-center">
                {/* Background grid */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                  backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255,255,255,.05) 25%, rgba(255,255,255,.05) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.05) 75%, rgba(255,255,255,.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255,255,255,.05) 25%, rgba(255,255,255,.05) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.05) 75%, rgba(255,255,255,.05) 76%, transparent 77%, transparent)',
                  backgroundSize: '50px 50px'
                }}></div>

                {/* Enemy Model */}
                <div className="relative w-80 h-96">
                  {/* Box with Health Bar */}
                  {espFeatures.box && (
                    <>
                      <div className="absolute inset-0 border-2 border-cyan-400/50" style={{
                        width: '100%',
                        height: '100%'
                      }}></div>
                      {/* Health Bar on Right Side */}
                      {espFeatures.health && (
                        <div className="absolute right-0 top-0 h-full w-4 bg-red-900/50 border border-red-500 border-l-0 flex flex-col-reverse">
                          <div className="w-full bg-red-500" style={{ height: '65%' }}></div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Player Model Image */}
                  <img 
                    src="/logos/model.png" 
                    alt="Player Model" 
                    className="w-full h-full object-contain"
                  />

                  {/* Skeleton */}
                  {espFeatures.skeleton && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 320 480" preserveAspectRatio="xMidYMid meet">
                      {/* Head */}
                      <circle cx="160" cy="60" r="28" fill="none" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2.5"/>
                      {/* Neck */}
                      <line x1="160" y1="88" x2="160" y2="110" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2"/>
                      {/* Spine/Body */}
                      <line x1="160" y1="110" x2="160" y2="240" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2"/>
                      {/* Left Shoulder */}
                      <line x1="160" y1="120" x2="100" y2="120" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2"/>
                      {/* Left Arm Upper */}
                      <line x1="100" y1="120" x2="70" y2="200" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2"/>
                      {/* Left Arm Lower */}
                      <line x1="70" y1="200" x2="50" y2="280" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2"/>
                      {/* Right Shoulder */}
                      <line x1="160" y1="120" x2="220" y2="120" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2"/>
                      {/* Right Arm Upper */}
                      <line x1="220" y1="120" x2="250" y2="200" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2"/>
                      {/* Right Arm Lower */}
                      <line x1="250" y1="200" x2="270" y2="280" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2"/>
                      {/* Left Hip */}
                      <line x1="160" y1="240" x2="120" y2="240" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2"/>
                      {/* Left Leg Upper */}
                      <line x1="120" y1="240" x2="100" y2="360" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2"/>
                      {/* Left Leg Lower */}
                      <line x1="100" y1="360" x2="100" y2="460" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2"/>
                      {/* Right Hip */}
                      <line x1="160" y1="240" x2="200" y2="240" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2"/>
                      {/* Right Leg Upper */}
                      <line x1="200" y1="240" x2="220" y2="360" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2"/>
                      {/* Right Leg Lower */}
                      <line x1="220" y1="360" x2="220" y2="460" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2"/>
                      {/* Joint circles */}
                      <circle cx="160" cy="60" r="5" fill="rgba(34, 197, 94, 0.95)"/>
                      <circle cx="160" cy="110" r="4" fill="rgba(34, 197, 94, 0.95)"/>
                      <circle cx="100" cy="120" r="4" fill="rgba(34, 197, 94, 0.95)"/>
                      <circle cx="70" cy="200" r="4" fill="rgba(34, 197, 94, 0.95)"/>
                      <circle cx="50" cy="280" r="4" fill="rgba(34, 197, 94, 0.95)"/>
                      <circle cx="220" cy="120" r="4" fill="rgba(34, 197, 94, 0.95)"/>
                      <circle cx="250" cy="200" r="4" fill="rgba(34, 197, 94, 0.95)"/>
                      <circle cx="270" cy="280" r="4" fill="rgba(34, 197, 94, 0.95)"/>
                      <circle cx="120" cy="240" r="4" fill="rgba(34, 197, 94, 0.95)"/>
                      <circle cx="100" cy="360" r="4" fill="rgba(34, 197, 94, 0.95)"/>
                      <circle cx="200" cy="240" r="4" fill="rgba(34, 197, 94, 0.95)"/>
                      <circle cx="220" cy="360" r="4" fill="rgba(34, 197, 94, 0.95)"/>
                    </svg>
                  )}

                  {/* Overlay info */}
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-4 text-center whitespace-nowrap">
                    {espFeatures.names && (
                      <div className="text-cyan-400 font-bold text-sm mb-2">
                        Enemy Player
                        {espFeatures.distance && <span className="text-yellow-400 ml-2">[45.2m]</span>}
                      </div>
                    )}
                    {espFeatures.weapon && (
                      <div className="text-orange-400 text-xs mb-1">⚔ Rifle</div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* ESP Feature Toggles */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { key: 'box', label: 'Box ESP', color: 'cyan' },
                  { key: 'skeleton', label: 'Skeleton', color: 'green' },
                  { key: 'names', label: 'Player Names', color: 'cyan' },
                  { key: 'health', label: 'Health Bar', color: 'red' },
                  { key: 'distance', label: 'Distance', color: 'yellow' },
                  { key: 'weapon', label: 'Weapon Info', color: 'orange' }
                ].map(({ key, label, color }) => (
                  <button
                    key={key}
                    onClick={() => toggleEspFeature(key)}
                    className={`px-4 py-3 rounded-lg font-medium transition-all active:scale-95 text-sm ${
                      espFeatures[key]
                        ? `bg-${color}-500/30 border-${color}-500/50 text-${color}-300 border-2`
                        : 'bg-zinc-800 border-white/10 text-zinc-400 border hover:bg-zinc-700'
                    }`}
                  >
                    {espFeatures[key] ? '✓ ' : ''}{label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Technical Details */}
            <div className="bg-zinc-800/30 border border-cyan-500/20 rounded-xl p-6">
              <h3 className="text-lg font-bold text-cyan-300 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5" />
                How It Works
              </h3>
              <ul className="text-zinc-400 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 text-xl">•</span>
                  <span><strong>Box ESP:</strong> Draws a bounding box around each player for quick identification</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 text-xl">•</span>
                  <span><strong>Skeleton:</strong> Shows enemy bone structure through walls and objects</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 text-xl">•</span>
                  <span><strong>Player Names:</strong> Displays player usernames and IDs above their heads</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 text-xl">•</span>
                  <span><strong>Health Bar:</strong> Shows remaining health and armor levels</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 text-xl">•</span>
                  <span><strong>Distance:</strong> Displays distance to target in meters/units</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-cyan-400 text-xl">•</span>
                  <span><strong>Weapon Info:</strong> Shows weapon type and equipment the enemy is carrying</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default FeaturesPage;
