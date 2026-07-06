import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  Commitment,
  FocusSession,
  MentalState,
  DailyInsight,
  UserState,
  Fulfillment,
  TodayCommitment,
  AdaptivePlan,
} from "@shared/types";
import {
  calculateCapacityCost,
  getTodayCommitments,
  calculateTodayCapacityUsed,
  buildAdaptivePlan,
} from "./cognitiveEngine";

const KEYS = {
  COMMITMENTS: "@lifeops/commitments",
  FULFILLMENTS: "@lifeops/fulfillments",
  SESSIONS: "@lifeops/sessions",
  MENTAL_STATE: "@lifeops/mentalState",
  USER_STATE: "@lifeops/userState",
  DAILY_INSIGHTS: "@lifeops/dailyInsights",
  USER_PROFILE: "@lifeops/userProfile",
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export interface UserProfile {
  name: string;
  email?: string;
  provider: "google" | "apple" | "guest";
  appleUserId?: string;
}

export const UserStorage = {
  async getUser(): Promise<UserProfile | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async saveUser(user: UserProfile): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(user));
  },

  async clearUser(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.USER_PROFILE);
  },

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getUser();
    return user !== null;
  },
};

export const CommitmentStorage = {
  async getAll(): Promise<Commitment[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.COMMITMENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async save(commitments: Commitment[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.COMMITMENTS, JSON.stringify(commitments));
  },

  async create(commitment: Omit<Commitment, "id" | "createdAt" | "archived">): Promise<Commitment> {
    const commitments = await this.getAll();
    const newCommitment: Commitment = {
      ...commitment,
      id: generateId(),
      createdAt: new Date().toISOString(),
      archived: false,
    };
    await this.save([...commitments, newCommitment]);
    return newCommitment;
  },

  async update(id: string, updates: Partial<Commitment>): Promise<Commitment | null> {
    const commitments = await this.getAll();
    const index = commitments.findIndex((c) => c.id === id);
    if (index === -1) return null;

    commitments[index] = { ...commitments[index], ...updates };
    await this.save(commitments);
    return commitments[index];
  },

  async archive(id: string): Promise<boolean> {
    const commitments = await this.getAll();
    const index = commitments.findIndex((c) => c.id === id);
    if (index === -1) return false;

    commitments[index].archived = true;
    await this.save(commitments);
    return true;
  },

  async getActive(): Promise<Commitment[]> {
    const commitments = await this.getAll();
    return commitments.filter((c) => !c.archived);
  },
};

export const FulfillmentStorage = {
  async getAll(): Promise<Fulfillment[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.FULFILLMENTS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async save(fulfillments: Fulfillment[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.FULFILLMENTS, JSON.stringify(fulfillments));
  },

  async fulfill(commitment: Commitment): Promise<Fulfillment> {
    const fulfillments = await this.getAll();
    const today = new Date();
    const capacityConsumed = calculateCapacityCost(commitment);

    const newFulfillment: Fulfillment = {
      id: generateId(),
      commitmentId: commitment.id,
      date: today.toDateString(),
      fulfilledAt: today.toISOString(),
      capacityConsumed,
    };

    await this.save([...fulfillments, newFulfillment]);

    const state = await MentalStateStorage.get();
    if (state) {
      state.capacityUsed += capacityConsumed;
      await MentalStateStorage.save(state);
    }

    return newFulfillment;
  },

  async getTodayFulfillments(): Promise<Fulfillment[]> {
    const fulfillments = await this.getAll();
    const today = new Date().toDateString();
    return fulfillments.filter((f) => new Date(f.date).toDateString() === today);
  },

  async isFulfilledToday(commitmentId: string): Promise<boolean> {
    const todayFulfillments = await this.getTodayFulfillments();
    return todayFulfillments.some((f) => f.commitmentId === commitmentId);
  },
};

export const SessionStorage = {
  async getAll(): Promise<FocusSession[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async save(sessions: FocusSession[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
  },

  async create(commitmentId: string): Promise<FocusSession> {
    const sessions = await this.getAll();
    const newSession: FocusSession = {
      id: generateId(),
      commitmentId,
      startedAt: new Date().toISOString(),
      duration: 0,
      status: "paused",
    };
    await this.save([...sessions, newSession]);
    return newSession;
  },

  async complete(id: string, duration: number, status: FocusSession["status"]): Promise<void> {
    const sessions = await this.getAll();
    const index = sessions.findIndex((s) => s.id === id);
    if (index !== -1) {
      sessions[index] = {
        ...sessions[index],
        endedAt: new Date().toISOString(),
        duration,
        status,
      };
      await this.save(sessions);
    }
  },

  async getTodaysSessions(): Promise<FocusSession[]> {
    const sessions = await this.getAll();
    const today = new Date().toDateString();
    return sessions.filter((s) => new Date(s.startedAt).toDateString() === today);
  },
};

export const MentalStateStorage = {
  async get(): Promise<MentalState | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.MENTAL_STATE);
      if (!data) return null;
      const state = JSON.parse(data);
      const today = new Date().toDateString();

      if (state.date !== today) {
        const fulfillments = await FulfillmentStorage.getAll();
        const todayUsed = calculateTodayCapacityUsed(
          await CommitmentStorage.getActive(),
          fulfillments
        );

        return {
          ...state,
          date: today,
          capacityUsed: todayUsed,
        };
      }
      return state;
    } catch {
      return null;
    }
  },

  async save(state: MentalState): Promise<void> {
    await AsyncStorage.setItem(KEYS.MENTAL_STATE, JSON.stringify(state));
  },

  async refreshCapacity(): Promise<MentalState | null> {
    const state = await this.get();
    if (!state) return null;

    const [commitments, fulfillments] = await Promise.all([
      CommitmentStorage.getActive(),
      FulfillmentStorage.getAll(),
    ]);

    state.capacityUsed = calculateTodayCapacityUsed(commitments, fulfillments);
    await this.save(state);
    return state;
  },
};

export const UserStateStorage = {
  async get(): Promise<UserState> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_STATE);
      return data
        ? JSON.parse(data)
        : { onboardingComplete: false, subscriptionTier: "free" };
    } catch {
      return { onboardingComplete: false, subscriptionTier: "free" };
    }
  },

  async save(state: UserState): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER_STATE, JSON.stringify(state));
  },

  async completeOnboarding(): Promise<void> {
    const state = await this.get();
    state.onboardingComplete = true;
    await this.save(state);
  },

  async reset(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.USER_STATE);
  },
};

