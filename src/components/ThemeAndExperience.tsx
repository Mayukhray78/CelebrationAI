import React from 'react';
import {
  Palette,
  UtensilsCrossed,
  Music,
  Sparkles,
  RefreshCw,
  Gift,
  Clock,
  Wine,
  Camera,
  Check,
} from 'lucide-react';
import { ThemeDecorSection, FoodEntertainmentSection } from '../types';

interface ThemeAndExperienceProps {
  themeAndDecor: ThemeDecorSection;
  foodAndEntertainment: FoodEntertainmentSection;
  onRegenerateThemeDecor: () => void;
  onRegenerateFoodEntertainment: () => void;
  isRegeneratingTheme: boolean;
  isRegeneratingFood: boolean;
}

export const ThemeAndExperience: React.FC<ThemeAndExperienceProps> = React.memo(({
  themeAndDecor,
  foodAndEntertainment,
  onRegenerateThemeDecor,
  onRegenerateFoodEntertainment,
  isRegeneratingTheme,
  isRegeneratingFood,
}) => {
  return (
    <div className="space-y-8">
      {/* 1. Theme & Decoration Concepts Card */}
      <div className="bg-white rounded-3xl border border-cream-200/90 shadow-soft p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cream-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                <Palette className="w-4 h-4" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                Theme & Aesthetic Concepts
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Color harmonies, architectural staging, and sensory visual accents.
            </p>
          </div>

          <button
            onClick={onRegenerateThemeDecor}
            disabled={isRegeneratingTheme}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-cream-200 hover:border-purple-300 bg-cream-50 hover:bg-purple-50 text-slate-700 hover:text-purple-800 text-xs font-semibold transition disabled:opacity-50 self-start sm:self-auto focus:outline-none focus:ring-2 focus:ring-purple-600"
            aria-label="Regenerate theme and decor concepts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingTheme ? 'animate-spin text-purple-600' : ''}`} />
            <span>{isRegeneratingTheme ? 'Regenerating...' : 'Regenerate Theme & Decor'}</span>
          </button>
        </div>

        {/* Theme Title & Vibe */}
        <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-900 bg-purple-200/80 px-2.5 py-0.5 rounded-full">
              Signature Theme
            </span>
            <h3 className="font-serif text-xl font-bold text-slate-900">
              {themeAndDecor.themeName}
            </h3>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            {themeAndDecor.vibeDescription}
          </p>
        </div>

        {/* Color Palette Swatches */}
        {themeAndDecor.colorPalette && themeAndDecor.colorPalette.length > 0 && (
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
              Curated Color Harmony
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {themeAndDecor.colorPalette.map((color, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-cream-200 overflow-hidden shadow-xs bg-white"
                >
                  <div
                    className="h-14 w-full shadow-inner flex items-end justify-end p-1.5"
                    style={{ backgroundColor: color.hex }}
                  >
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-white backdrop-blur-xs font-semibold">
                      {color.hex}
                    </span>
                  </div>
                  <div className="p-2.5 space-y-0.5">
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {color.name}
                    </div>
                    <div className="text-[11px] text-slate-500 leading-tight">
                      {color.usage}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Architectural Decor Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-cream-50/70 border border-cream-200 space-y-1.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
              <Sparkles className="w-4 h-4 text-purple-700" />
              <span>Entrance & Welcome Walkway</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {themeAndDecor.entranceConcept}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-cream-50/70 border border-cream-200 space-y-1.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
              <Sparkles className="w-4 h-4 text-purple-700" />
              <span>Stage & Focal Backdrop</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {themeAndDecor.stageAndBackdrop}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-cream-50/70 border border-cream-200 space-y-1.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
              <Sparkles className="w-4 h-4 text-purple-700" />
              <span>Tablescapes & Ambient Lighting</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {themeAndDecor.tablescapeAndLighting}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-cream-50/70 border border-cream-200 space-y-1.5">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
              <Camera className="w-4 h-4 text-purple-700" />
              <span>Signature Photo Opportunity / Memory Booth</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              {themeAndDecor.photoOpportunityIdea}
            </p>
          </div>
        </div>

        {/* Key Visual Motifs */}
        {themeAndDecor.keyVisualMotifs && themeAndDecor.keyVisualMotifs.length > 0 && (
          <div className="pt-2">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Signature Visual Motifs
            </div>
            <div className="flex flex-wrap gap-2">
              {themeAndDecor.keyVisualMotifs.map((motif, idx) => (
                <div
                  key={idx}
                  className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 text-xs font-medium flex items-center space-x-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                  <span>{motif}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Food, Beverage & Entertainment Card */}
      <div className="bg-white rounded-3xl border border-cream-200/90 shadow-soft p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cream-200 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                Culinary & Entertainment Experience
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Curated dining style, artisanal food courses, live interactive counters, and celebration run-of-show.
            </p>
          </div>

          <button
            onClick={onRegenerateFoodEntertainment}
            disabled={isRegeneratingFood}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-cream-200 hover:border-purple-300 bg-cream-50 hover:bg-purple-50 text-slate-700 hover:text-purple-800 text-xs font-semibold transition disabled:opacity-50 self-start sm:self-auto focus:outline-none focus:ring-2 focus:ring-purple-600"
            aria-label="Regenerate food and entertainment section"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingFood ? 'animate-spin text-purple-600' : ''}`} />
            <span>{isRegeneratingFood ? 'Regenerating...' : 'Regenerate Food & Entertainment'}</span>
          </button>
        </div>

        {/* Dining Style Banner */}
        <div className="p-3.5 rounded-2xl bg-cream-50 border border-cream-200 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Recommended Dining Service Style:
          </span>
          <span className="bg-purple-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
            {foodAndEntertainment.diningStyle}
          </span>
        </div>

        {/* Food Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Welcome Drinks */}
          <div className="p-4 rounded-2xl border border-cream-200 bg-[#FCFBF8] space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-purple-900">
              <Wine className="w-4 h-4 text-purple-700" />
              <span>Welcome Drinks & Refreshers</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 pl-4 list-disc marker:text-purple-500">
              {foodAndEntertainment.welcomeDrinks?.map((drink, idx) => (
                <li key={idx}>{drink}</li>
              ))}
            </ul>
          </div>

          {/* Starters */}
          <div className="p-4 rounded-2xl border border-cream-200 bg-[#FCFBF8] space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-purple-900">
              <UtensilsCrossed className="w-4 h-4 text-purple-700" />
              <span>Artisanal Starters & Canapés</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 pl-4 list-disc marker:text-purple-500">
              {foodAndEntertainment.starters?.map((starter, idx) => (
                <li key={idx}>{starter}</li>
              ))}
            </ul>
          </div>

          {/* Live Counters */}
          <div className="p-4 rounded-2xl border border-cream-200 bg-[#FCFBF8] space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-purple-900">
              <Sparkles className="w-4 h-4 text-purple-700" />
              <span>Live Food Counters</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 pl-4 list-disc marker:text-purple-500">
              {foodAndEntertainment.liveCounters?.map((counter, idx) => (
                <li key={idx}>{counter}</li>
              ))}
            </ul>
          </div>

          {/* Main Courses */}
          <div className="p-4 rounded-2xl border border-cream-200 bg-[#FCFBF8] space-y-2 lg:col-span-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-purple-900">
              <UtensilsCrossed className="w-4 h-4 text-purple-700" />
              <span>Signature Main Courses</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 pl-4 list-disc marker:text-purple-500 grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              {foodAndEntertainment.mainCourses?.map((main, idx) => (
                <li key={idx}>{main}</li>
              ))}
            </ul>
          </div>

          {/* Desserts */}
          <div className="p-4 rounded-2xl border border-cream-200 bg-[#FCFBF8] space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-purple-900">
              <Sparkles className="w-4 h-4 text-purple-700" />
              <span>Artisanal Desserts & Sweets</span>
            </div>
            <ul className="text-xs text-slate-600 space-y-1.5 pl-4 list-disc marker:text-purple-500">
              {foodAndEntertainment.desserts?.map((dessert, idx) => (
                <li key={idx}>{dessert}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Dietary Highlights */}
        {foodAndEntertainment.dietaryHighlights && foodAndEntertainment.dietaryHighlights.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-emerald-900">
              <Check className="w-3.5 h-3.5 text-emerald-700" />
              <span>Dietary Inclusivity & Segregation</span>
            </div>
            <ul className="pl-4 list-disc space-y-0.5 text-emerald-800">
              {foodAndEntertainment.dietaryHighlights.map((dh, idx) => (
                <li key={idx}>{dh}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Entertainment Flow & Milestones */}
        <div className="pt-4 border-t border-cream-200 space-y-4">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700">
              <Music className="w-4 h-4" />
            </div>
            <h3 className="font-serif text-lg font-bold text-slate-900">
              Entertainment Highlights & Run of Show
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {foodAndEntertainment.entertainmentHighlights?.map((act, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border border-cream-200 bg-white hover:border-purple-300 transition-all space-y-1.5"
              >
                <div className="flex items-center space-x-1.5 text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md self-start">
                  <Clock className="w-3 h-3" />
                  <span>{act.timing}</span>
                </div>
                <div className="font-bold text-xs text-slate-900 font-serif pt-1">
                  {act.title}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  {act.description}
                </p>
              </div>
            ))}
          </div>

          {/* Favors & Signature moments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-1.5">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                <Sparkles className="w-4 h-4 text-purple-700" />
                <span>Signature Celebratory Moments</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc marker:text-purple-600">
                {foodAndEntertainment.signatureMoments?.map((m, idx) => (
                  <li key={idx}>{m}</li>
                ))}
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-cream-50 border border-cream-200 space-y-1.5">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                <Gift className="w-4 h-4 text-purple-700" />
                <span>Favors & Return Mementos</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-1 pl-4 list-disc marker:text-purple-600">
                {foodAndEntertainment.partyFavors?.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

ThemeAndExperience.displayName = 'ThemeAndExperience';
