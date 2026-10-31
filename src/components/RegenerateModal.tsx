import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { PlanSectionKey } from '../types';

interface RegenerateModalProps {
  isOpen: boolean;
  sectionKey: PlanSectionKey | null;
  sectionTitle: string;
  onClose: () => void;
  onConfirm: (prompt: string) => void;
  isLoading: boolean;
}

const SECTION_PROMPT_SUGGESTIONS: Record<string, string[]> = {
  budget: [
    'Reallocate more funds to photography and videography',
    'Prioritize catering and gourmet food counters',
    'Increase buffer for unforeseen contingencies',
  ],
  timeline: [
    'Compress preparation roadmap into 3 weeks',
    'Add specific rehearsal tasks for couple dance',
    'Include vendor payment milestones',
  ],
  vendors: [
    'Add a specialized drone and live streaming crew',
    'Focus on boutique organic florists',
    'Include traditional dhol & shehnai artists',
  ],
  themeAndDecor: [
    'Switch to Royal Emerald Green and Antique Gold',
    'Focus on sustainable, zero-plastic eco-friendly floral decor',
    'Incorporate starry fairy-light tunnel at entrance',
  ],
  foodAndEntertainment: [
    'Make the entire menu 100% Pure Vegetarian and Jain friendly',
    'Add an artisanal wood-fired sourdough pizza counter',
    'Include interactive couple trivia and karaoke hour',
  ],
};

export const RegenerateModal: React.FC<RegenerateModalProps> = React.memo(({
  isOpen,
  sectionKey,
  sectionTitle,
  onClose,
  onConfirm,
  isLoading,
}) => {
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen || !sectionKey) return null;

  const suggestions = SECTION_PROMPT_SUGGESTIONS[sectionKey] || [];

  const handleConfirm = () => {
    onConfirm(prompt);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="regenerate-modal-title"
        className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-cream-200 relative"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="regenerate-modal-title" className="font-serif text-lg font-bold text-slate-900">
                Regenerate {sectionTitle}
              </h3>
              <p className="text-xs text-slate-500">
                Provide custom instructions for CelebrationAI to tailor this section.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="refinement-instructions" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Refinement Instructions (Optional)
            </label>
            <textarea
              id="refinement-instructions"
              name="refinementInstructions"
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Focus more on traditional live music, or adjust catering for pure-veg guests..."
              className="w-full px-4 py-2.5 rounded-xl border border-cream-200 text-xs sm:text-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-100 focus:outline-none bg-[#FCFBF8]"
            />
          </div>

          {/* Quick suggestions */}
          {suggestions.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
                Quick Prompts:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(s)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-cream-50 hover:bg-purple-100 text-slate-700 hover:text-purple-800 border border-cream-200 transition text-left"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-2 transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                <span>Regenerating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
                <span>Generate Fresh Section</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

RegenerateModal.displayName = 'RegenerateModal';
