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
  const [activeTab, setActiveTab] = useState('aimbot'); // 'aimbot', 'esp', 'wallhack', 'radar', 'triggerbot', 'recoil'
  
  // Aimbot Features - Enhanced with multiple targets
  const [targets, setTargets] = useState([
    { id: 1, x: 30, y: 30, vx: 0.3, vy: 0.2 },
    { id: 2, x: 70, y: 50, vx: -0.2, vy: 0.3 },
    { id: 3, x: 50, y: 70, vx: 0.25, vy: -0.25 }
  ]);
  const [crosshairPosition, setCrosshairPosition] = useState({ x: 50, y: 50 });
  const [isAimbotEnabled, setIsAimbotEnabled] = useState(false);
  const [smoothness, setSmoothness] = useState(1); // 0=Low, 1=Medium, 2=High
  const [fov, setFov] = useState(1); // 0=Small, 1=Medium, 2=Large
  const [isDragging, setIsDragging] = useState(false);
  const [dragTargetId, setDragTargetId] = useState(null);
  
  // ESP Features - Enhanced with multiple enemies
  const [enemies, setEnemies] = useState([
    { id: 1, x: 50, y: 50, health: 65, distance: 45.2, name: 'Enemy Player', weapon: 'Rifle', team: 'enemy' }
  ]);
  const [espFeatures, setEspFeatures] = useState({
    box: false,
    skeleton: false,
    names: false,
    health: false,
    distance: false,
    weapon: false
  });
  
  // Radar Features
  const [radarEnabled, setRadarEnabled] = useState(false);
  const [radarScale, setRadarScale] = useState(1);
  
  // Triggerbot Features
  const [triggerbotEnabled, setTriggerbotEnabled] = useState(false);
  const [triggerDelay, setTriggerDelay] = useState(50);
  
  // Recoil Features
  const [recoilCompensationEnabled, setRecoilCompensationEnabled] = useState(false);
  const [recoilStrength, setRecoilStrength] = useState(1);
  
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
  
  // Move targets automatically
  useEffect(() => {
    const interval = setInterval(() => {
      setTargets(prev => prev.map(target => {
        let newX = target.x + target.vx;
        let newY = target.y + target.vy;
        let newVx = target.vx;
        let newVy = target.vy;
        
        // Bounce off edges
        if (newX <= 10 || newX >= 90) {
          newVx = -target.vx;
          newX = newX <= 10 ? 10 : 90;
        }
        if (newY <= 10 || newY >= 90) {
          newVy = -target.vy;
          newY = newY <= 10 ? 10 : 90;
        }
        
        return { ...target, x: newX, y: newY, vx: newVx, vy: newVy };
      }));
    }, 50);
    
    return () => clearInterval(interval);
  }, []);
  
  // Aimbot tracking - find closest target in FOV
  useEffect(() => {
    if (!isAimbotEnabled) return;
    
    const interval = setInterval(() => {
      setCrosshairPosition(prev => {
        // Find closest target within FOV
        let closestTarget = null;
        let closestDistance = Infinity;
        
        targets.forEach(target => {
          const dx = target.x - prev.x;
          const dy = target.y - prev.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          const fovThreshold = currentFov * 1.5;
          if (distance < fovThreshold && distance < closestDistance) {
            closestDistance = distance;
            closestTarget = target;
          }
        });
        
        if (!closestTarget || closestDistance < 0.5) return prev;
        
        const dx = closestTarget.x - prev.x;
        const dy = closestTarget.y - prev.y;
        const speed = (100 - currentSmoothness) / 100;
        
        return {
          x: prev.x + (dx * speed * 0.15),
          y: prev.y + (dy * speed * 0.15)
        };
      });
    }, 16);
    
    return () => clearInterval(interval);
  }, [isAimbotEnabled, targets, currentSmoothness, currentFov]);

  // Handle dragging targets
  const handleMouseDown = (e, targetId) => {
    if (!isAimbotEnabled) {
      setIsDragging(true);
      setDragTargetId(targetId);
      e.stopPropagation();
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && dragTargetId !== null) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      setTargets(prev => prev.map(t => 
        t.id === dragTargetId ? { ...t, x: Math.max(10, Math.min(90, x)), y: Math.max(10, Math.min(90, y)) } : t
      ));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragTargetId(null);
  };
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT') return;
      
      switch(e.key.toLowerCase()) {
        case 'a':
          setActiveTab('aimbot');
          break;
        case 'e':
          setActiveTab('esp');
          break;
        case 'w':
          setActiveTab('wallhack');
          break;
        case 'r':
          setActiveTab('radar');
          break;
        case 't':
          setActiveTab('triggerbot');
          break;
        case 'c':
          setActiveTab('recoil');
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
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
        <div className="flex gap-3 mb-8 border-b border-white/10 pb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('aimbot')}
            className={`px-6 py-3 rounded-t-xl font-bold transition-all whitespace-nowrap ${
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
            className={`px-6 py-3 rounded-t-xl font-bold transition-all whitespace-nowrap ${
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
          <button
            onClick={() => setActiveTab('radar')}
            className={`px-6 py-3 rounded-t-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'radar'
                ? 'bg-green-500/20 border-2 border-green-500/50 border-b-0 text-green-300'
                : 'bg-zinc-900/50 border border-white/10 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeWidth="2"/>
                <circle cx="12" cy="12" r="6" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" strokeWidth="2"/>
              </svg>
              Radar
            </div>
          </button>
          <button
            onClick={() => setActiveTab('triggerbot')}
            className={`px-6 py-3 rounded-t-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'triggerbot'
                ? 'bg-pink-500/20 border-2 border-pink-500/50 border-b-0 text-pink-300'
                : 'bg-zinc-900/50 border border-white/10 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M6 12c0 3.3 2.7 6 6 6s6-2.7 6-6-2.7-6-6-6-6 2.7-6 6z" strokeWidth="2"/>
                <path d="M12 2v4M12 18v4" strokeWidth="2"/>
              </svg>
              Triggerbot
            </div>
          </button>
          <button
            onClick={() => setActiveTab('recoil')}
            className={`px-6 py-3 rounded-t-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'recoil'
                ? 'bg-red-500/20 border-2 border-red-500/50 border-b-0 text-red-300'
                : 'bg-zinc-900/50 border border-white/10 text-zinc-400 hover:bg-zinc-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M6 12h12M12 6v12" strokeWidth="2"/>
                <path d="M9 9l6 6M15 9l-6 6" strokeWidth="2"/>
              </svg>
              Recoil
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
              <div 
                className="relative w-full aspect-video bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl overflow-hidden border border-violet-500/20 cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
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
                
                {/* Multiple Targets (Enemies) */}
                {targets.map((target) => (
                  <div 
                    key={target.id}
                    className={`absolute w-8 h-8 transition-all ${!isAimbotEnabled ? 'cursor-move' : ''}`}
                    style={{
                      left: `${target.x}%`,
                      top: `${target.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    onMouseDown={(e) => handleMouseDown(e, target.id)}
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                      <div className="relative bg-red-500 w-8 h-8 rounded-full border-2 border-red-300 shadow-lg shadow-red-500/50 flex items-center justify-center text-white text-xs font-bold">
                        {target.id}
                      </div>
                    </div>
                  </div>
                ))}
                
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
                  {isAimbotEnabled ? `🎯 Aimbot Active - Tracking ${targets.length} Targets` : '⏸️ Aimbot Disabled - Drag targets to reposition'}
                </div>
                
                {/* Performance Metrics */}
                <div className="absolute top-4 right-4 text-xs text-zinc-400 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">●</span>
                    <span>FPS: {isAimbotEnabled ? '58-62' : '144'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">●</span>
                    <span>CPU: {isAimbotEnabled ? '24%' : '12%'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={isAimbotEnabled ? 'text-orange-400' : 'text-green-400'}>●</span>
                    <span>Risk: {isAimbotEnabled ? 'High' : 'None'}</span>
                  </div>
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
                
                {/* Reset and Keyboard Shortcuts */}
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      setIsAimbotEnabled(false);
                      setSmoothness(1);
                      setFov(1);
                      setTargets([
                        { id: 1, x: 30, y: 30, vx: 0.3, vy: 0.2 },
                        { id: 2, x: 70, y: 50, vx: -0.2, vy: 0.3 },
                        { id: 3, x: 50, y: 70, vx: 0.25, vy: -0.25 }
                      ]);
                      setCrosshairPosition({ x: 50, y: 50 });
                    }}
                    className="px-6 py-3 rounded-xl font-bold transition-all active:scale-95 bg-zinc-800 border-white/10 text-zinc-400 border hover:bg-zinc-700"
                  >
                    🔄 Reset All
                  </button>
                  <div className="flex-1 bg-zinc-800/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-zinc-400">
                    <strong className="text-zinc-300">Keyboard Shortcuts:</strong> Press <kbd className="px-2 py-1 bg-zinc-700 rounded">A</kbd> for Aimbot, <kbd className="px-2 py-1 bg-zinc-700 rounded">E</kbd> for ESP, <kbd className="px-2 py-1 bg-zinc-700 rounded">W</kbd> for Wallhack, <kbd className="px-2 py-1 bg-zinc-700 rounded">R</kbd> for Radar
                  </div>
                </div>
              </div>
            </div>
            
            {/* Technical Details */}
            <div className="bg-zinc-800/30 border border-violet-500/20 rounded-xl p-6 mb-6">
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
                <li className="flex items-start gap-3">
                  <span className="text-violet-400 text-xl">•</span>
                  <span>Multiple target tracking prioritizes closest enemy within FOV range</span>
                </li>
              </ul>
            </div>
            
            {/* Anti-Cheat Detection Info */}
            <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-6">
              <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth="2"/>
                </svg>
                Why It's Banned & Detection Methods
              </h3>
              <ul className="text-zinc-400 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span><strong>VAC (Valve Anti-Cheat):</strong> Detects memory injection and abnormal mouse movements</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span><strong>EasyAntiCheat:</strong> Monitors process memory and detects aim pattern anomalies</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span><strong>BattlEye:</strong> Uses statistical analysis to detect superhuman reaction times</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span><strong>Reason for ban:</strong> Provides unfair advantage and ruins competitive integrity</span>
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
              <div className="relative w-full aspect-video bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl overflow-hidden border border-cyan-500/20 flex items-center justify-center gap-8">
                {/* Background grid */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
                  backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255,255,255,.05) 25%, rgba(255,255,255,.05) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.05) 75%, rgba(255,255,255,.05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255,255,255,.05) 25%, rgba(255,255,255,.05) 26%, transparent 27%, transparent 74%, rgba(255,255,255,.05) 75%, rgba(255,255,255,.05) 76%, transparent 77%, transparent)',
                  backgroundSize: '50px 50px'
                }}></div>

                {/* Multiple Enemy Models */}
                {[
                  { id: 1, scale: 0.7, x: '20%', health: 45, distance: 78.5, name: 'Player_Alpha', weapon: 'Sniper' },
                  { id: 2, scale: 1, x: '50%', health: 65, distance: 45.2, name: 'Enemy_Beta', weapon: 'Rifle' },
                  { id: 3, scale: 0.5, x: '80%', health: 92, distance: 125.8, name: 'xX_Pro_Xx', weapon: 'SMG' }
                ].map((enemy) => (
                  <div key={enemy.id} className="relative" style={{ width: `${20 * enemy.scale}rem`, height: `${24 * enemy.scale}rem` }}>
                    {/* Box ESP */}
                    {espFeatures.box && (
                      <div className="absolute inset-0 border-2 border-cyan-400/50"></div>
                    )}
                    
                    {/* Health Bar on Right Side */}
                    {espFeatures.health && (
                      <div className="absolute right-0 top-0 h-full w-3 bg-red-900/50 border border-red-500 flex flex-col-reverse">
                        <div className="w-full bg-gradient-to-t from-red-500 to-red-400" style={{ height: `${enemy.health}%` }}></div>
                      </div>
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
                        <circle cx="160" cy="80" r="28" fill="none" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2.5"/>
                        <line x1="160" y1="108" x2="160" y2="130" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2"/>
                        <line x1="160" y1="130" x2="160" y2="260" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2"/>
                        <line x1="160" y1="160" x2="30" y2="160" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2"/>
                        <line x1="30" y1="160" x2="5" y2="160" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2"/>
                        <line x1="160" y1="160" x2="290" y2="160" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2"/>
                        <line x1="290" y1="160" x2="315" y2="160" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2"/>
                        <line x1="160" y1="260" x2="120" y2="260" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2"/>
                        <line x1="120" y1="260" x2="100" y2="340" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2"/>
                        <line x1="100" y1="340" x2="100" y2="420" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2"/>
                        <line x1="160" y1="260" x2="200" y2="260" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2"/>
                        <line x1="200" y1="260" x2="220" y2="340" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2"/>
                        <line x1="220" y1="340" x2="220" y2="420" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2"/>
                        <circle cx="160" cy="80" r="5" fill="rgba(34, 197, 94, 0.95)"/>
                        <circle cx="160" cy="130" r="4" fill="rgba(34, 197, 94, 0.95)"/>
                        <circle cx="30" cy="160" r="4" fill="rgba(34, 197, 94, 0.95)"/>
                        <circle cx="5" cy="160" r="4" fill="rgba(34, 197, 94, 0.95)"/>
                        <circle cx="290" cy="160" r="4" fill="rgba(34, 197, 94, 0.95)"/>
                        <circle cx="315" cy="160" r="4" fill="rgba(34, 197, 94, 0.95)"/>
                        <circle cx="120" cy="260" r="4" fill="rgba(34, 197, 94, 0.95)"/>
                        <circle cx="100" cy="340" r="4" fill="rgba(34, 197, 94, 0.95)"/>
                        <circle cx="200" cy="260" r="4" fill="rgba(34, 197, 94, 0.95)"/>
                        <circle cx="220" cy="340" r="4" fill="rgba(34, 197, 94, 0.95)"/>
                      </svg>
                    )}

                    {/* Overlay info */}
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 text-center whitespace-nowrap">
                      {espFeatures.names && (
                        <div className="text-cyan-400 font-bold text-xs mb-1">
                          {espFeatures.distance ? (
                            <span>{enemy.name} <span className="text-yellow-400">[{enemy.distance}m]</span></span>
                          ) : (
                            <span>{enemy.name}</span>
                          )}
                        </div>
                      )}
                      {!espFeatures.names && espFeatures.distance && (
                        <div className="text-yellow-400 text-xs mb-1 font-bold">[{enemy.distance}m]</div>
                      )}
                      {espFeatures.weapon && (
                        <div className="text-orange-400 text-xs">⚔ {enemy.weapon}</div>
                      )}
                    </div>
                    
                    {/* Distance line to center */}
                    {espFeatures.distance && (
                      <svg className="absolute inset-0 w-screen h-screen pointer-events-none" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
                        <line 
                          x1="50%" 
                          y1="90%" 
                          x2={enemy.x} 
                          y2="50%" 
                          stroke="rgba(234, 179, 8, 0.3)" 
                          strokeWidth="1" 
                          strokeDasharray="5,5"
                        />
                      </svg>
                    )}
                  </div>
                ))}
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
            
            {/* Anti-Cheat Detection Info */}
            <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-6">
              <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth="2"/>
                </svg>
                Why It's Banned & Detection Methods
              </h3>
              <ul className="text-zinc-400 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span><strong>VAC:</strong> Scans for rendering modifications and wallhack signatures</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span><strong>EasyAntiCheat:</strong> Detects overlay rendering and DirectX hooks</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span><strong>BattlEye:</strong> Monitors graphics driver interactions and memory patterns</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span><strong>Reason for ban:</strong> Provides complete vision advantage and ruins game balance</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        )}

        {/* Radar Section */}
        {activeTab === 'radar' && (
        <div className="space-y-8">
          <div className="bg-zinc-900/50 border border-orange-500/20 rounded-2xl p-8 backdrop-blur-xl">
            <h2 className="text-3xl font-bold text-orange-400 mb-4 flex items-center gap-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/>
                <path d="M8 12h8M12 8v8" strokeWidth="2"/>
              </svg>
              Wallhack
            </h2>
            <p className="text-zinc-300 mb-8 text-lg">
              Makes walls and objects transparent, allowing you to see through terrain and buildings. Shows enemy positions even when they're behind solid obstacles.
            </p>
            
            {/* Interactive Demo */}
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 mb-6">
              <div className="relative w-full aspect-video bg-gradient-to-br from-orange-900/20 to-red-900/20 rounded-xl overflow-hidden border border-orange-500/20">
                {/* Simulated 3D environment */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {/* Wall (solid obstruction) */}
                  <div 
                    className="absolute inset-y-0 left-1/2 transform -translate-x-1/2 w-4 transition-all duration-300"
                    style={{
                      background: wallhackEnabled 
                        ? `linear-gradient(to right, rgba(100, 100, 100, ${1 - wallTransparency / 100}), rgba(80, 80, 80, ${1 - wallTransparency / 100}))`
                        : 'linear-gradient(to right, #666, #444)',
                      boxShadow: wallhackEnabled ? 'none' : '0 0 20px rgba(0,0,0,0.5)'
                    }}
                  >
                    <div className="absolute inset-0 opacity-20" style={{
                      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)'
                    }}></div>
                  </div>
                  
                  {/* Enemies behind wall (left side) */}
                  <div className="absolute left-[20%] top-1/2 transform -translate-y-1/2 space-y-4">
                    {[1, 2].map((id) => (
                      <div 
                        key={id}
                        className="relative transition-all duration-300"
                        style={{
                          opacity: wallhackEnabled ? 1 : 0.2,
                          filter: wallhackEnabled ? 'none' : 'blur(2px)'
                        }}
                      >
                        <div className="w-12 h-16 bg-red-600 rounded-lg border-2 border-red-400 relative overflow-hidden">
                          {/* Enemy silhouette */}
                          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-red-400 rounded-full"></div>
                          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-red-500 rounded"></div>
                          {wallhackEnabled && (
                            <div className="absolute inset-0 border-2 border-orange-400 animate-pulse"></div>
                          )}
                        </div>
                        {wallhackEnabled && (
                          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-orange-400 font-bold whitespace-nowrap">
                            [{50 + id * 10}m]
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Enemies visible (right side) */}
                  <div className="absolute right-[20%] top-1/2 transform -translate-y-1/2 space-y-4">
                    {[3].map((id) => (
                      <div key={id} className="relative">
                        <div className="w-12 h-16 bg-red-600 rounded-lg border-2 border-red-400 relative overflow-hidden">
                          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-red-400 rounded-full"></div>
                          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-red-500 rounded"></div>
                        </div>
                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-cyan-400 font-bold">
                          [28m]
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Player indicator (bottom center) */}
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                    <div className="w-10 h-12 bg-cyan-600 rounded-lg border-2 border-cyan-400 relative overflow-hidden">
                      <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-cyan-300 rounded-full"></div>
                      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-cyan-500 rounded"></div>
                    </div>
                    <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 text-xs text-cyan-300 font-bold">
                      YOU
                    </div>
                  </div>
                </div>
                
                {/* Status indicators */}
                <div className="absolute top-4 left-4 text-xs text-zinc-400 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
                  {wallhackEnabled ? '👁️ Wallhack Active - Enemies Visible' : '🚫 Normal Vision - Enemies Hidden'}
                </div>
                
                {/* Performance metrics */}
                <div className="absolute top-4 right-4 text-xs text-zinc-400 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">●</span>
                    <span>FPS: {wallhackEnabled ? '120-144' : '144'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">●</span>
                    <span>GPU: {wallhackEnabled ? '42%' : '28%'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={wallhackEnabled ? 'text-red-400' : 'text-green-400'}>●</span>
                    <span>Risk: {wallhackEnabled ? 'Critical' : 'None'}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-bold text-zinc-400 mb-3 block">Wall Transparency: {wallTransparency}%</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={wallTransparency} 
                    onChange={(e) => setWallTransparency(e.target.value)} 
                    className="w-full accent-orange-500"
                    disabled={!wallhackEnabled}
                  />
                  <p className="text-xs text-zinc-500 mt-2">Adjust how transparent walls appear (only works when wallhack is enabled)</p>
                </div>
                <button
                  onClick={() => setWallhackEnabled(!wallhackEnabled)}
                  className={`w-full px-6 py-3 rounded-xl font-bold transition-all ${
                    wallhackEnabled 
                      ? 'bg-orange-500/20 border-orange-500/50 text-orange-300 border-2' 
                      : 'bg-zinc-800 border-white/10 text-zinc-400 border hover:bg-zinc-700'
                  }`}
                >
                  {wallhackEnabled ? '✓ Wallhack Enabled' : 'Enable Wallhack'}
                </button>
              </div>
            </div>

            <div className="bg-zinc-800/30 border border-orange-500/20 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold text-orange-300 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5" />
                How It Works
              </h3>
              <ul className="text-zinc-400 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-orange-400 text-xl">•</span>
                  <span>Modifies rendering to skip drawing opaque objects (walls, buildings, terrain)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-400 text-xl">•</span>
                  <span>Displays enemies with full visibility regardless of obstacles</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-400 text-xl">•</span>
                  <span>Often combined with ESP to show enemy positions through all barriers</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-orange-400 text-xl">•</span>
                  <span>Can render walls as semi-transparent or completely invisible</span>
                </li>
              </ul>
            </div>
            
            {/* Anti-Cheat Detection Info */}
            <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-6">
              <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth="2"/>
                </svg>
                Why It's Banned & Detection Methods
              </h3>
              <ul className="text-zinc-400 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span><strong>VAC:</strong> Detects DirectX/OpenGL hooks and texture modifications</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span><strong>EasyAntiCheat:</strong> Scans for driver-level rendering modifications</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span><strong>BattlEye:</strong> Monitors graphics pipeline and shader manipulations</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span><strong>Reason for ban:</strong> Provides complete information advantage, impossible to counter</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        )}

        {/* Radar Section */}
        {activeTab === 'radar' && (
        <div className="space-y-8">
          <div className="bg-zinc-900/50 border border-green-500/20 rounded-2xl p-8 backdrop-blur-xl">
            <h2 className="text-3xl font-bold text-green-400 mb-4 flex items-center gap-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" strokeWidth="2"/>
                <circle cx="12" cy="12" r="6" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" strokeWidth="2"/>
              </svg>
              Radar / Minimap
            </h2>
            <p className="text-zinc-300 mb-8 text-lg">
              Displays a tactical minimap showing your position and all enemy locations in real-time. Provides instant awareness of the battlefield layout and enemy movements.
            </p>
            
            {/* Interactive Demo */}
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 mb-6">
              <div className="relative w-full aspect-video bg-gradient-to-br from-green-900/20 to-cyan-900/20 rounded-xl overflow-hidden border border-green-500/20 flex items-center justify-center">
                {/* Radar Display */}
                <div className="relative">
                  <svg width="300" height="300" viewBox="0 0 300 300" className="transform transition-all duration-300" style={{ transform: `scale(${radarScale})` }}>
                    {/* Background */}
                    <circle cx="150" cy="150" r="145" fill="#000000" opacity="0.6"/>
                    
                    {/* Distance rings */}
                    <circle cx="150" cy="150" r="120" fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.3"/>
                    <circle cx="150" cy="150" r="80" fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.3"/>
                    <circle cx="150" cy="150" r="40" fill="none" stroke="#22c55e" strokeWidth="1" opacity="0.3"/>
                    
                    {/* Grid lines */}
                    <line x1="150" y1="5" x2="150" y2="295" stroke="#22c55e" strokeWidth="1" opacity="0.2"/>
                    <line x1="5" y1="150" x2="295" y2="150" stroke="#22c55e" strokeWidth="1" opacity="0.2"/>
                    
                    {/* Distance labels */}
                    <text x="150" y="25" textAnchor="middle" fill="#22c55e" fontSize="10" opacity="0.5">100m</text>
                    <text x="150" y="65" textAnchor="middle" fill="#22c55e" fontSize="10" opacity="0.5">66m</text>
                    <text x="150" y="105" textAnchor="middle" fill="#22c55e" fontSize="10" opacity="0.5">33m</text>
                    
                    {/* Sweep effect (radar animation) */}
                    {radarEnabled && (
                      <g>
                        <defs>
                          <radialGradient id="sweepGradient">
                            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3"/>
                            <stop offset="100%" stopColor="#22c55e" stopOpacity="0"/>
                          </radialGradient>
                        </defs>
                        <path
                          d="M 150 150 L 150 5 A 145 145 0 0 1 270 80 Z"
                          fill="url(#sweepGradient)"
                          className="animate-spin origin-center"
                          style={{ transformOrigin: '150px 150px', animationDuration: '4s' }}
                        />
                      </g>
                    )}
                    
                    {/* Enemy positions (red dots) */}
                    {radarEnabled && (
                      <>
                        <circle cx="200" cy="100" r="6" fill="#ef4444" opacity="0.9">
                          <animate attributeName="r" values="6;8;6" dur="1.5s" repeatCount="indefinite"/>
                        </circle>
                        <text x="200" y="90" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">E1</text>
                        
                        <circle cx="100" cy="180" r="6" fill="#ef4444" opacity="0.9">
                          <animate attributeName="r" values="6;8;6" dur="1.5s" begin="0.5s" repeatCount="indefinite"/>
                        </circle>
                        <text x="100" y="170" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">E2</text>
                        
                        <circle cx="220" cy="200" r="6" fill="#ef4444" opacity="0.9">
                          <animate attributeName="r" values="6;8;6" dur="1.5s" begin="1s" repeatCount="indefinite"/>
                        </circle>
                        <text x="220" y="190" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">E3</text>
                        
                        <circle cx="80" cy="80" r="6" fill="#ef4444" opacity="0.9">
                          <animate attributeName="r" values="6;8;6" dur="1.5s" begin="0.75s" repeatCount="indefinite"/>
                        </circle>
                        <text x="80" y="70" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="bold">E4</text>
                      </>
                    )}
                    
                    {/* Team positions (green dots) */}
                    {radarEnabled && (
                      <>
                        <circle cx="140" cy="120" r="5" fill="#22c55e" opacity="0.8"/>
                        <text x="140" y="112" textAnchor="middle" fill="#22c55e" fontSize="9">T1</text>
                        
                        <circle cx="170" cy="165" r="5" fill="#22c55e" opacity="0.8"/>
                        <text x="170" y="157" textAnchor="middle" fill="#22c55e" fontSize="9">T2</text>
                      </>
                    )}
                    
                    {/* Player position (center - blue) */}
                    <circle cx="150" cy="150" r="8" fill="#3b82f6" stroke="#60a5fa" strokeWidth="2"/>
                    
                    {/* Directional indicator */}
                    <polygon points="150,140 145,150 155,150" fill="#60a5fa" opacity="0.8"/>
                    
                    {/* Outer border */}
                    <circle cx="150" cy="150" r="145" fill="none" stroke="#22c55e" strokeWidth="2" opacity="0.6"/>
                  </svg>
                  
                  {/* Scale indicator */}
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-green-400 font-bold bg-black/50 px-3 py-1 rounded-full">
                    {radarScale}x Zoom
                  </div>
                </div>
                
                {/* Status */}
                <div className="absolute top-4 left-4 text-xs text-zinc-400 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
                  {radarEnabled ? '📡 Radar Active - Tracking 4 Enemies' : '🚫 Radar Disabled'}
                </div>
                
                {/* Legend */}
                <div className="absolute bottom-4 right-4 text-xs bg-black/50 backdrop-blur-sm px-4 py-3 rounded-lg space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-zinc-400">You</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-zinc-400">Team</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-zinc-400">Enemy</span>
                  </div>
                </div>
                
                {/* Performance */}
                <div className="absolute top-4 right-4 text-xs text-zinc-400 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">●</span>
                    <span>FPS: {radarEnabled ? '138-144' : '144'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">●</span>
                    <span>CPU: {radarEnabled ? '18%' : '12%'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={radarEnabled ? 'text-orange-400' : 'text-green-400'}>●</span>
                    <span>Risk: {radarEnabled ? 'High' : 'None'}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-bold text-zinc-400 mb-3 block">Radar Scale: {radarScale}x</label>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="3" 
                    step="0.5" 
                    value={radarScale} 
                    onChange={(e) => setRadarScale(e.target.value)} 
                    className="w-full accent-green-500"
                    disabled={!radarEnabled}
                  />
                  <p className="text-xs text-zinc-500 mt-2">Adjust radar zoom level (only works when radar is enabled)</p>
                </div>
                <button
                  onClick={() => setRadarEnabled(!radarEnabled)}
                  className={`w-full px-6 py-3 rounded-xl font-bold transition-all ${
                    radarEnabled 
                      ? 'bg-green-500/20 border-green-500/50 text-green-300 border-2' 
                      : 'bg-zinc-800 border-white/10 text-zinc-400 border hover:bg-zinc-700'
                  }`}
                >
                  {radarEnabled ? '✓ Radar Enabled' : 'Enable Radar'}
                </button>
              </div>
            </div>

            <div className="bg-zinc-800/30 border border-green-500/20 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold text-green-300 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5" />
                How It Works
              </h3>
              <ul className="text-zinc-400 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-green-400 text-xl">•</span>
                  <span>Reads 3D coordinates of all players from game memory</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 text-xl">•</span>
                  <span>Projects positions onto 2D minimap relative to your location</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 text-xl">•</span>
                  <span>Updates in real-time to show enemy movements and rotations</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 text-xl">•</span>
                  <span>Often includes distance indicators and player identification</span>
                </li>
              </ul>
            </div>
            
            {/* Anti-Cheat Detection Info */}
            <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-6">
              <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth="2"/>
                </svg>
                Why It's Banned & Detection Methods
              </h3>
              <ul className="text-zinc-400 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span><strong>VAC:</strong> Detects memory reads of player position arrays</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span><strong>EasyAntiCheat:</strong> Monitors unauthorized overlay applications</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span><strong>BattlEye:</strong> Scans for memory pattern signatures of radar cheats</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span><strong>Reason for ban:</strong> Provides tactical awareness impossible through legitimate gameplay</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        )}

        {/* Triggerbot Section */}
        {activeTab === 'triggerbot' && (
        <div className="space-y-8">
          <div className="bg-zinc-900/50 border border-pink-500/20 rounded-2xl p-8 backdrop-blur-xl">
            <h2 className="text-3xl font-bold text-pink-400 mb-4 flex items-center gap-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M6 12c0 3.3 2.7 6 6 6s6-2.7 6-6-2.7-6-6-6-6 2.7-6 6z" strokeWidth="2"/>
                <path d="M12 2v4M12 18v4" strokeWidth="2"/>
              </svg>
              Triggerbot
            </h2>
            <p className="text-zinc-300 mb-8 text-lg">
              Automatically fires your weapon when an enemy enters your crosshair. Provides instant reaction time with minimal human delay, perfect for precise targeting scenarios.
            </p>
            
            {/* Interactive Demo */}
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 mb-6">
              <div className="relative w-full aspect-video bg-gradient-to-br from-pink-900/20 to-purple-900/20 rounded-xl overflow-hidden border border-pink-500/20">
                {/* Crosshair */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                  <div className="relative w-8 h-8">
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-0.5 h-2 bg-white"></div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0.5 h-2 bg-white"></div>
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-2 h-0.5 bg-white"></div>
                    <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-0.5 bg-white"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white rounded-full"></div>
                  </div>
                </div>
                
                {/* Moving enemy target */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div 
                    className="absolute transition-all duration-[3000ms] ease-linear"
                    style={{
                      left: '10%',
                      animation: 'slideAcross 6s ease-in-out infinite'
                    }}
                  >
                    <div className="relative">
                      <div className="w-16 h-20 bg-red-600 rounded-lg border-2 border-red-400 relative overflow-hidden">
                        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-5 h-5 bg-red-400 rounded-full"></div>
                        <div className="absolute top-7 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-red-500 rounded"></div>
                      </div>
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs text-red-400 font-bold whitespace-nowrap">
                        Enemy
                      </div>
                    </div>
                  </div>
                  
                  {/* Fire indicator */}
                  {triggerbotEnabled && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                      <div className="w-32 h-32 rounded-full bg-pink-500/20 animate-ping"></div>
                    </div>
                  )}
                </div>
                
                {/* Status */}
                <div className="absolute top-4 left-4 text-xs text-zinc-400 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
                  {triggerbotEnabled ? '⚡ Triggerbot Active - Will Auto-Fire' : '🚫 Manual Fire Mode'}
                </div>
                
                {/* Shot counter */}
                <div className="absolute top-4 right-4 text-xs text-zinc-400 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className={triggerbotEnabled ? 'text-pink-400' : 'text-zinc-500'}>●</span>
                    <span>Delay: {triggerDelay}ms</span>
                  </div>
                </div>
                
                {/* Reaction time comparison */}
                <div className="absolute bottom-4 left-4 text-xs bg-black/50 backdrop-blur-sm px-4 py-3 rounded-lg space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Human:</span>
                    <span className="text-yellow-400">~200-300ms</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-400">Triggerbot:</span>
                    <span className="text-pink-400">{triggerDelay}ms</span>
                  </div>
                </div>
                
                {/* Performance */}
                <div className="absolute bottom-4 right-4 text-xs text-zinc-400 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">●</span>
                    <span>FPS: {triggerbotEnabled ? '140-144' : '144'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={triggerbotEnabled ? 'text-orange-400' : 'text-green-400'}>●</span>
                    <span>Risk: {triggerbotEnabled ? 'High' : 'None'}</span>
                  </div>
                </div>
                
                {/* CSS Animation */}
                <style>{`
                  @keyframes slideAcross {
                    0%, 100% { transform: translateX(0); }
                    50% { transform: translateX(calc(80vw - 200px)); }
                  }
                `}</style>
              </div>
              
              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-bold text-zinc-400 mb-3 block">Trigger Delay: {triggerDelay}ms</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="200" 
                    value={triggerDelay} 
                    onChange={(e) => setTriggerDelay(e.target.value)} 
                    className="w-full accent-pink-500"
                    disabled={!triggerbotEnabled}
                  />
                  <p className="text-xs text-zinc-500 mt-2">Lower delay = faster reaction, but more detectable (only works when enabled)</p>
                </div>
                <button
                  onClick={() => setTriggerbotEnabled(!triggerbotEnabled)}
                  className={`w-full px-6 py-3 rounded-xl font-bold transition-all ${
                    triggerbotEnabled 
                      ? 'bg-pink-500/20 border-pink-500/50 text-pink-300 border-2' 
                      : 'bg-zinc-800 border-white/10 text-zinc-400 border hover:bg-zinc-700'
                  }`}
                >
                  {triggerbotEnabled ? '✓ Triggerbot Enabled' : 'Enable Triggerbot'}
                </button>
              </div>
            </div>

            <div className="bg-zinc-800/30 border border-pink-500/20 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold text-pink-300 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5" />
                How It Works
              </h3>
              <ul className="text-zinc-400 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-pink-400 text-xl">•</span>
                  <span>Detects when an enemy player enters your weapon's crosshair</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-pink-400 text-xl">•</span>
                  <span>Automatically sends fire input with configurable delay</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-pink-400 text-xl">•</span>
                  <span>Reduces reaction time from 200-300ms to under 50ms</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-pink-400 text-xl">•</span>
                  <span>Often paired with pixel-perfect crosshair detection</span>
                </li>
              </ul>
            </div>
            
            {/* Anti-Cheat Detection Info */}
            <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-6">
              <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth="2"/>
                </svg>
                Why It's Banned & Detection Methods
              </h3>
              <ul className="text-zinc-400 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span><strong>VAC:</strong> Detects automated input patterns and inhuman reaction times</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span><strong>EasyAntiCheat:</strong> Monitors pixel scanning and color detection routines</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span><strong>BattlEye:</strong> Analyzes firing patterns for consistent sub-human delays</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span><strong>Reason for ban:</strong> Provides unfair advantage through automated gameplay</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        )}

        {/* Recoil Control Section */}
        {activeTab === 'recoil' && (
        <div className="space-y-8">
          <div className="bg-zinc-900/50 border border-red-500/20 rounded-2xl p-8 backdrop-blur-xl">
            <h2 className="text-3xl font-bold text-red-400 mb-4 flex items-center gap-3">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M6 12h12M12 6v12" strokeWidth="2"/>
                <path d="M9 9l6 6M15 9l-6 6" strokeWidth="2"/>
              </svg>
              Recoil Control
            </h2>
            <p className="text-zinc-300 mb-8 text-lg">
              Automatically compensates for weapon recoil by adjusting mouse position downward and sideways. Maintains perfect accuracy even during sustained fire with full-auto weapons.
            </p>
            
            {/* Interactive Demo */}
            <div className="bg-zinc-900 border border-white/10 rounded-xl p-6 mb-6">
              <div className="relative w-full aspect-video bg-gradient-to-br from-red-900/20 to-orange-900/20 rounded-xl overflow-hidden border border-red-500/20">
                {/* Split view: Without vs With Recoil Control */}
                <div className="absolute inset-0 flex">
                  {/* Without Recoil Control (Left) */}
                  <div className="flex-1 border-r border-white/10 relative">
                    <div className="absolute top-2 left-2 text-xs text-zinc-400 bg-black/50 px-3 py-1 rounded">
                      Without Control
                    </div>
                    
                    {/* Bullet spread pattern (scattered) */}
                    <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2">
                      <svg width="120" height="180" viewBox="0 0 120 180" className="opacity-70">
                        {/* Recoil pattern going upward and spreading */}
                        <circle cx="60" cy="160" r="3" fill="#ef4444"/>
                        <circle cx="58" cy="145" r="3" fill="#ef4444"/>
                        <circle cx="65" cy="130" r="3" fill="#ef4444"/>
                        <circle cx="55" cy="115" r="3" fill="#ef4444"/>
                        <circle cx="70" cy="100" r="3" fill="#ef4444"/>
                        <circle cx="50" cy="85" r="3" fill="#ef4444"/>
                        <circle cx="75" cy="70" r="3" fill="#ef4444"/>
                        <circle cx="45" cy="55" r="3" fill="#ef4444"/>
                        <circle cx="80" cy="40" r="3" fill="#ef4444"/>
                        <circle cx="40" cy="25" r="3" fill="#ef4444"/>
                        
                        {/* Connection lines */}
                        <path d="M60,160 L58,145 L65,130 L55,115 L70,100 L50,85 L75,70 L45,55 L80,40 L40,25" 
                              stroke="#ef4444" strokeWidth="1" fill="none" opacity="0.3"/>
                      </svg>
                      
                      {/* Target */}
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                        <div className="w-8 h-10 bg-red-600/50 rounded border border-red-400"></div>
                      </div>
                    </div>
                    
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs text-red-400 bg-black/50 px-2 py-1 rounded">
                      30% Accuracy
                    </div>
                  </div>
                  
                  {/* With Recoil Control (Right) */}
                  <div className="flex-1 relative">
                    <div className="absolute top-2 left-2 text-xs text-zinc-400 bg-black/50 px-3 py-1 rounded">
                      {recoilCompensationEnabled ? 'With Control ✓' : 'With Control'}
                    </div>
                    
                    {/* Bullet spread pattern (tight) */}
                    <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2">
                      <svg width="120" height="180" viewBox="0 0 120 180" className={recoilCompensationEnabled ? 'opacity-100' : 'opacity-30'}>
                        {/* Tight grouping */}
                        <circle cx="60" cy="160" r="3" fill="#22c55e"/>
                        <circle cx="61" cy="156" r="3" fill="#22c55e"/>
                        <circle cx="59" cy="152" r="3" fill="#22c55e"/>
                        <circle cx="62" cy="148" r="3" fill="#22c55e"/>
                        <circle cx="58" cy="144" r="3" fill="#22c55e"/>
                        <circle cx="61" cy="140" r="3" fill="#22c55e"/>
                        <circle cx="59" cy="136" r="3" fill="#22c55e"/>
                        <circle cx="60" cy="132" r="3" fill="#22c55e"/>
                        <circle cx="61" cy="128" r="3" fill="#22c55e"/>
                        <circle cx="59" cy="124" r="3" fill="#22c55e"/>
                        
                        {/* Connection lines */}
                        <path d="M60,160 L61,156 L59,152 L62,148 L58,144 L61,140 L59,136 L60,132 L61,128 L59,124" 
                              stroke="#22c55e" strokeWidth="1" fill="none" opacity="0.3"/>
                      </svg>
                      
                      {/* Target */}
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                        <div className="w-8 h-10 bg-green-600/50 rounded border border-green-400"></div>
                      </div>
                      
                      {recoilCompensationEnabled && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <div className="w-24 h-24 rounded-full border-2 border-green-500/30 animate-ping"></div>
                        </div>
                      )}
                    </div>
                    
                    <div className={`absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs ${recoilCompensationEnabled ? 'text-green-400' : 'text-zinc-500'} bg-black/50 px-2 py-1 rounded`}>
                      {recoilCompensationEnabled ? '95% Accuracy' : '95% Accuracy'}
                    </div>
                  </div>
                </div>
                
                {/* Status indicator */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 text-xs text-zinc-400 bg-black/70 backdrop-blur-sm px-4 py-2 rounded-lg">
                  {recoilCompensationEnabled ? '✓ Recoil Compensation Active' : '⚠️ Natural Recoil Pattern'}
                </div>
                
                {/* Performance metrics */}
                <div className="absolute bottom-4 right-4 text-xs text-zinc-400 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">●</span>
                    <span>FPS: {recoilCompensationEnabled ? '136-144' : '144'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-yellow-400">●</span>
                    <span>Compensation: {(recoilStrength * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={recoilCompensationEnabled ? 'text-orange-400' : 'text-green-400'}>●</span>
                    <span>Risk: {recoilCompensationEnabled ? 'Medium' : 'None'}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-bold text-zinc-400 mb-3 block">Compensation Strength: {recoilStrength}x</label>
                  <input 
                    type="range" 
                    min="0.5" 
                    max="3" 
                    step="0.5" 
                    value={recoilStrength} 
                    onChange={(e) => setRecoilStrength(e.target.value)} 
                    className="w-full accent-red-500"
                    disabled={!recoilCompensationEnabled}
                  />
                  <p className="text-xs text-zinc-500 mt-2">Adjust compensation intensity for different weapon types (only works when enabled)</p>
                </div>
                <button
                  onClick={() => setRecoilCompensationEnabled(!recoilCompensationEnabled)}
                  className={`w-full px-6 py-3 rounded-xl font-bold transition-all ${
                    recoilCompensationEnabled 
                      ? 'bg-red-500/20 border-red-500/50 text-red-300 border-2' 
                      : 'bg-zinc-800 border-white/10 text-zinc-400 border hover:bg-zinc-700'
                  }`}
                >
                  {recoilCompensationEnabled ? '✓ Recoil Control Enabled' : 'Enable Recoil Control'}
                </button>
              </div>
            </div>

            <div className="bg-zinc-800/30 border border-red-500/20 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-bold text-red-300 mb-4 flex items-center gap-2">
                <Info className="w-5 h-5" />
                How It Works
              </h3>
              <ul className="text-zinc-400 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span>Reads current weapon type and fire mode from game memory</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span>Calculates recoil pattern based on weapon-specific spray patterns</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span>Automatically moves mouse downward/sideways to counter recoil</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span>Maintains crosshair on target during full-auto spray</span>
                </li>
              </ul>
            </div>
            
            {/* Anti-Cheat Detection Info */}
            <div className="bg-red-900/10 border border-red-500/30 rounded-xl p-6">
              <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth="2"/>
                </svg>
                Why It's Banned & Detection Methods
              </h3>
              <ul className="text-zinc-400 space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span><strong>VAC:</strong> Detects perfect recoil patterns inconsistent with human input</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span><strong>EasyAntiCheat:</strong> Analyzes mouse movement patterns during firing</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span><strong>BattlEye:</strong> Monitors memory reads of weapon data and recoil values</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 text-xl">•</span>
                  <span><strong>Reason for ban:</strong> Eliminates skill-based recoil control mechanic</span>
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
