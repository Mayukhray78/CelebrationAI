import dotenv from 'dotenv';
dotenv.config();

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  CelebrationPlan,
  EventFormData,
  PlanSectionKey,
  BudgetCategory,
  TimelinePhase,
  VendorItem,
  ThemeDecorSection,
  FoodEntertainmentSection,
} from './types.js';
import { generateCuratedPlan } from './mockPlanGenerator.js';

export function getApiKey(): string {
  const key = process.env.GEMINI_API_KEY || '';
  return key.trim();
}

export function isGeminiConfigured(): boolean {
  const key = getApiKey();
  return Boolean(key && key !== 'your_gemini_api_key_here');
}

export function getGeminiModelName(): string {
  return process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
}

function getGenAI(): GoogleGenerativeAI | null {
  const key = getApiKey();
  if (isGeminiConfigured()) {
    return new GoogleGenerativeAI(key);
  }
  return null;
}

/**
 * Timeout wrapper for Gemini API calls to prevent hanging requests.
 */
async function generateWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 28000,
): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`Gemini request exceeded timeout of ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

/**
 * Sanitizes minor syntax flaws from model output such as:
 * - Trailing commas before } or ]
 * - TypeScript union pipes like "essential" | "recommended"
 * - C-style comments
 * - Single-quoted property names or values
 */
export function sanitizeJsonString(str: string): string {
  return str
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '') // remove comments
    .replace(/:\s*"([^"]+)"\s*(?:\|\s*"[^"]+"\s*)+/g, ': "$1"') // replace "a" | "b" | "c" with "a"
    .replace(/([{,]\s*)'([^']+)'\s*:/g, '$1"$2":') // replace 'key': with "key":
    .replace(/:\s*'([^']*)'/g, ': "$1"') // replace : 'value' with : "value"
    .replace(/,\s*([}\]])/g, '$1') // remove trailing commas
    .trim();
}

/**
 * Robustly extracts and parses JSON from Gemini responses,
 * even when wrapped in markdown codeblocks (```json ... ```) or conversational preambles.
 */
export function extractJSON<T = Record<string, unknown>>(rawText: string): T {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Empty response from model');
  }

  const trimmed = rawText.trim();

  // Try extracting from ```json ... ``` or ``` ... ```
  const codeBlockMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const targetStr = codeBlockMatch && codeBlockMatch[1] ? codeBlockMatch[1].trim() : trimmed;

  try {
    return JSON.parse(targetStr) as T;
  } catch {
    // Try sanitized version
    try {
      return JSON.parse(sanitizeJsonString(targetStr)) as T;
    } catch {
      // Try finding the first '{' and last '}'
      const firstBrace = targetStr.indexOf('{');
      const lastBrace = targetStr.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace > firstBrace) {
        const candidate = targetStr.substring(firstBrace, lastBrace + 1);
        try {
          return JSON.parse(candidate) as T;
        } catch {
          return JSON.parse(sanitizeJsonString(candidate)) as T;
        }
      }
      throw new Error('Failed to locate valid JSON structure in model response');
    }
  }
}

/**
 * Normalizes budget allocations so the sum of category allocatedAmount
 * strictly equals totalBudgetINR without any rounding loss or discrepancy.
 */
export function normalizeBudgetMath(
  totalBudgetINR: number,
  categories: Partial<BudgetCategory>[] | Record<string, unknown>[],
): BudgetCategory[] {
  if (!Array.isArray(categories) || categories.length === 0) {
    return [];
  }

  const safeTotal = Math.max(1000, Math.round(totalBudgetINR));
  const rawSum = categories.reduce((sum, c) => sum + (Number(c.allocatedAmount) || 0), 0);

  let runningSum = 0;
  const defaultColors = ['#6D28D9', '#7C3AED', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#64748B'];

  return categories.map((cat, idx) => {
    let amount = 0;
    if (idx === categories.length - 1) {
      amount = Math.max(0, safeTotal - runningSum);
    } else {
      if (rawSum > 0) {
        amount = Math.round((Number(cat.allocatedAmount || 0) / rawSum) * safeTotal);
      } else {
        amount = Math.round(safeTotal / categories.length);
      }
      runningSum += amount;
    }

    const priorityVal = String(cat.priority || '').toLowerCase();
    const priority = (['essential', 'recommended', 'optional'].includes(priorityVal)
      ? priorityVal
      : 'essential') as 'essential' | 'recommended' | 'optional';

    return {
      id: String(cat.id || `cat-${idx + 1}`),
      name: String(cat.name || `Category ${idx + 1}`),
      allocatedAmount: amount,
      percentage: Math.round((amount / safeTotal) * 100),
      spentAmount: Number(cat.spentAmount) || 0,
      description: String(cat.description || ''),
      priority,
      color: String(cat.color || defaultColors[idx % defaultColors.length]),
    };
  });
}

/**
 * Generates an event plan using Google Gemini or falls back to curated engine if key is absent or on API error.
 */
export async function generatePlanWithGemini(formData: EventFormData): Promise<CelebrationPlan> {
  const genAI = getGenAI();
  if (!genAI) {
    console.log('[Gemini Backend] GEMINI_API_KEY not configured or placeholder detected. Using Curated Dynamic Plan Engine.');
    return generateCuratedPlan(formData);
  }

  const primaryModel = getGeminiModelName();
  const fallbackModel = 'gemini-3.5-flash-lite';

  try {
    const prompt = `You are CelebrationAI, an elite event planner and financial strategist specializing in culturally rich, flawless events in India.
