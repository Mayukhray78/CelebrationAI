import React, { useState } from 'react';
import { Sparkles, Calendar, PlusCircle, Key, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { HealthResponse } from '../services/api';

interface HeaderProps {
  health: HealthResponse | null;
  onNewPlan: () => void;
  onOpenTemplates: () => void;
  hasActivePlan: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  health,
  onNewPlan,
  onOpenTemplates,
  hasActivePlan,
}) => {
  const [showKeyInfoModal, setShowKeyInfoModal] = useState(false);

  const isGeminiLive = health?.geminiConfigured;

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-cream-200 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-3 flex items-center justify-between">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={onNewPlan}>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-500 flex items-center justify-center shadow-md shadow-purple-500/20 text-white">
              <Sparkles className="w-6 h-6 animate-pulse text-amber-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif text-2xl font-bold tracking-tight text-slate-900">
                  Celebration<span className="text-purple-700">AI</span>
                </span>
                <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  GenAI Studio
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Intelligent Indian Event Planning & Financial Strategist
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Gemini Status Pill */}
            <button
              onClick={() => setShowKeyInfoModal(true)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isGeminiLive
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
              }`}
              title="Click to view Gemini API status and instructions"
            >
              {isGeminiLive ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-600 -ml-3"></span>
                  <span>Gemini 1.5 Flash Active</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span>Demo / Curated Mode</span>
                  <Info className="w-3.5 h-3.5 text-purple-500 ml-0.5" />
                </>
              )}
            </button>

            {/* Quick Sample Presets */}
            <button
              onClick={onOpenTemplates}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium text-slate-700 bg-white border border-cream-200 hover:border-purple-300 hover:bg-purple-50/50 shadow-sm transition-all"
            >
              <Calendar className="w-4 h-4 text-purple-600" />
              <span className="hidden md:inline">Sample Events</span>
              <span className="md:hidden">Samples</span>
            </button>

            {/* Create New Plan Button */}
            {hasActivePlan && (
              <button
                onClick={onNewPlan}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-purple-700 hover:bg-purple-800 shadow-sm shadow-purple-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <PlusCircle className="w-4 h-4" />
                <span>New Plan</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Gemini Info Modal */}
      {showKeyInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-cream-200 relative">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-700">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-slate-900">
                    GenAI Engine Status
                  </h3>
                  <p className="text-xs text-slate-500">
                    Google Gemini 1.5 Flash & Fallback Engine
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowKeyInfoModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-sm text-slate-600">
              <div
                className={`p-3.5 rounded-2xl border ${
                  isGeminiLive
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : 'bg-purple-50/80 border-purple-200 text-purple-900'
                }`}
              >
                <div className="flex items-center space-x-2 font-semibold text-xs sm:text-sm">
                  {isGeminiLive ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Gemini API is securely connected!</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 text-purple-600" />
                      <span>Currently running in Curated Intelligent Engine Mode</span>
                    </>
                  )}
                </div>
                <p className="text-xs mt-1 leading-relaxed opacity-90">
                  {isGeminiLive
                    ? 'Plans and section regenerations are actively powered by Google Gemini 1.5 Flash via our secure backend.'
                    : 'The application uses our curated Indian event planner logic with exact INR financial normalization. You can test all features without setup!'}
                </p>
              </div>

              <div className="bg-cream-50 p-4 rounded-2xl border border-cream-200 space-y-2 text-xs">
                <p className="font-semibold text-slate-800">
                  How to enable live Gemini AI:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-600">
                  <li>
                    Get a Gemini API Key from{' '}
                    <a
                      href="https://aistudio.google.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-purple-600 underline font-medium"
                    >
                      Google AI Studio
                    </a>
                  </li>
                  <li>
                    Open your workspace <code className="bg-slate-200 px-1 py-0.5 rounded">.env</code> file
                  </li>
                  <li>
                    Set <code className="bg-slate-200 px-1 py-0.5 rounded">GEMINI_API_KEY=your_key_here</code>
                  </li>
                  <li>Restart the backend server — API keys are strictly kept server-side!</li>
                </ol>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowKeyInfoModal(false)}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold rounded-xl transition"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
