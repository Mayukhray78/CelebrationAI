export type EventType =
  | 'wedding'
  | 'birthday'
  | 'anniversary'
  | 'community'
  | 'corporate'
  | 'celebration';

export type TaskPriority = 'high' | 'medium' | 'low';

export type VendorStatus = 'not_contacted' | 'shortlisted' | 'contacted' | 'booked';

export interface EventFormData {
  eventName: string;
  eventType: EventType;
  hostName: string;
  location: string;
  eventDate: string;
  guestCount: number;
  totalBudgetINR: number;
  theme: string;
  dietaryPreference?: string;
  specialPreferences: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  allocatedAmount: number;
  percentage: number;
  spentAmount: number;
  description: string;
  priority: 'essential' | 'recommended' | 'optional';
  color: string;
}

export interface TimelineTask {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  completed: boolean;
  category: string;
}

export interface TimelinePhase {
  id: string;
  phaseName: string;
  timeframe: string;
  tasks: TimelineTask[];
}

export interface VendorItem {
  id: string;
  category: string;
  title: string;
  targetBudgetINR: number;
  actualCostINR?: number;
  status: VendorStatus;
  keyDeliverables: string[];
  essentialQuestions: string[];
  recommendedBookingTiming: string;
  notes?: string;
}

export interface ThemeDecorSection {
  themeName: string;
  vibeDescription: string;
  colorPalette: {
    name: string;
    hex: string;
    usage: string;
  }[];
  keyVisualMotifs: string[];
  entranceConcept: string;
  stageAndBackdrop: string;
  tablescapeAndLighting: string;
  photoOpportunityIdea: string;
}

export interface FoodEntertainmentSection {
  diningStyle: string;
  welcomeDrinks: string[];
  starters: string[];
  mainCourses: string[];
  liveCounters: string[];
  desserts: string[];
  dietaryHighlights: string[];
  entertainmentHighlights: {
    title: string;
    description: string;
    timing: string;
  }[];
  signatureMoments: string[];
  partyFavors: string[];
}

export interface CelebrationPlan {
  id: string;
  createdAt: string;
  eventDetails: EventFormData;
  overviewSummary: string;
  generatedBy: 'gemini' | 'curated_fallback';
  modelUsed?: string;
  budgetCategories: BudgetCategory[];
  totalAllocatedBudget: number;
  timelinePhases: TimelinePhase[];
  vendors: VendorItem[];
  themeAndDecor: ThemeDecorSection;
  foodAndEntertainment: FoodEntertainmentSection;
}

export type PlanSectionKey =
  | 'budget'
  | 'timeline'
  | 'vendors'
  | 'themeAndDecor'
  | 'foodAndEntertainment';