Create a comprehensive, personalized, and financially realistic event plan for the following event details:

Event Details:
- Event Name: ${formData.eventName}
- Event Type: ${formData.eventType}
- Host/Organizer: ${formData.hostName}
- Location: ${formData.location}
- Event Date: ${formData.eventDate}
- Guest Count: ${formData.guestCount}
- Total Budget in INR: ₹${formData.totalBudgetINR.toLocaleString('en-IN')}
- Preferred Theme / Vibe: ${formData.theme}
- Dietary Preferences: ${formData.dietaryPreference || 'Not specified'}
- Special Preferences / Notes: ${formData.specialPreferences || 'None'}

CRITICAL FINANCIAL & PLANNING RULES:
1. All costs MUST be in Indian Rupees (INR).
2. The sum of allocatedAmount across budgetCategories MUST approximately match ₹${formData.totalBudgetINR}.
3. Break the budget into 5 to 7 realistic categories (e.g. Venue & Staging, Catering & Bar, Decor & Floral, Photography & Film, Entertainment & Sound, Invites & Favors, Contingency Buffer).
4. Provide a structured 4-phase preparation timeline (Foundation, Theme & Vendors, Final Logistics, Event Day) with actionable tasks and priority (high, medium, low).
5. Provide 4-6 vendor checklist items with estimated target budgets, key deliverables, and essential questions to ask during vendor interviews. IMPORTANT: Do NOT fabricate real vendor companies or fake availability; format as vendor procurement guidelines.
6. Provide a rich Theme & Decor concept with color palette (names and hex codes), entrance concept, stage backdrop, and photo opportunity idea.
7. Provide an exquisite Food & Entertainment plan with dining style, welcome drinks, starters, mains, live counters, desserts, dietary provisions, and timed entertainment highlights.
8. Output STRICTLY parseable JSON. Do NOT output union pipes like "a" | "b" or unquoted keys.

