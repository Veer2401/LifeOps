export type Category = "Life" | "Work" | "Health";
export type CognitiveWeight = "Low" | "Moderate" | "High";
export type EnergyLevel = "Low" | "Moderate" | "High";
export type AvailableTime = 5 | 15 | 30 | 60;
export type MentalLoad = "Very Light" | "Light" | "Moderate" | "Heavy" | "Very Heavy";
export type EnergyMode = "Push" | "Protect";
export type RepeatPattern = "daily" | "weekly" | "monthly";
export type CommitmentNature = "tiring" | "neutral" | "energizing";

export interface Commitment {
  id: string;
  title: string;
  category: Category;
  estimatedMinutes: number;
  cognitiveWeight: CognitiveWeight;
  repeatPattern: RepeatPattern;
  nature: CommitmentNature;
  startDate: string;
  createdAt: string;
  archived: boolean;
}

export interface Fulfillment {
  id: string;
  commitmentId: string;
  date: string;
  fulfilledAt: string;
  capacityConsumed: number;
}

export interface TodayCommitment {
  commitment: Commitment;
  dueDate: string;
  fulfilled: boolean;
  fulfillment?: Fulfillment;
}

export interface FocusSession {
  id: string;
  commitmentId: string;
  startedAt: string;
  endedAt?: string;
  duration: number;
  status: "completed" | "paused" | "deferred";
}

export interface MentalState {
  date: string;
  mentalLoad: MentalLoad;
  availableTime: AvailableTime;
  energyMode: EnergyMode;
  capacityUsed: number;
  capacityTotal: number;
}

export interface DailyInsight {
  date: string;
  capacityUsed: number;
  capacityTotal: number;
  sessionPattern: "short" | "balanced" | "deep";
  peakFocusTime: "morning" | "afternoon" | "evening";
  insight: string;
  fulfilledCount: number;
  deferredCount: number;
}

export interface UserState {
  onboardingComplete: boolean;
  lastMentalState?: MentalState;
  subscriptionTier: "free" | "pro";
}

export const COGNITIVE_WEIGHT_COST: Record<CognitiveWeight, number> = {
  Low: 10,
  Moderate: 25,
  High: 45,
};

export const MENTAL_LOAD_CAPACITY: Record<MentalLoad, number> = {
  "Very Light": 120,
  "Light": 100,
  "Moderate": 75,
  "Heavy": 50,
  "Very Heavy": 30,
};

export const NATURE_MODIFIER: Record<CommitmentNature, number> = {
  tiring: 1.2,
  neutral: 1.0,
  energizing: 0.7,
};
