import { EventFormData, CelebrationPlan, PlanSectionKey } from '../types';

export interface HealthResponse {
  status: string;
  geminiConfigured: boolean;
  mode: 'gemini_active' | 'curated_demo_mode';
  model?: string;
  timestamp: string;
}

// In-flight request controller to prevent duplicate/overlapping generations
let activeGenerateController: AbortController | null = null;
let activeRegenerateController: AbortController | null = null;

export async function checkServerHealth(): Promise<HealthResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch('/api/health', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error('Health check failed');
    return (await res.json()) as HealthResponse;
  } catch {
    clearTimeout(timeoutId);
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
  // Abort any ongoing plan generation to avoid duplicate responses
  if (activeGenerateController) {
    activeGenerateController.abort();
  }
  activeGenerateController = new AbortController();
  const controller = activeGenerateController;

  const timeoutId = setTimeout(() => controller.abort(), 35000);

  try {
    const res = await fetch('/api/plan/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errData = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(errData.error || `Server responded with status ${res.status}`);
    }

    const data = (await res.json()) as {
      plan: CelebrationPlan;
      meta?: { source?: 'gemini' | 'curated_fallback' };
    };

    return {
      plan: data.plan,
      source: data.meta?.source || 'gemini',
    };
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    // If request was manually aborted by a newer user request, rethrow
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.warn('[Frontend API] Previous generation request aborted.');
    }

    console.warn('[Frontend API] Server error or offline. Dynamically loading curated planner fallback...');
    // Lazy-load mock generator so it is excluded from the initial main chunk
    const { generateCuratedPlan } = await import('./mockPlanGenerator');
    const fallbackPlan = generateCuratedPlan(formData);

    const errorMessage = error instanceof Error ? error.message : 'Curated planner engine engaged.';

    return {
      plan: fallbackPlan,
      source: 'curated_fallback',
      message: errorMessage,
    };
  } finally {
    if (activeGenerateController === controller) {
      activeGenerateController = null;
    }
  }
}

export async function regenerateSection(
  currentPlan: CelebrationPlan,
  sectionKey: PlanSectionKey,
  refinementPrompt?: string,
): Promise<{
  sectionKey: PlanSectionKey;
  data: unknown;
  source: 'gemini' | 'curated_fallback';
}> {
  if (activeRegenerateController) {
    activeRegenerateController.abort();
  }
  activeRegenerateController = new AbortController();
  const controller = activeRegenerateController;

  const timeoutId = setTimeout(() => controller.abort(), 35000);

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
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      const errData = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(errData.error || `Section regeneration failed with status ${res.status}`);
    }

    const json = (await res.json()) as {
      sectionKey: PlanSectionKey;
      data: unknown;
      source?: 'gemini' | 'curated_fallback';
    };

    return {
      sectionKey: json.sectionKey,
      data: json.data,
      source: json.source || 'gemini',
    };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    console.warn('[Frontend API] Fallback regenerating section locally:', error);
    const { generateCuratedPlan } = await import('./mockPlanGenerator');
    const fallbackPlan = generateCuratedPlan(currentPlan.eventDetails);
    return {
      sectionKey,
      data: (fallbackPlan as unknown as Record<string, unknown>)[sectionKey],
      source: 'curated_fallback',
    };
  } finally {
    if (activeRegenerateController === controller) {
      activeRegenerateController = null;
    }
  }
}
