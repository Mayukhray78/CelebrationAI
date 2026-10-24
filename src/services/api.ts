import { EventFormData, CelebrationPlan, PlanSectionKey } from '../types';
import { generateCuratedPlan } from './mockPlanGenerator';

export interface HealthResponse {
  status: string;
  geminiConfigured: boolean;
  mode: 'gemini_active' | 'curated_demo_mode';
  timestamp: string;
}

export async function checkServerHealth(): Promise<HealthResponse> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error('Health check failed');
    return await res.json();
  } catch (error) {
    return {
      status: 'offline',
      geminiConfigured: false,
      mode: 'curated_demo_mode',
      timestamp: new Date().toISOString(),
    };
  }
}

export async function generateEventPlan(formData: EventFormData): Promise<{
  plan: CelebrationPlan;
  source: 'gemini' | 'curated_fallback';
  message?: string;
}> {
  try {
    const res = await fetch('/api/plan/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Server responded with status ${res.status}`);
    }

    const data = await res.json();
    return {
      plan: data.plan,
      source: data.meta?.source || 'gemini',
    };
  } catch (error: any) {
    console.warn('[Frontend API] Server error or unavailable. Falling back to local curated planner:', error);
    // Graceful offline fallback
    const fallbackPlan = generateCuratedPlan(formData);
    return {
      plan: fallbackPlan,
      source: 'curated_fallback',
      message: error?.message || 'Generated using CelebrationAI curated planner engine.',
    };
  }
}

export async function regenerateSection(
  currentPlan: CelebrationPlan,
  sectionKey: PlanSectionKey,
  refinementPrompt?: string
): Promise<{
  sectionKey: PlanSectionKey;
  data: any;
  source: 'gemini' | 'curated_fallback';
}> {
  try {
    const res = await fetch('/api/plan/regenerate-section', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPlan,
        sectionKey,
        refinementPrompt,
      }),
    });

    if (!res.ok) {
      throw new Error(`Section regeneration failed with status ${res.status}`);
    }

    const json = await res.json();
    return {
      sectionKey: json.sectionKey,
      data: json.data,
      source: json.source || 'gemini',
    };
  } catch (error) {
    console.warn('[Frontend API] Fallback regenerating section locally:', error);
    const fallbackPlan = generateCuratedPlan(currentPlan.eventDetails);
    return {
      sectionKey,
      data: (fallbackPlan as any)[sectionKey],
      source: 'curated_fallback',
    };
  }
}
