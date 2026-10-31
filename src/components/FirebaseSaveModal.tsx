import React, { useState, useEffect } from 'react';
import { Database, Download, Save, Copy, AlertCircle, X } from 'lucide-react';
import { CelebrationPlan } from '../types';

interface FirebaseSaveModalProps {
  isOpen: boolean;
  plan: CelebrationPlan;
  onClose: () => void;
  onSaveLocal: () => void;
  onExportJSON: () => void;
}

export const FirebaseSaveModal: React.FC<FirebaseSaveModalProps> = React.memo(({
  isOpen,
  plan,
  onClose,
  onSaveLocal,
  onExportJSON,
}) => {
  const [copied, setCopied] = useState(false);
  const [savedLocal, setSavedLocal] = useState(false);

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

  const handleSaveLocal = () => {
    onSaveLocal();
    setSavedLocal(true);
    setTimeout(() => setSavedLocal(false), 3000);
  };

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(plan, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

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
        aria-labelledby="save-modal-title"
        className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-cream-200 relative"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700">
              <Database className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="save-modal-title" className="font-serif text-xl font-bold text-slate-900">
                Plan Storage & Cloud Sync
              </h3>
              <p className="text-xs text-slate-500">
                Local Persistence & Firebase Firestore Phase 2 Architecture
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

        <div className="space-y-4 text-xs sm:text-sm text-slate-600">
          {/* Phase 2 Transparent Notice */}
          <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 text-purple-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 text-purple-700" aria-hidden="true" />
              <span>Phase 2 Cloud Persistence Roadmap:</span>
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              Full remote Firebase Firestore synchronization is designated for Phase 2. Currently, your plan is auto-saved to your browser’s local storage and can be backed up as an exportable JSON file.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleSaveLocal}
              className="p-3.5 rounded-2xl border border-cream-200 hover:border-purple-300 bg-cream-50 hover:bg-purple-50 text-slate-800 flex items-center space-x-3 transition text-left focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                <Save className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900">
                  {savedLocal ? 'Saved Successfully!' : 'Save to Browser Storage'}
                </div>
                <div className="text-[11px] text-slate-500">
                  Persists between reloads
                </div>
              </div>
            </button>

            <button
              onClick={onExportJSON}
              className="p-3.5 rounded-2xl border border-cream-200 hover:border-purple-300 bg-cream-50 hover:bg-purple-50 text-slate-800 flex items-center space-x-3 transition text-left focus:outline-none focus:ring-2 focus:ring-purple-400"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900">
                  Export Plan JSON
                </div>
                <div className="text-[11px] text-slate-500">
                  Download structured file
                </div>
              </div>
            </button>
          </div>

          {/* Firestore Document Schema Preview */}
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
              <span>Firestore Collection Target: <code className="text-purple-700 font-mono">celebration_plans</code></span>
              <button
                onClick={copyJSON}
                className="text-[11px] text-purple-600 hover:text-purple-800 flex items-center gap-1 font-semibold focus:outline-none focus:underline"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Copied!' : 'Copy Plan Data'}</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-200 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-44 border border-slate-800">
              {JSON.stringify(
                {
                  collection: 'celebration_plans',
                  docId: plan.id,
                  event: plan.eventDetails.eventName,
                  budgetINR: plan.eventDetails.totalBudgetINR,
                  guestCount: plan.eventDetails.guestCount,
                  totalCategories: plan.budgetCategories.length,
                  totalPhases: plan.timelinePhases.length,
                  totalVendors: plan.vendors.length,
                  createdAt: plan.createdAt,
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});

FirebaseSaveModal.displayName = 'FirebaseSaveModal';
