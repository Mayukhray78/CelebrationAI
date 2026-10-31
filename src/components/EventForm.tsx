import React, { useState } from 'react';
import {
  Sparkles,
  Users,
  MapPin,
  Calendar,
  IndianRupee,
  Palette,
  Utensils,
  HeartHandshake,
  AlertCircle,
} from 'lucide-react';
import { EventFormData, EventType } from '../types';
import { SAMPLE_EVENTS } from '../data/sampleEvents';
import { formatINRCompact } from '../utils/currency';
import { getDefaultEventDate, getDaysUntilEvent } from '../utils/date';

interface EventFormProps {
  onSubmit: (data: EventFormData) => void;
  isLoading: boolean;
}

const EVENT_TYPES: { type: EventType; label: string; icon: string; desc: string }[] = [
  { type: 'wedding', label: 'Wedding', icon: '💍', desc: 'Bespoke grand or intimate ceremonies' },
  { type: 'birthday', label: 'Birthday', icon: '🎂', desc: 'Milestone bashes, kids & terrace parties' },
  { type: 'anniversary', label: 'Anniversary', icon: '🥂', desc: 'Silver, Golden & intimate milestones' },
  { type: 'community', label: 'Community', icon: '🎪', desc: 'Diwali melas, society galas & festivals' },
  { type: 'corporate', label: 'Corporate', icon: '💼', desc: 'Annual galas, offsites & award nights' },
  { type: 'celebration', label: 'Housewarming', icon: '🏡', desc: 'Griha Pravesh & family gatherings' },
];

const BUDGET_PRESETS = [
  { label: '₹1.5 Lakhs', value: 150000 },
  { label: '₹3 Lakhs', value: 300000 },
  { label: '₹5 Lakhs', value: 500000 },
  { label: '₹10 Lakhs', value: 1000000 },
  { label: '₹25 Lakhs', value: 2500000 },
  { label: '₹50 Lakhs', value: 5000000 },
];

const POPULAR_THEMES = [
  'Royal Rajasthani Heritage & Gold',
  'Bohemian Sunset Terrace & Fairy Lights',
  'Minimalist Elegant White & Sage',
  'Bollywood Sangeet Glamour',
  'Enchanted Floral Forest',
  'Midnight Violet & Rose Gold Luxe',
  'Traditional South Indian Temple & Brass',
];

const POPULAR_CITIES = [
  'Jaipur',
  'Bengaluru',
  'Mumbai',
  'New Delhi',
  'Goa',
  'Udaipur',
  'Hyderabad',
  'Kolkata',
  'Pune',
  'Chennai',
];

