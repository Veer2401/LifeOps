export type Category = "Mind" | "Work" | "Life";
export type CognitiveWeight = "Light" | "Moderate" | "Heavy";
export type EnergyLevel = "Low" | "Moderate" | "High";
export type AvailableTime = 5 | 15 | 30 | 60;
export type MentalLoad = "Very Light" | "Light" | "Moderate" | "Heavy" | "Very Heavy";
export type EnergyMode = "Push" | "Protect";

export interface Commitment {
  id: string;
  title: string;
  category: Category;
  estimatedMinutes: number;
  cognitiveWeight: CognitiveWeight;
  pressurePoint?: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
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
  completedCount: number;
  deferredCount: number;
}

export interface UserState {
  onboardingComplete: boolean;
  lastMentalState?: MentalState;
}

export const COGNITIVE_WEIGHT_COST: Record<CognitiveWeight, number> = {
  Light: 10,
  Moderate: 25,
  Heavy: 45,
};

export const MENTAL_LOAD_CAPACITY: Record<MentalLoad, number> = {
  "Very Light": 120,
  "Light": 100,
  "Moderate": 75,
  "Heavy": 50,
  "Very Heavy": 30,
};
