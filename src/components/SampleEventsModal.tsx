import React, { useEffect } from 'react';
import { Sparkles, MapPin, X, ArrowRight } from 'lucide-react';
import { SAMPLE_EVENTS } from '../data/sampleEvents';
import { EventFormData } from '../types';
import { formatINRCompact } from '../utils/currency';

interface SampleEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sampleData: EventFormData) => void;
}

export const SampleEventsModal: React.FC<SampleEventsModalProps> = React.memo(({
  isOpen,
  onClose,
  onSelectSample,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sample-modal-title"
        className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-cream-200 relative max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700">
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="sample-modal-title" className="font-serif text-xl font-bold text-slate-900">
                Explore Sample Event Blueprints
              </h3>
              <p className="text-xs text-slate-500">
                Pick a pre-configured template with realistic Indian celebration parameters.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {SAMPLE_EVENTS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => {
                onSelectSample(sample.data);
                onClose();
              }}
              className="p-5 rounded-2xl border border-cream-200 hover:border-purple-400 bg-white hover:bg-purple-50/30 transition-all cursor-pointer shadow-xs group flex flex-col justify-between space-y-3 text-left focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <div className="w-full">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 bg-purple-100 px-2 py-0.5 rounded-md">
                    {sample.badge}
                  </span>
                  <span className="text-xs font-bold text-purple-900">
                    {formatINRCompact(sample.data.totalBudgetINR)}
                  </span>
                </div>

                <h4 className="font-serif font-bold text-sm text-slate-900 mt-2 group-hover:text-purple-700 transition">
                  {sample.data.eventName}
                </h4>

                <div className="text-xs text-slate-500 mt-1 line-clamp-2">
                  Theme: {sample.data.theme}
                </div>
              </div>

              <div className="pt-2 border-t border-cream-100 flex items-center justify-between text-xs text-slate-500 w-full">
                <div className="flex items-center space-x-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-purple-600" aria-hidden="true" />
                    <span>{sample.data.location.split(',')[0]}</span>
                  </span>
                  <span>•</span>
                  <span>{sample.data.guestCount} guests</span>
                </div>

                <span className="text-purple-600 font-bold group-hover:translate-x-0.5 transition flex items-center gap-0.5 text-xs">
                  Load <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-cream-200 text-xs font-semibold rounded-xl text-slate-600 hover:bg-cream-50 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
});

SampleEventsModal.displayName = 'SampleEventsModal';