Return STRICTLY a JSON object matching this schema:
{
  "overviewSummary": "string (warm, executive summary of the plan)",
  "budgetCategories": [
    {
      "id": "cat-1",
      "name": "string",
      "allocatedAmount": number,
      "spentAmount": 0,
      "description": "string",
      "priority": "essential",
      "color": "string (hex code)"
    }
  ],
  "timelinePhases": [
    {
      "id": "phase-1",
      "phaseName": "string",
      "timeframe": "string",
      "tasks": [
        {
          "id": "t-1",
          "title": "string",
          "description": "string",
          "priority": "high",
          "dueDate": "YYYY-MM-DD",
          "completed": false,
          "category": "string"
        }
      ]
    }
  ],
  "vendors": [
    {
      "id": "v-1",
      "category": "string",
      "title": "string",
      "targetBudgetINR": number,
      "status": "not_contacted",
      "recommendedBookingTiming": "string",
      "keyDeliverables": ["string"],
      "essentialQuestions": ["string"],
      "notes": "string"
    }
  ],
  "themeAndDecor": {
    "themeName": "string",
    "vibeDescription": "string",
    "colorPalette": [
      {
        "name": "string",
        "hex": "#HEX",
        "usage": "string"
      }
    ],
    "keyVisualMotifs": ["string"],
    "entranceConcept": "string",
    "stageAndBackdrop": "string",
    "tablescapeAndLighting": "string",
    "photoOpportunityIdea": "string"
  },
  "foodAndEntertainment": {
    "diningStyle": "string",
    "welcomeDrinks": ["string"],
    "starters": ["string"],
    "mainCourses": ["string"],
    "liveCounters": ["string"],
    "desserts": ["string"],
    "dietaryHighlights": ["string"],
    "entertainmentHighlights": [
      {
        "title": "string",
        "timing": "string",
        "description": "string"
      }
    ],
    "signatureMoments": ["string"],
    "partyFavors": ["string"]
  }
}`;

    let parsed: any;
    let usedModel = primaryModel;

    try {
      const model = genAI.getGenerativeModel({
        model: primaryModel,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });
      const result = await generateWithTimeout(model.generateContent(prompt));
      parsed = extractJSON(result.response.text());
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[Gemini Backend] ${primaryModel} failed (${errMsg}), retrying with ${fallbackModel}...`);
      usedModel = fallbackModel;
      const model = genAI.getGenerativeModel({
        model: fallbackModel,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });
      const result = await generateWithTimeout(model.generateContent(prompt));
      parsed = extractJSON(result.response.text());
    }

    // Apply strict financial normalization in application code
    const rawCategories = Array.isArray(parsed.budgetCategories) ? parsed.budgetCategories : [];
    const normalizedBudgetCategories = normalizeBudgetMath(
      formData.totalBudgetINR,
      rawCategories,
    );

    const plan: CelebrationPlan = {
      id: `plan-${Date.now()}`,
      createdAt: new Date().toISOString(),
      eventDetails: formData,
      overviewSummary: parsed.overviewSummary || `Customized celebration plan for ${formData.eventName}`,
      generatedBy: 'gemini',
      modelUsed: usedModel,
      budgetCategories: normalizedBudgetCategories,
      totalAllocatedBudget: formData.totalBudgetINR,
      timelinePhases: Array.isArray(parsed.timelinePhases) ? parsed.timelinePhases : [],
      vendors: Array.isArray(parsed.vendors) ? parsed.vendors : [],
      themeAndDecor: (parsed.themeAndDecor || {}) as ThemeDecorSection,
      foodAndEntertainment: (parsed.foodAndEntertainment || {}) as FoodEntertainmentSection,
    };

    return plan;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Gemini Backend] Error generating plan with Gemini API:', errMsg);
    console.log('[Gemini Backend] Safely falling back to curated dynamic event plan engine.');
    const fallback = generateCuratedPlan(formData);
    fallback.overviewSummary = `[Curated Engine Fallback] ${fallback.overviewSummary}`;
    return fallback;
  }
}

/**
 * Regenerates an individual section of an existing plan using Gemini or curated engine.
 */
