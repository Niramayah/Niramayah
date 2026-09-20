"use client";

import React from 'react';

export function CoinIcon() {
  return (
    <div className="relative inline-flex items-center justify-center">
      <style jsx>{`
        @keyframes coinTilt {
          0% { transform: rotate(-8deg); }
          50% { transform: rotate(8deg) scale(1.05); }
          100% { transform: rotate(-8deg); }
        }
        .coin-animation {
          animation: coinTilt 3s ease-in-out infinite;
        }
      `}</style>
      <div className="coin-animation h-7 w-7 rounded-full bg-gradient-to-br from-yellow-400 via-orange-400 to-orange-500 shadow-[0_4px_12px_rgba(245,158,11,0.4)] border-b-2 border-orange-600 flex items-center justify-center relative overflow-hidden group">
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
        
        {/* Rupee Symbol */}
        <span className="text-white font-bold text-base drop-shadow-[0_2px_2px_rgba(0,0,0,0.3)] select-none">₹</span>
        
        {/* Inner ring for depth */}
        <div className="absolute inset-1 rounded-full border border-white/30 border-dashed opacity-50"></div>
        
        {/* Outer highlight */}
        <div className="absolute inset-0 rounded-full border-t border-white/40 pointer-events-none"></div>
      </div>
    </div>
  );
}
