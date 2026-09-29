import React from 'react';

export default function NutriChefLogo({ size = 42, showText = true, className = "" }) {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Real Generated Logo Image */}
      <div 
        style={{ width: size, height: size }}
        className="relative flex items-center justify-center rounded-2xl overflow-hidden shadow-md shadow-[#4d6b53]/20 border border-[#4d6b53]/25 bg-white transition-all duration-300 hover:scale-105"
      >
        <img 
          src="/logo.png" 
          alt="NutriChef Logo" 
          className="w-full h-full object-cover"
        />
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1 leading-none">
            <span className="font-serif font-extrabold text-lg sm:text-xl text-[#2a3c2e] tracking-tight">
              Nutri<span className="text-[#4d6b53]">Chef</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mb-0.5 animate-pulse" />
          </div>
          <span className="text-[9px] sm:text-[10px] text-[#855938] tracking-widest uppercase font-bold mt-0.5">
            AI Nutrition & Kitchen
          </span>
        </div>
      )}
    </div>
  );
}