import React from 'react';
import {
  Calendar,
  MapPin,
  Users,
  IndianRupee,
  Printer,
  Download,
  Database,
  Edit3,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { CelebrationPlan } from '../types';
import { formatINR, formatINRCompact } from '../utils/currency';
import { formatEventDate, getDaysUntilEvent } from '../utils/date';

interface PlanOverviewBannerProps {
  plan: CelebrationPlan;
  onEditParameters: () => void;
  onOpenSaveModal: () => void;
  onPrint: () => void;
  onExportJSON: () => void;
}

export const PlanOverviewBanner: React.FC<PlanOverviewBannerProps> = React.memo(({
  plan,
  onEditParameters,
  onOpenSaveModal,
  onPrint,
  onExportJSON,
}) => {
  const { eventDetails, overviewSummary, generatedBy, modelUsed } = plan;
  const daysLeft = getDaysUntilEvent(eventDetails.eventDate);

  return (
    <div className="bg-white rounded-3xl border border-cream-200/90 shadow-soft p-6 sm:p-8 mb-8 relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-100/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Column: Event Title & Badges */}
        <div className="space-y-3 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              {eventDetails.eventType}
            </span>
            <span className="bg-amber-100 text-amber-900 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>{generatedBy === 'gemini' ? (modelUsed || 'Gemini 3.5 Flash') : 'Curated Expert Engine'}</span>
            </span>
            {daysLeft >= 0 ? (
              <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>{daysLeft === 0 ? 'Today is the Celebration!' : `${daysLeft} days remaining`}</span>
              </span>
            ) : (
              <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1 rounded-full">
                Past Event
              </span>
            )}
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight leading-tight">
            {eventDetails.eventName}
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed">
            {overviewSummary}
          </p>

          {/* Quick Metrics Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="flex items-center space-x-2.5 p-2.5 rounded-2xl bg-cream-50 border border-cream-200">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Date</div>
                <div className="text-xs font-bold text-slate-800 truncate">
                  {formatEventDate(eventDetails.eventDate)}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 p-2.5 rounded-2xl bg-cream-50 border border-cream-200">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Location</div>
                <div className="text-xs font-bold text-slate-800 truncate">
                  {eventDetails.location}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 p-2.5 rounded-2xl bg-cream-50 border border-cream-200">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                <Users className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Guests</div>
                <div className="text-xs font-bold text-slate-800 truncate">
                  {eventDetails.guestCount} Guests
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2.5 p-2.5 rounded-2xl bg-cream-50 border border-cream-200">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                <IndianRupee className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Total Budget</div>
                <div className="text-xs font-bold text-purple-700 truncate" title={formatINR(eventDetails.totalBudgetINR)}>
                  {formatINRCompact(eventDetails.totalBudgetINR)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Actions */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 pt-2 lg:pt-0 no-print">
          <button
            onClick={onEditParameters}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-cream-200 hover:border-purple-300 bg-white hover:bg-purple-50 text-slate-700 text-xs sm:text-sm font-semibold transition shadow-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
            aria-label="Edit event parameters and configuration"
          >
            <Edit3 className="w-4 h-4 text-purple-600" />
            <span>Edit Event Input</span>
          </button>

          <button
            onClick={onPrint}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-cream-200 hover:border-purple-300 bg-white hover:bg-purple-50 text-slate-700 text-xs sm:text-sm font-semibold transition shadow-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
            aria-label="Print celebration plan or save as PDF"
          >
            <Printer className="w-4 h-4 text-purple-600" />
            <span>Print / Save PDF</span>
          </button>

          <button
            onClick={onExportJSON}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl border border-cream-200 hover:border-purple-300 bg-white hover:bg-purple-50 text-slate-700 text-xs sm:text-sm font-semibold transition shadow-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
            aria-label="Export celebration plan data as JSON file"
          >
            <Download className="w-4 h-4 text-purple-600" />
            <span>Export Plan (JSON)</span>
          </button>

          <button
            onClick={onOpenSaveModal}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 text-xs sm:text-sm font-semibold transition shadow-xs focus:outline-none focus:ring-2 focus:ring-purple-600"
            aria-label="View cloud sync and storage options"
          >
            <Database className="w-4 h-4 text-purple-700" />
            <span>Cloud Sync (Phase 2)</span>
          </button>
        </div>
      </div>
    </div>
  );
});

PlanOverviewBanner.displayName = 'PlanOverviewBanner';
