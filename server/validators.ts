import { EventFormData, EventType, PlanSectionKey, CelebrationPlan } from './types.js';

export const VALID_EVENT_TYPES: readonly EventType[] = [
  'wedding',
  'birthday',
  'anniversary',
  'community',
  'corporate',
  'celebration',
] as const;

export const VALID_SECTION_KEYS: readonly PlanSectionKey[] = [
  'budget',
  'timeline',
  'vendors',
  'themeAndDecor',
  'foodAndEntertainment',
] as const;

export interface ValidationResult<T> {
  isValid: boolean;
  errors: string[];
  sanitized?: T;
}

/**
 * Strips potentially harmful control characters and trims string.
 */
export function sanitizeString(input: unknown, maxLength = 500): string {
  if (typeof input !== 'string') return '';
  // Remove ASCII control characters except newline and tab
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates and sanitizes incoming EventFormData from client request.
 */
export function validateEventFormData(body: unknown): ValidationResult<EventFormData> {
  const errors: string[] = [];

  if (!body || typeof body !== 'object') {
    return { isValid: false, errors: ['Request body must be a valid JSON object.'] };
  }

  const data = body as Record<string, unknown>;

  // 1. Event Name
  const rawEventName = sanitizeString(data.eventName, 120);
  if (!rawEventName) {
    errors.push('Event name is required.');
  } else if (rawEventName.length < 3) {
    errors.push('Event name must be at least 3 characters.');
  }

  // 2. Event Type
  const rawEventType = String(data.eventType || '').trim().toLowerCase() as EventType;
  if (!VALID_EVENT_TYPES.includes(rawEventType)) {
    errors.push(
      `Invalid event type "${data.eventType}". Must be one of: ${VALID_EVENT_TYPES.join(', ')}.`,
    );
  }

  // 3. Location
  const rawLocation = sanitizeString(data.location, 100);
  if (!rawLocation) {
    errors.push('Event location / city is required.');
  } else if (rawLocation.length < 2) {
    errors.push('Event location must be at least 2 characters.');
  }

  // 4. Event Date
  const rawDate = sanitizeString(data.eventDate, 20);
  if (!rawDate) {
    errors.push('Event celebration date is required.');
  } else {
    const parsedDate = new Date(rawDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push('Event date must be a valid ISO format (YYYY-MM-DD).');
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      parsedDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((parsedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 0) {
        errors.push('Event date cannot be in the past.');
      } else if (diffDays > 365 * 10) {
        errors.push('Event date cannot be more than 10 years in the future.');
      }
    }
  }

  // 5. Guest Count
  const rawGuestCount = Number(data.guestCount);
  if (!Number.isFinite(rawGuestCount) || !Number.isInteger(rawGuestCount) || rawGuestCount < 1) {
    errors.push('Guest count must be an integer of at least 1.');
  } else if (rawGuestCount > 20000) {
    errors.push('Guest count cannot exceed 20,000 for realistic planning.');
  }

  // 6. Total Budget in INR
  const rawBudget = Number(data.totalBudgetINR);
  if (!Number.isFinite(rawBudget) || isNaN(rawBudget)) {
    errors.push('Total budget in INR is required and must be a number.');
  } else if (rawBudget < 10000) {
    errors.push('Minimum budget must be at least ₹10,000.');
  } else if (rawBudget > 1000000000) {
    // 100 Crore ceiling
    errors.push('Total budget exceeds maximum allowable threshold of ₹100 Crores.');
  }

  // 7. Theme
  const rawTheme = sanitizeString(data.theme, 150);
  if (!rawTheme) {
    errors.push('Preferred theme is required.');
  }

  // Optional fields
  const hostName = sanitizeString(data.hostName, 100);
  const dietaryPreference = sanitizeString(data.dietaryPreference, 300);
  const specialPreferences = sanitizeString(data.specialPreferences, 500);

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  const sanitized: EventFormData = {
    eventName: rawEventName,
    eventType: rawEventType,
    hostName: hostName || '',
    location: rawLocation,
    eventDate: rawDate,
    guestCount: rawGuestCount,
    totalBudgetINR: Math.round(rawBudget),
    theme: rawTheme,
    dietaryPreference,
    specialPreferences,
  };

  return { isValid: true, errors: [], sanitized };
}

export interface RegenerateSectionPayload {
  currentPlan: CelebrationPlan;
  sectionKey: PlanSectionKey;
  refinementPrompt?: string;
}

/**
 * Validates request payload for /api/plan/regenerate-section
 */
export function validateRegenerateSectionInput(body: unknown): ValidationResult<RegenerateSectionPayload> {
  const errors: string[] = [];

  if (!body || typeof body !== 'object') {
    return { isValid: false, errors: ['Request body must be a valid JSON object.'] };
  }

  const data = body as Record<string, unknown>;

  // 1. sectionKey
  const sectionKey = String(data.sectionKey || '').trim() as PlanSectionKey;
  if (!VALID_SECTION_KEYS.includes(sectionKey)) {
    errors.push(
      `Invalid sectionKey "${data.sectionKey}". Must be one of: ${VALID_SECTION_KEYS.join(', ')}.`,
    );
  }

  // 2. currentPlan
  if (!data.currentPlan || typeof data.currentPlan !== 'object') {
    errors.push('currentPlan object is required.');
  } else {
    const plan = data.currentPlan as Partial<CelebrationPlan>;
    if (!plan.eventDetails || typeof plan.eventDetails !== 'object') {
      errors.push('currentPlan must contain valid eventDetails.');
    }
  }

  // 3. refinementPrompt
  const refinementPrompt = sanitizeString(data.refinementPrompt, 500);

  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  return {
    isValid: true,
    errors: [],
    sanitized: {
      currentPlan: data.currentPlan as CelebrationPlan,
      sectionKey,
      refinementPrompt,
    },
  };
}
