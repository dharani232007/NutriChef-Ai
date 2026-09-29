import React, { useEffect, useState } from 'react';
import { 
  X, 
  Clock, 
  ChefHat, 
  Camera, 
  HeartPulse, 
  ArrowLeftRight, 
  Trash2, 
  ArrowLeft 
} from 'lucide-react';

export default function HistorySidebar({ isOpen, onClose, onSelectHistoryItem, activeTab, username }) {
  const cleanUser = (username || 'default').trim().toLowerCase();
  const historyKey = `rasoi_history_${activeTab}_${cleanUser}`;
  const [historyItems, setHistoryItems] = useState([]);

  useEffect(() => {
    if (isOpen) {
      try {
        const items = JSON.parse(localStorage.getItem(historyKey) || '[]');
        setHistoryItems(items);
      } catch {
        setHistoryItems([]);
      }
    }
  }, [isOpen, historyKey]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const clearHistory = () => {
    localStorage.removeItem(historyKey);
    setHistoryItems([]);
  };

  const getFeatureTitle = () => {
    switch (activeTab) {
      case 'text-recipe': return 'Pantry Chef';
      case 'image-recipe': return 'Dish Scanner';
      case 'personalized': return 'Health Recipes';
      case 'swaps': return 'Healthy Swaps';
      default: return 'Recent Activity';
    }
  };

  const getFeatureIcon = () => {
    switch (activeTab) {
      case 'text-recipe': return <ChefHat className="w-5 h-5 text-[#4d6b53]" />;
      case 'image-recipe': return <Camera className="w-5 h-5 text-[#4d6b53]" />;
      case 'personalized': return <HeartPulse className="w-5 h-5 text-[#4d6b53]" />;
      case 'swaps': return <ArrowLeftRight className="w-5 h-5 text-[#4d6b53]" />;
      default: return <Clock className="w-5 h-5 text-[#4d6b53]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs transition-opacity cursor-pointer"
      />

      <div className="relative w-full max-w-md bg-[#faf7f0] h-full shadow-2xl border-l border-[#4d6b53]/20 flex flex-col p-6 z-10 animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-stone-300 text-stone-700 hover:text-[#4d6b53] hover:border-[#4d6b53] text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 rounded-xl hover:bg-stone-200/80 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 pt-4 pb-2">
          {getFeatureIcon()}
          <div>
            <h3 className="font-serif font-bold text-base text-[#2a3c2e]">
              {getFeatureTitle()} History
            </h3>
            <p className="text-[11px] text-stone-500 capitalize">
              Saved recipes for {cleanUser}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {historyItems.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 rounded-2xl bg-stone-200/60 flex items-center justify-center mx-auto mb-3 text-stone-400">
                <Clock className="w-6 h-6" />
              </div>
              <p className="font-semibold text-xs text-stone-600 mb-1">No saved records yet</p>
              <p className="text-[11px] text-stone-400">
                Recipes generated under {cleanUser} will appear here.
              </p>
            </div>
          ) : (
            historyItems.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectHistoryItem(item);
                  onClose();
                }}
                className="group p-3.5 rounded-2xl bg-white border border-stone-200 hover:border-[#4d6b53] shadow-xs cursor-pointer transition-all hover:translate-x-1"
              >
                <div className="flex justify-between items-start text-xs font-bold text-[#2a3c2e] mb-1">
                  <span className="truncate pr-2 group-hover:text-[#4d6b53] transition-colors">
                    {item.title}
                  </span>
                  <span className="text-[10px] font-normal text-stone-400 flex-shrink-0">
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                  {item.preview}
                </p>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-stone-200 space-y-2">
          {historyItems.length > 0 && (
            <button
              type="button"
              onClick={clearHistory}
              className="w-full py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#4d6b53] hover:bg-[#3d5642] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
          >
            <span>Close History</span>
          </button>
        </div>
      </div>
    </div>
  );
}