import React, { useMemo } from 'react';

export function Forest({ trees, progressToNext }: { trees: number; progressToNext: number }) {
  // Generate positions for all trees clustered together in one bunch
  const treePositions = useMemo(() => {
    if (trees === 0) return [];
    
    const positions: Array<{ x: number; y: number; size: number; rotation: number }> = [];
    
    // Single cluster center - all trees together
    const clusterCenterX = 50; // Center horizontally
    const clusterCenterY = 50; // Center vertically
    
    for (let i = 0; i < trees; i++) {
      // Position trees in a wider circle around the center with more spacing
      const angle = (Math.PI * 2 * i) / trees; // Distribute evenly in circle
      const radius = 8 + Math.random() * 12; // Larger radius for more spacing between trees
      const x = clusterCenterX + Math.cos(angle) * radius;
      const y = clusterCenterY + Math.sin(angle) * radius;
      
      positions.push({
        x: Math.max(10, Math.min(90, x)), // Keep within bounds
        y: Math.max(15, Math.min(85, y)),
        size: 0.9 + Math.random() * 0.25, // Random size between 0.9x and 1.15x
        rotation: Math.random() * 12 - 6, // Slight rotation for natural look
      });
    }
    
    return positions;
  }, [trees]);

  const TreeIcon = ({ size = 1, rotation = 0 }: { size?: number; rotation?: number }) => (
    <svg 
      className="w-12 h-12" 
      style={{ 
        transform: `scale(${size}) rotate(${rotation}deg)`,
        filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.2))'
      }}
      viewBox="0 0 32 40" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Tree trunk */}
      <rect x="14" y="28" width="4" height="12" rx="1" fill="#8B4513" />
      
      {/* Christmas tree layers - triangular sections */}
      {/* Bottom layer - largest */}
      <path d="M16 28 L6 28 L16 20 Z" fill="#16A34A" />
      <path d="M16 28 L26 28 L16 20 Z" fill="#16A34A" />
      <path d="M16 28 L10 28 L16 22 Z" fill="#22C55E" />
      <path d="M16 28 L22 28 L16 22 Z" fill="#22C55E" />
      
      {/* Middle layer */}
      <path d="M16 20 L8 20 L16 14 Z" fill="#16A34A" />
      <path d="M16 20 L24 20 L16 14 Z" fill="#16A34A" />
      <path d="M16 20 L11 20 L16 16 Z" fill="#22C55E" />
      <path d="M16 20 L21 20 L16 16 Z" fill="#22C55E" />
      
      {/* Top layer */}
      <path d="M16 14 L10 14 L16 10 Z" fill="#16A34A" />
      <path d="M16 14 L22 14 L16 10 Z" fill="#16A34A" />
      <path d="M16 14 L12 14 L16 12 Z" fill="#22C55E" />
      <path d="M16 14 L20 14 L16 12 Z" fill="#22C55E" />
      
      {/* Star on top */}
      <path d="M16 8 L17 10 L19 10 L17.5 11.5 L18 13.5 L16 12 L14 13.5 L14.5 11.5 L13 10 L15 10 Z" fill="#FFD700" />
      <circle cx="16" cy="10" r="1.5" fill="#FFA500" />
    </svg>
  );

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 shadow-lg border border-emerald-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-emerald-900 font-semibold text-lg">Your Forest</h3>
        <div className="text-sm text-emerald-700">
          <strong>{trees}</strong> tree{trees !== 1 ? 's' : ''} planted
        </div>
      </div>

      <div className="relative bg-gradient-to-b from-emerald-100 to-emerald-200 rounded-xl p-8 min-h-[300px] overflow-hidden">
        {trees === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🌱</div>
              <p className="text-emerald-700 font-medium">No trees yet</p>
              <p className="text-emerald-600 text-sm mt-1">Start logging actions to grow your forest!</p>
            </div>
          </div>
        ) : (
          <>
            {/* Ground layer */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-amber-800 to-amber-700 opacity-30 rounded-b-xl" />
            
            {/* Trees */}
            {treePositions.map((pos, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: `translate(-50%, -50%) scale(${pos.size}) rotate(${pos.rotation}deg)`,
                }}
              >
                <TreeIcon size={pos.size} rotation={pos.rotation} />
              </div>
            ))}
          </>
        )}
      </div>

      <div className="mt-4 bg-white rounded-lg p-3 border border-emerald-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-emerald-700">Progress to next tree:</span>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-emerald-100 rounded-full h-2 max-w-[150px]">
              <div 
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressToNext * 100}%` }}
              />
            </div>
            <span className="text-emerald-700 font-medium">{Math.round(progressToNext * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Forest;