export async function regenerateSectionWithGemini(
  currentPlan: CelebrationPlan,
  sectionKey: PlanSectionKey,
  refinementPrompt?: string,
): Promise<{ sectionKey: PlanSectionKey; data: unknown; source: 'gemini' | 'curated_fallback'; modelUsed?: string }> {
  const genAI = getGenAI();
  if (!genAI) {
    console.log(`[Gemini Backend] Gemini key not present. Using curated regeneration for section: ${sectionKey}`);
    const freshPlan = generateCuratedPlan(currentPlan.eventDetails);
    return {
      sectionKey,
      data: freshPlan[sectionKey as keyof CelebrationPlan],
      source: 'curated_fallback',
      modelUsed: 'CelebrationAI Expert Curated Engine',
    };
  }

  const primaryModel = getGeminiModelName();
  const fallbackModel = 'gemini-3.5-flash-lite';

  const sectionSchemas: Record<PlanSectionKey, string> = {
    budget: `Return strictly a JSON object:
{
  "budgetCategories": [
    {
      "id": "cat-1",
      "name": "Category Name",
      "allocatedAmount": 500000,
      "spentAmount": 0,
      "description": "Category inclusions",
      "priority": "essential",
      "color": "#6D28D9"
    }
  ]
}`,
    timeline: `Return strictly a JSON object:
{
  "timelinePhases": [
    {
      "id": "phase-1",
      "phaseName": "Phase Name",
      "timeframe": "Timeframe",
      "tasks": [
        {
          "id": "t-1",
          "title": "Task title",
          "description": "Task details",
          "priority": "high",
          "dueDate": "${currentPlan.eventDetails.eventDate}",
          "completed": false,
          "category": "Category"
        }
      ]
    }
  ]
}`,
    vendors: `Return strictly a JSON object:
{
  "vendors": [
    {
      "id": "v-1",
      "category": "Vendor Type",
      "title": "Vendor Title",
      "targetBudgetINR": 250000,
      "status": "not_contacted",
      "recommendedBookingTiming": "60 days prior",
      "keyDeliverables": ["Deliverable 1"],
      "essentialQuestions": ["Question 1"],
      "notes": "Guidance note"
    }
  ]
}`,
    themeAndDecor: `Return strictly a JSON object:
{
  "themeAndDecor": {
    "themeName": "Theme Title",
    "vibeDescription": "Atmosphere description",
    "colorPalette": [
      { "name": "Color Name", "hex": "#6D28D9", "usage": "Usage details" }
    ],
    "keyVisualMotifs": ["Motif 1"],
    "entranceConcept": "Walkway styling",
    "stageAndBackdrop": "Main focal area",
    "tablescapeAndLighting": "Centerpiece & mood lights",
    "photoOpportunityIdea": "Photo installation idea"
  }
}`,
    foodAndEntertainment: `Return strictly a JSON object:
{
  "foodAndEntertainment": {
    "diningStyle": "Buffet / Plated Style",
    "welcomeDrinks": ["Drink 1"],
    "starters": ["Starter 1"],
    "mainCourses": ["Main 1"],
    "liveCounters": ["Counter 1"],
    "desserts": ["Dessert 1"],
    "dietaryHighlights": ["Dietary provision 1"],
    "entertainmentHighlights": [
      { "title": "Act Title", "timing": "7:00 PM", "description": "Act details" }
    ],
    "signatureMoments": ["Moment 1"],
    "partyFavors": ["Favor 1"]
  }
}`,
  };

  try {
    const prompt = `You are CelebrationAI. You are asked to regenerate ONLY ONE section ("${sectionKey}") of an existing event plan.

Event Context & Strict Constraints:
- Event: ${currentPlan.eventDetails.eventName} (${currentPlan.eventDetails.eventType})
- Location: ${currentPlan.eventDetails.location}
- Date: ${currentPlan.eventDetails.eventDate}
- Guests: ${currentPlan.eventDetails.guestCount}
- Total Budget: ₹${currentPlan.eventDetails.totalBudgetINR.toLocaleString('en-IN')} (Strict INR ceiling)
- Current Theme: ${currentPlan.eventDetails.theme}
- Dietary Preferences: ${currentPlan.eventDetails.dietaryPreference || 'Standard multi-cuisine'}
- Special Requests: ${currentPlan.eventDetails.specialPreferences || 'None'}

User refinement instructions: ${refinementPrompt || 'Provide fresh, innovative, yet budget-conscious ideas while strictly preserving event constraints.'}

Expected output format:
${sectionSchemas[sectionKey]}

CRITICAL RULES:
1. Return STRICTLY parseable JSON conforming to the schema above.
2. For budget, ensure the sum of allocatedAmount equals ₹${currentPlan.eventDetails.totalBudgetINR}.
3. For food, respect all dietary constraints: "${currentPlan.eventDetails.dietaryPreference || 'None'}".
4. Never fabricate real vendors or real vendor availability.`;

    let parsed: any;
    let usedModel = primaryModel;

    try {
      const model = genAI.getGenerativeModel({
        model: primaryModel,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.8,
        },
      });
      const result = await generateWithTimeout(model.generateContent(prompt));
      parsed = extractJSON(result.response.text());
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[Gemini Backend] ${primaryModel} section regen failed (${errMsg}), retrying with ${fallbackModel}...`);
      usedModel = fallbackModel;
      const model = genAI.getGenerativeModel({
        model: fallbackModel,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.8,
        },
      });
      const result = await generateWithTimeout(model.generateContent(prompt));
      parsed = extractJSON(result.response.text());
    }

    let data: unknown;

    if (sectionKey === 'budget') {
      const raw = (parsed.budgetCategories || parsed.budget || (Array.isArray(parsed) ? parsed : [])) as Partial<BudgetCategory>[];
      data = normalizeBudgetMath(currentPlan.eventDetails.totalBudgetINR, raw);
    } else if (sectionKey === 'timeline') {
      data = parsed.timelinePhases || parsed.timeline || (Array.isArray(parsed) ? parsed : []);
    } else if (sectionKey === 'vendors') {
      data = parsed.vendors || (Array.isArray(parsed) ? parsed : []);
    } else if (sectionKey === 'themeAndDecor') {
      data = parsed.themeAndDecor || parsed.theme || parsed;
    } else if (sectionKey === 'foodAndEntertainment') {
      data = parsed.foodAndEntertainment || parsed.food || parsed;
    } else {
      data = parsed[sectionKey] || parsed;
    }

    return {
      sectionKey,
      data,
      source: 'gemini',
      modelUsed: usedModel,
    };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Gemini Backend] Error regenerating section ${sectionKey}:`, errMsg);
    const freshPlan = generateCuratedPlan(currentPlan.eventDetails);
    return {
      sectionKey,
      data: (freshPlan as any)[sectionKey],
      source: 'curated_fallback',
      modelUsed: 'CelebrationAI Expert Curated Engine',
    };
  }
}