export const TodayStorage = {
  async getTodayCommitments(): Promise<TodayCommitment[]> {
    const [commitments, fulfillments] = await Promise.all([
      CommitmentStorage.getActive(),
      FulfillmentStorage.getAll(),
    ]);
    return getTodayCommitments(commitments, fulfillments);
  },

  async getUnfulfilled(): Promise<TodayCommitment[]> {
    const today = await this.getTodayCommitments();
    return today.filter((tc) => !tc.fulfilled);
  },

  async getFulfilledCount(): Promise<number> {
    const today = await this.getTodayCommitments();
    return today.filter((tc) => tc.fulfilled).length;
  },
};

export const InsightStorage = {
  async generateToday(): Promise<DailyInsight> {
    const [commitments, fulfillments, sessions, mentalState] = await Promise.all([
      CommitmentStorage.getActive(),
      FulfillmentStorage.getTodayFulfillments(),
      SessionStorage.getTodaysSessions(),
      MentalStateStorage.get(),
    ]);

    const capacityUsed = fulfillments.reduce((sum, f) => sum + f.capacityConsumed, 0);
    const capacityTotal = mentalState?.capacityTotal || 75;

    const avgDuration =
      sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length
        : 0;

    let sessionPattern: "short" | "balanced" | "deep" = "balanced";
    if (avgDuration < 600) sessionPattern = "short";
    else if (avgDuration > 1800) sessionPattern = "deep";

    const morningCount = sessions.filter((s) => {
      const hour = new Date(s.startedAt).getHours();
      return hour >= 6 && hour < 12;
    }).length;
    const afternoonCount = sessions.filter((s) => {
      const hour = new Date(s.startedAt).getHours();
      return hour >= 12 && hour < 17;
    }).length;
    const eveningCount = sessions.filter((s) => {
      const hour = new Date(s.startedAt).getHours();
      return hour >= 17 || hour < 6;
    }).length;

    let peakFocusTime: "morning" | "afternoon" | "evening" = "morning";
    if (afternoonCount > morningCount && afternoonCount > eveningCount) {
      peakFocusTime = "afternoon";
    } else if (eveningCount > morningCount && eveningCount > afternoonCount) {
      peakFocusTime = "evening";
    }

    const insight = generateInsight(sessionPattern, peakFocusTime, capacityUsed, capacityTotal);
    const deferredCount = sessions.filter((s) => s.status === "deferred").length;

    return {
      date: new Date().toDateString(),
      capacityUsed,
      capacityTotal,
      sessionPattern,
      peakFocusTime,
      insight,
      fulfilledCount: fulfillments.length,
      completedCount: fulfillments.length,
      deferredCount,
    };
  },
};

function generateInsight(
  pattern: "short" | "balanced" | "deep",
  peak: "morning" | "afternoon" | "evening",
  used: number,
  total: number
): string {
  const ratio = used / total;

  if (ratio < 0.3) {
    return "A gentle day with room to breathe. This pacing supports long-term mental clarity.";
  }

  if (ratio > 0.9) {
    return "Your mental capacity was fully engaged today. Consider lighter commitments tomorrow.";
  }

  if (pattern === "short") {
    return `Short focus sessions shaped your day. Your mental energy peaked in the ${peak}.`;
  }

  if (pattern === "deep") {
    return `Deep focus sessions worked well for you. The ${peak} held your strongest concentration.`;
  }

  return `Balanced pacing today. Your focus quality was highest in the ${peak}. Sustainable rhythm.`;
}

export const PlannerStorage = {
  async generateAdaptivePlan(): Promise<AdaptivePlan | null> {
    const [commitments, fulfillments, mentalState] = await Promise.all([
      CommitmentStorage.getActive(),
      FulfillmentStorage.getAll(),
      MentalStateStorage.get(),
    ]);

    if (!mentalState) return null;

    const todayCommitments = getTodayCommitments(commitments, fulfillments);
    return buildAdaptivePlan(todayCommitments, mentalState);
  },
};

export const AppStorage = {
  async signOut(): Promise<void> {
    await UserStorage.clearUser();
    await UserStateStorage.reset();
  },

  async clearAll(): Promise<void> {
    const keys = Object.values(KEYS);
    await AsyncStorage.multiRemove(keys);
  },
};