export const EventForm: React.FC<EventFormProps> = React.memo(({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<EventFormData>({
    eventName: '',
    eventType: 'wedding',
    hostName: '',
    location: '',
    eventDate: getDefaultEventDate(60),
    guestCount: 150,
    totalBudgetINR: 500000,
    theme: 'Royal Rajasthani Heritage & Gold',
    dietaryPreference: 'Traditional multi-cuisine dinner buffet with live chaat counter (Pure Veg options available)',
    specialPreferences: 'Drone cinematography, couple entrance fireworks, and live acoustic music for evening.',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.eventName.trim()) {
      newErrors.eventName = 'Please give your celebration a name.';
    } else if (formData.eventName.trim().length < 3) {
      newErrors.eventName = 'Event name should be at least 3 characters.';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Please specify the city or venue destination.';
    }

    if (!formData.eventDate) {
      newErrors.eventDate = 'Please select the event date.';
    } else {
      const days = getDaysUntilEvent(formData.eventDate);
      if (days < 0) {
        newErrors.eventDate = 'Event date cannot be in the past.';
      }
    }

    if (!formData.guestCount || formData.guestCount < 1) {
      newErrors.guestCount = 'Guest count must be at least 1.';
    } else if (formData.guestCount > 20000) {
      newErrors.guestCount = 'Guest count exceeds maximum limit (20,000).';
    }

    if (!formData.totalBudgetINR || formData.totalBudgetINR < 10000) {
      newErrors.totalBudgetINR = 'Minimum budget must be at least ₹10,000.';
    }

    if (!formData.theme.trim()) {
      newErrors.theme = 'Please enter or select a preferred theme.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (validate()) {
      onSubmit(formData);
    }
  };

  const loadSample = (sampleId: string) => {
    const sample = SAMPLE_EVENTS.find((s) => s.id === sampleId);
    if (sample) {
      setFormData(sample.data);
      setErrors({});
    }
  };

  const daysToEvent = getDaysUntilEvent(formData.eventDate);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Quick Template Presets Pill Bar */}
      <div className="mb-6 bg-purple-50/70 border border-purple-200/80 rounded-2xl p-3.5 sm:p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2 text-xs font-semibold text-purple-900">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>Quick Start with Curated Celebrations:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {SAMPLE_EVENTS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => loadSample(sample.id)}
                className="text-xs px-2.5 py-1 rounded-lg bg-white hover:bg-purple-600 hover:text-white text-slate-700 font-medium border border-purple-200 transition-all shadow-xs"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl border border-cream-200/90 shadow-soft p-6 sm:p-10 space-y-8"
      >
        {/* Header */}
        <div className="border-b border-cream-200 pb-5">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
            Design Your Celebration
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Provide your event requirements below to generate an AI-powered plan with budget allocation, timeline, vendor guides, and personalized creative concepts.
          </p>
        </div>

        {/* 1. Event Type Selector */}
        <div>
          <label id="event-type-label" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
            1. Select Event Type <span className="text-rose-500">*</span>
          </label>
          <div role="radiogroup" aria-labelledby="event-type-label" className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {EVENT_TYPES.map((et) => {
              const isSelected = formData.eventType === et.type;
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  key={et.type}
                  onClick={() => setFormData({ ...formData, eventType: et.type })}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-600/20 shadow-sm'
                      : 'border-cream-200 hover:border-purple-300 hover:bg-cream-50/50 bg-white'
                  }`}
                >
                  <div className="text-2xl mb-1.5" aria-hidden="true">{et.icon}</div>
                  <div className="font-bold text-sm text-slate-900">{et.label}</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5 line-clamp-1">
                    {et.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Event Name & Host Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="event-name" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Event Title / Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="event-name"
              name="eventName"
              type="text"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.eventName)}
              aria-describedby={errors.eventName ? 'error-event-name' : undefined}
              value={formData.eventName}
              onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
              placeholder="e.g. Aarav & Ananya’s Royal Wedding"
              className={`w-full px-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                errors.eventName
                  ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                  : 'border-cream-200 focus:border-purple-600 focus:ring-purple-100 bg-[#FCFBF8]'
              }`}
            />
            {errors.eventName && (
              <p id="error-event-name" role="alert" className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                {errors.eventName}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="host-name" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Host / Celebrant Name
            </label>
            <input
              id="host-name"
              name="hostName"
              type="text"
              value={formData.hostName}
              onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
              placeholder="e.g. Mr. & Mrs. Singhania"
              className="w-full px-4 py-2.5 rounded-xl border border-cream-200 text-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-100 focus:outline-none bg-[#FCFBF8]"
            />
          </div>
        </div>

        {/* 3. Location & City suggestions */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="event-location" className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Location / City <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400">Indian cities & destination hubs</span>
          </div>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-purple-600" aria-hidden="true" />
            <input
              id="event-location"
              name="location"
              type="text"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.location)}
              aria-describedby={errors.location ? 'error-location' : undefined}
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Jaipur, Rajasthan or Indiranagar, Bengaluru"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                errors.location
                  ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                  : 'border-cream-200 focus:border-purple-600 focus:ring-purple-100 bg-[#FCFBF8]'
              }`}
            />
          </div>
          {errors.location && (
            <p id="error-location" role="alert" className="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
              {errors.location}
            </p>
          )}

          {/* Quick City Pills */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[11px] text-slate-400">Popular:</span>
            {POPULAR_CITIES.slice(0, 6).map((city) => (
              <button
                type="button"
                key={city}
                onClick={() => setFormData({ ...formData, location: city })}
                className="text-[11px] px-2 py-0.5 rounded-md bg-cream-100 hover:bg-purple-100 text-slate-600 hover:text-purple-700 transition"
              >
                {city}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Date & Guest Count */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="event-date" className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Celebration Date <span className="text-rose-500">*</span>
              </label>
              {daysToEvent >= 0 && (
                <span className="text-[11px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                  {daysToEvent === 0 ? 'Today!' : `${daysToEvent} days away`}
                </span>
              )}
            </div>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-purple-600" aria-hidden="true" />
              <input
                id="event-date"
                name="eventDate"
                type="date"
                required
                aria-required="true"
                aria-invalid={Boolean(errors.eventDate)}
                aria-describedby={errors.eventDate ? 'error-event-date' : undefined}
                value={formData.eventDate}
                onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                  errors.eventDate
                    ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                    : 'border-cream-200 focus:border-purple-600 focus:ring-purple-100 bg-[#FCFBF8]'
                }`}
              />
            </div>
            {errors.eventDate && (
              <p id="error-event-date" role="alert" className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                {errors.eventDate}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="guest-count" className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Guest Count <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {formData.guestCount <= 50 ? 'Intimate' : formData.guestCount <= 250 ? 'Mid-Sized' : 'Grand Scale'}
              </span>
            </div>
            <div className="relative">
              <Users className="absolute left-3.5 top-3 w-4 h-4 text-purple-600" aria-hidden="true" />
              <input
                id="guest-count"
                name="guestCount"
                type="number"
                min="1"
                max="20000"
                required
                aria-required="true"
                aria-invalid={Boolean(errors.guestCount)}
                aria-describedby={errors.guestCount ? 'error-guest-count' : undefined}
                value={formData.guestCount || ''}
                onChange={(e) => setFormData({ ...formData, guestCount: parseInt(e.target.value) || 0 })}
                placeholder="e.g. 150"
                className={`w-full pl-10 pr-20 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                  errors.guestCount
                    ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                    : 'border-cream-200 focus:border-purple-600 focus:ring-purple-100 bg-[#FCFBF8]'
                }`}
              />
              <div className="absolute right-2 top-2 flex items-center space-x-1">
                {[50, 100, 250, 500].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setFormData({ ...formData, guestCount: count })}
                    className="text-[10px] px-1.5 py-1 rounded bg-cream-100 hover:bg-purple-100 text-slate-600 font-medium"
                  >
                    {count}
                  </button>
                ))}
              </div>
            </div>
            {errors.guestCount && (
              <p id="error-guest-count" role="alert" className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
                {errors.guestCount}
              </p>
            )}
          </div>
        </div>

        {/* 5. Total Budget in INR with Indian formatting helper & presets */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="total-budget" className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Total Budget in INR (₹) <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs font-bold text-purple-800 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              {formatINRCompact(formData.totalBudgetINR)}
            </span>
          </div>

          <div className="relative">
            <IndianRupee className="absolute left-3.5 top-3 w-4 h-4 text-purple-600" aria-hidden="true" />
            <input
              id="total-budget"
              name="totalBudgetINR"
              type="number"
              step="5000"
              min="10000"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.totalBudgetINR)}
              aria-describedby={errors.totalBudgetINR ? 'error-total-budget' : undefined}
              value={formData.totalBudgetINR || ''}
              onChange={(e) => setFormData({ ...formData, totalBudgetINR: parseInt(e.target.value) || 0 })}
              placeholder="e.g. 500000"
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-semibold transition-all focus:outline-none focus:ring-2 ${
                errors.totalBudgetINR
                  ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                  : 'border-cream-200 focus:border-purple-600 focus:ring-purple-100 bg-[#FCFBF8]'
              }`}
            />
          </div>
          {errors.totalBudgetINR && (
            <p id="error-total-budget" role="alert" className="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
              {errors.totalBudgetINR}
            </p>
          )}

          {/* Quick Budget Presets */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <span className="text-[11px] text-slate-400">Quick Presets:</span>
            {BUDGET_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => setFormData({ ...formData, totalBudgetINR: preset.value })}
                className={`text-xs px-2.5 py-1 rounded-lg border transition font-medium ${
                  formData.totalBudgetINR === preset.value
                    ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                    : 'bg-white hover:bg-purple-50 text-slate-700 border-cream-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* 6. Theme & Preferred Aesthetics */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="theme-vibe" className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Preferred Theme / Vibe <span className="text-rose-500">*</span>
            </label>
            <span className="text-[11px] text-slate-400">Colors, aesthetic & atmosphere</span>
          </div>
          <div className="relative">
            <Palette className="absolute left-3.5 top-3 w-4 h-4 text-purple-600" aria-hidden="true" />
            <input
              id="theme-vibe"
              name="theme"
              type="text"
              required
              aria-required="true"
              aria-invalid={Boolean(errors.theme)}
              aria-describedby={errors.theme ? 'error-theme' : undefined}
              value={formData.theme}
              onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
              placeholder="e.g. Royal Marwar Elegance, Bohemian Sunset Terrace, etc."
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 ${
                errors.theme
                  ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/30'
                  : 'border-cream-200 focus:border-purple-600 focus:ring-purple-100 bg-[#FCFBF8]'
              }`}
            />
          </div>
          {errors.theme && (
            <p id="error-theme" role="alert" className="text-xs text-rose-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
              {errors.theme}
            </p>
          )}

          {/* Theme suggestion pills */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {POPULAR_THEMES.map((th) => (
              <button
                key={th}
                type="button"
                onClick={() => setFormData({ ...formData, theme: th })}
                className="text-[11px] px-2.5 py-1 rounded-full bg-cream-100 hover:bg-purple-100 hover:text-purple-800 text-slate-600 transition"
              >
                {th}
              </button>
            ))}
          </div>
        </div>

        {/* 7. Dietary & Special Preferences */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="dietary-preference" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
              <Utensils className="w-3.5 h-3.5 text-purple-600" aria-hidden="true" />
              <span>Dietary / Food Preferences</span>
            </label>
            <textarea
              id="dietary-preference"
              name="dietaryPreference"
              rows={3}
              value={formData.dietaryPreference || ''}
              onChange={(e) => setFormData({ ...formData, dietaryPreference: e.target.value })}
              placeholder="e.g. Pure Vegetarian with separate Jain counter, artisanal mocktails, live chaat."
              className="w-full px-4 py-2.5 rounded-xl border border-cream-200 text-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-100 focus:outline-none bg-[#FCFBF8]"
            />
          </div>

          <div>
            <label htmlFor="special-preferences" className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
              <HeartHandshake className="w-3.5 h-3.5 text-purple-600" aria-hidden="true" />
              <span>Special Requests & Entertainment</span>
            </label>
            <textarea
              id="special-preferences"
              name="specialPreferences"
              rows={3}
              value={formData.specialPreferences || ''}
              onChange={(e) => setFormData({ ...formData, specialPreferences: e.target.value })}
              placeholder="e.g. Couple entry choreography, drone shoot, kids activity area, return gifts."
              className="w-full px-4 py-2.5 rounded-xl border border-cream-200 text-sm focus:border-purple-600 focus:ring-2 focus:ring-purple-100 focus:outline-none bg-[#FCFBF8]"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-white text-base shadow-lg transition-all flex items-center justify-center space-x-2 ${
              isLoading
                ? 'bg-purple-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-600 hover:from-purple-800 hover:to-indigo-700 shadow-purple-600/30 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <span>Synthesizing Event Plan with CelebrationAI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                <span>Generate Comprehensive Celebration Plan</span>
              </>
            )}
          </button>
          <p className="text-center text-xs text-slate-400 mt-2">
            Accurate INR calculations • Phased Timeline • Vendor Checklist • Curated Theme & Menu
          </p>
        </div>
      </form>
    </div>
  );
});

EventForm.displayName = 'EventForm';
