import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  PieChart,
  CalendarClock,
  Briefcase,
  Palette,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

import { Header } from './components/Header';
import { EventForm } from './components/EventForm';
import { PlanOverviewBanner } from './components/PlanOverviewBanner';
import { BudgetTracker } from './components/BudgetTracker';
import { TimelineSection } from './components/TimelineSection';
import { VendorChecklist } from './components/VendorChecklist';
import { ThemeAndExperience } from './components/ThemeAndExperience';
import { RegenerateModal } from './components/RegenerateModal';
import { FirebaseSaveModal } from './components/FirebaseSaveModal';
import { SampleEventsModal } from './components/SampleEventsModal';
import { ToastContainer, ToastMessage } from './components/Toast';

import {
  CelebrationPlan,
  EventFormData,
  PlanSectionKey,
  VendorStatus,
} from './types';
import {
  checkServerHealth,
  generateEventPlan,
  regenerateSection,
  HealthResponse,
} from './services/api';

const LOCAL_STORAGE_KEY = 'celebration_ai_active_plan';

export const App: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [activePlan, setActivePlan] = useState<CelebrationPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'budget' | 'timeline' | 'vendors' | 'themeAndExperience'
  >('budget');

  // Modals state
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [regenerateModalState, setRegenerateModalState] = useState<{
    isOpen: boolean;
    sectionKey: PlanSectionKey | null;
    sectionTitle: string;
  }>({
    isOpen: false,
    sectionKey: null,
    sectionTitle: '',
  });
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (
    type: 'success' | 'error' | 'info',
    title: string,
    message?: string
  ) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial load
  useEffect(() => {
    // Check backend health
    checkServerHealth().then((h) => {
      setHealth(h);
      if (h.geminiConfigured) {
        addToast('success', 'Gemini AI Connected', 'Active Google Gemini 1.5 Flash backend ready.');
      }
    });

    // Load saved plan from localStorage
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setActivePlan(parsed);
      }
    } catch (e) {
      console.warn('Failed to parse saved plan from localStorage:', e);
    }
  }, []);

  // Save activePlan to localStorage whenever it changes
  useEffect(() => {
    if (activePlan) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(activePlan));
    }
  }, [activePlan]);

  // Handle Generate Event Plan
  const handleGeneratePlan = async (formData: EventFormData) => {
    setIsLoading(true);
    try {
      const result = await generateEventPlan(formData);
      setActivePlan(result.plan);
      setActiveTab('budget');

      // Celebration confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.5 },
      });

      addToast(
        'success',
        'Celebration Plan Created!',
        result.source === 'gemini'
          ? 'Generated with Google Gemini 1.5 Flash.'
          : 'Crafted using CelebrationAI Curated Indian Event Planning Engine.'
      );
    } catch (error: any) {
      console.error('Plan generation failed:', error);
      addToast('error', 'Generation Error', error?.message || 'Could not generate plan. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  // Update Category Spent Amount
  const handleUpdateCategorySpent = (categoryId: string, spentAmount: number) => {
    if (!activePlan) return;
    const updatedCategories = activePlan.budgetCategories.map((cat) =>
      cat.id === categoryId ? { ...cat, spentAmount } : cat
    );
    setActivePlan({
      ...activePlan,
      budgetCategories: updatedCategories,
    });
    addToast('info', 'Expense Updated', 'Budget utilization updated in real time.');
  };

  // Toggle Timeline Task Completion
  const handleToggleTask = (phaseId: string, taskId: string) => {
    if (!activePlan) return;
    const updatedPhases = activePlan.timelinePhases.map((phase) => {
      if (phase.id !== phaseId) return phase;
      return {
        ...phase,
        tasks: phase.tasks.map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        ),
      };
    });
    setActivePlan({
      ...activePlan,
      timelinePhases: updatedPhases,
    });
  };

  // Update Vendor Status
  const handleUpdateVendorStatus = (vendorId: string, status: VendorStatus) => {
    if (!activePlan) return;
    const updatedVendors = activePlan.vendors.map((v) =>
      v.id === vendorId ? { ...v, status } : v
    );
    setActivePlan({
      ...activePlan,
      vendors: updatedVendors,
    });
    addToast('info', 'Vendor Status Updated', `Status changed to: ${status.replace('_', ' ')}`);
  };

  // Open Section Regeneration Modal
  const openRegenerateModal = (sectionKey: PlanSectionKey, sectionTitle: string) => {
    setRegenerateModalState({
      isOpen: true,
      sectionKey,
      sectionTitle,
    });
  };

  // Execute Section Regeneration
  const handleConfirmSectionRegenerate = async (refinementPrompt: string) => {
    if (!activePlan || !regenerateModalState.sectionKey) return;
    setIsRegenerating(true);

    try {
      const sectionKey = regenerateModalState.sectionKey;
      const res = await regenerateSection(activePlan, sectionKey, refinementPrompt);

      if (sectionKey === 'budget') {
        setActivePlan((prev) => (prev ? { ...prev, budgetCategories: res.data } : null));
      } else if (sectionKey === 'timeline') {
        setActivePlan((prev) => (prev ? { ...prev, timelinePhases: res.data } : null));
      } else if (sectionKey === 'vendors') {
        setActivePlan((prev) => (prev ? { ...prev, vendors: res.data } : null));
      } else if (sectionKey === 'themeAndDecor') {
        setActivePlan((prev) => (prev ? { ...prev, themeAndDecor: res.data } : null));
      } else if (sectionKey === 'foodAndEntertainment') {
        setActivePlan((prev) => (prev ? { ...prev, foodAndEntertainment: res.data } : null));
      }

      setRegenerateModalState({ isOpen: false, sectionKey: null, sectionTitle: '' });
      addToast('success', `${regenerateModalState.sectionTitle} Regenerated!`, 'Updated with fresh concepts.');
    } catch (error: any) {
      console.error('Section regeneration failed:', error);
      addToast('error', 'Regeneration Failed', error?.message || 'Could not regenerate section.');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Print view
  const handlePrint = () => {
    window.print();
  };

  // Export JSON
  const handleExportJSON = () => {
    if (!activePlan) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activePlan, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${activePlan.eventDetails.eventName.replace(/\s+/g, '_')}_plan.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('success', 'Plan Exported', 'JSON file downloaded successfully.');
  };

  // Reset to form
  const handleNewPlan = () => {
    setActivePlan(null);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-800 flex flex-col selection:bg-purple-200 selection:text-purple-900">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Header */}
      <Header
        health={health}
        onNewPlan={handleNewPlan}
        onOpenTemplates={() => setShowTemplatesModal(true)}
        hasActivePlan={Boolean(activePlan)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {!activePlan ? (
          /* Event Form View */
          <div className="animate-fadeIn">
            {/* Hero Welcome Banner */}
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-3">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-purple-700" />
                <span>PromptWars GenAI Event Planner</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
                Plan Unforgettable Celebrations with GenAI
              </h1>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                From regal palace weddings to intimate rooftop bashes, CelebrationAI generates mathematically sound INR budgets, countdown roadmaps, vendor RFPs, and bespoke cultural inspirations.
              </p>
            </div>

            <EventForm onSubmit={handleGeneratePlan} isLoading={isLoading} />
          </div>
        ) : (
          /* Generated Event Plan Dashboard View */
          <div className="space-y-6 animate-fadeIn">
            {/* Back Button */}
            <div className="no-print">
              <button
                onClick={handleNewPlan}
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-600 hover:text-purple-700 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Configure Another Celebration</span>
              </button>
            </div>

            {/* Plan Overview Hero Banner */}
            <PlanOverviewBanner
              plan={activePlan}
              onEditParameters={handleNewPlan}
              onOpenSaveModal={() => setShowSaveModal(true)}
              onPrint={handlePrint}
              onExportJSON={handleExportJSON}
            />

            {/* Dashboard Navigation Tabs */}
            <div className="border-b border-cream-200 no-print">
              <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-1">
                <button
                  onClick={() => setActiveTab('budget')}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === 'budget'
                      ? 'bg-purple-700 text-white shadow-md shadow-purple-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-cream-100'
                  }`}
                >
                  <PieChart className="w-4 h-4" />
                  <span>Budget & Spending</span>
                </button>

                <button
                  onClick={() => setActiveTab('timeline')}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === 'timeline'
                      ? 'bg-purple-700 text-white shadow-md shadow-purple-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-cream-100'
                  }`}
                >
                  <CalendarClock className="w-4 h-4" />
                  <span>Roadmap & Milestones</span>
                </button>

                <button
                  onClick={() => setActiveTab('vendors')}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === 'vendors'
                      ? 'bg-purple-700 text-white shadow-md shadow-purple-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-cream-100'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Vendor Guide</span>
                </button>

                <button
                  onClick={() => setActiveTab('themeAndExperience')}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === 'themeAndExperience'
                      ? 'bg-purple-700 text-white shadow-md shadow-purple-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-cream-100'
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  <span>Theme, Decor & Dining</span>
                </button>
              </nav>
            </div>

            {/* Tab Contents */}
            <div className="pt-2">
              {activeTab === 'budget' && (
                <BudgetTracker
                  categories={activePlan.budgetCategories}
                  totalBudgetINR={activePlan.eventDetails.totalBudgetINR}
                  onUpdateCategorySpent={handleUpdateCategorySpent}
                  onRegenerateBudget={() => openRegenerateModal('budget', 'Budget Allocation')}
                  isRegenerating={isRegenerating && regenerateModalState.sectionKey === 'budget'}
                />
              )}

              {activeTab === 'timeline' && (
                <TimelineSection
                  phases={activePlan.timelinePhases}
                  onToggleTask={handleToggleTask}
                  onRegenerateTimeline={() => openRegenerateModal('timeline', 'Roadmap & Timeline')}
                  isRegenerating={isRegenerating && regenerateModalState.sectionKey === 'timeline'}
                />
              )}

              {activeTab === 'vendors' && (
                <VendorChecklist
                  vendors={activePlan.vendors}
                  onUpdateVendorStatus={handleUpdateVendorStatus}
                  onRegenerateVendors={() => openRegenerateModal('vendors', 'Vendor Procurement Guide')}
                  isRegenerating={isRegenerating && regenerateModalState.sectionKey === 'vendors'}
                />
              )}

              {activeTab === 'themeAndExperience' && (
                <ThemeAndExperience
                  themeAndDecor={activePlan.themeAndDecor}
                  foodAndEntertainment={activePlan.foodAndEntertainment}
                  onRegenerateThemeDecor={() => openRegenerateModal('themeAndDecor', 'Theme & Decor')}
                  onRegenerateFoodEntertainment={() =>
                    openRegenerateModal('foodAndEntertainment', 'Culinary & Entertainment')
                  }
                  isRegeneratingTheme={isRegenerating && regenerateModalState.sectionKey === 'themeAndDecor'}
                  isRegeneratingFood={isRegenerating && regenerateModalState.sectionKey === 'foodAndEntertainment'}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-cream-200 bg-white/60 py-6 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-serif font-bold text-slate-800">CelebrationAI</span>
            <span>•</span>
            <span>PromptWars Challenge</span>
          </div>
          <div className="text-slate-400">
            Powered by Google Gemini API • Built with React, Vite & Tailwind CSS
          </div>
        </div>
      </footer>

      {/* Modals */}
      <RegenerateModal
        isOpen={regenerateModalState.isOpen}
        sectionKey={regenerateModalState.sectionKey}
        sectionTitle={regenerateModalState.sectionTitle}
        onClose={() => setRegenerateModalState({ isOpen: false, sectionKey: null, sectionTitle: '' })}
        onConfirm={handleConfirmSectionRegenerate}
        isLoading={isRegenerating}
      />

      {activePlan && (
        <FirebaseSaveModal
          isOpen={showSaveModal}
          plan={activePlan}
          onClose={() => setShowSaveModal(false)}
          onSaveLocal={() => {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(activePlan));
            addToast('success', 'Saved Locally', 'Your plan has been saved to browser storage.');
          }}
          onExportJSON={handleExportJSON}
        />
      )}

      <SampleEventsModal
        isOpen={showTemplatesModal}
        onClose={() => setShowTemplatesModal(false)}
        onSelectSample={(sampleData) => {
          handleGeneratePlan(sampleData);
        }}
      />
    </div>
  );
};
