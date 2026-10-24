import React from 'react';
import {
  Briefcase,
  HelpCircle,
  CheckSquare,
  RefreshCw,
  ShieldAlert,
} from 'lucide-react';
import { VendorItem, VendorStatus } from '../types';
import { formatINR } from '../utils/currency';

interface VendorChecklistProps {
  vendors: VendorItem[];
  onUpdateVendorStatus: (vendorId: string, status: VendorStatus) => void;
  onRegenerateVendors: () => void;
  isRegenerating: boolean;
}

const STATUS_CONFIG: Record<
  VendorStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  not_contacted: { label: 'To Research', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  shortlisted: { label: 'Shortlisted', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  contacted: { label: 'Contacted / Quoting', bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  booked: { label: 'Confirmed & Booked', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
};

export const VendorChecklist: React.FC<VendorChecklistProps> = ({
  vendors,
  onUpdateVendorStatus,
  onRegenerateVendors,
  isRegenerating,
}) => {
  const bookedCount = vendors.filter((v) => v.status === 'booked').length;

  return (
    <div className="bg-white rounded-3xl border border-cream-200/90 shadow-soft p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cream-200 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
              <Briefcase className="w-4 h-4" />
            </div>
            <h2 className="font-serif text-2xl font-bold text-slate-900">
              Vendor Procurement & Inquiry Guide
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Structured RFP checklists, recommended questions to ask, and target budgets for seamless hiring.
          </p>
        </div>

        <button
          onClick={onRegenerateVendors}
          disabled={isRegenerating}
          className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-cream-200 hover:border-purple-300 bg-cream-50 hover:bg-purple-50 text-slate-700 hover:text-purple-800 text-xs font-semibold transition disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-purple-600' : ''}`} />
          <span>{isRegenerating ? 'Regenerating...' : 'Regenerate Vendor Guide'}</span>
        </button>
      </div>

      {/* Advisory & Compliance Banner */}
      <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 flex items-start space-x-3 text-xs leading-relaxed">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Procurement Advisory Notice:</span> Vendor items below are structured planning frameworks and inquiry guides tailored to your event requirements. CelebrationAI does not fabricate live vendor availability or claim third-party endorsements. Please confirm contracts, licensing, and schedules directly with chosen vendors.
        </div>
      </div>

      {/* Progress pill */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
        <span>Vendor Onboarding Progress:</span>
        <span className="bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full font-bold">
          {bookedCount} of {vendors.length} Vendors Locked
        </span>
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vendors.map((vendor) => {
          const statusMeta = STATUS_CONFIG[vendor.status] || STATUS_CONFIG.not_contacted;

          return (
            <div
              key={vendor.id}
              className="p-5 rounded-2xl border border-cream-200 bg-white hover:border-purple-200 shadow-xs transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Category & Status Bar */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                      {vendor.category}
                    </span>
                    <h3 className="font-serif text-lg font-bold text-slate-900 mt-1">
                      {vendor.title}
                    </h3>
                  </div>

                  {/* Status Dropdown/Selector */}
                  <select
                    value={vendor.status}
                    onChange={(e) => onUpdateVendorStatus(vendor.id, e.target.value as VendorStatus)}
                    aria-label={`Status for ${vendor.title}`}
                    className={`text-xs font-bold rounded-xl px-2.5 py-1.5 border cursor-pointer focus:outline-none focus:ring-2 focus:ring-purple-200 ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
                  >
                    <option value="not_contacted">To Research</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="contacted">Contacted / Quoting</option>
                    <option value="booked">Confirmed & Booked</option>
                  </select>
                </div>

                {/* Target Budget & Timing */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="p-2.5 rounded-xl bg-cream-50 border border-cream-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">
                      Target Budget
                    </div>
                    <div className="font-bold text-slate-900 text-sm mt-0.5">
                      {formatINR(vendor.targetBudgetINR)}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-cream-50 border border-cream-200">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">
                      Timeline Guide
                    </div>
                    <div className="font-medium text-slate-800 text-xs mt-0.5 truncate" title={vendor.recommendedBookingTiming}>
                      {vendor.recommendedBookingTiming}
                    </div>
                  </div>
                </div>

                {/* Key Deliverables */}
                {vendor.keyDeliverables && vendor.keyDeliverables.length > 0 && (
                  <div>
                    <div className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-purple-600" />
                      <span>Key Expected Deliverables</span>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc marker:text-purple-500">
                      {vendor.keyDeliverables.map((item, idx) => (
                        <li key={idx} className="leading-snug">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Essential Questions to Ask */}
                {vendor.essentialQuestions && vendor.essentialQuestions.length > 0 && (
                  <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                    <div className="text-xs font-bold text-purple-900 flex items-center gap-1 mb-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-purple-700" />
                      <span>Essential Questions to Ask</span>
                    </div>
                    <ul className="text-xs text-slate-700 space-y-1.5 pl-4 list-disc marker:text-purple-600">
                      {vendor.essentialQuestions.map((q, idx) => (
                        <li key={idx} className="leading-snug italic">
                          "{q}"
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Notes */}
              {vendor.notes && (
                <div className="text-[11px] text-slate-500 pt-2 border-t border-cream-100 italic">
                  Note: {vendor.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
