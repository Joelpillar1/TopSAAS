import React from 'react';
import { Plus } from 'lucide-react';
import { playSound } from '../utils/sound';

interface MobileBottomBarProps {
  onOpenSubmit: () => void;
  soundEnabled: boolean;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  onOpenSubmit,
  soundEnabled,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 bg-white/95 backdrop-blur-lg px-3.5 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden shadow-lg">
      <button
        onClick={() => {
          playSound('click', soundEnabled);
          onOpenSubmit();
        }}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-black py-3 px-4 text-xs font-bold text-white shadow-xs hover:bg-neutral-900 active:scale-[0.98] transition-all cursor-pointer min-h-[44px]"
      >
        <Plus className="h-4 w-4 stroke-[2.5]" />
        <span>Submit Website</span>
      </button>
    </div>
  );
};

