import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  Commitment,
  FocusSession,
  MentalState,
  DailyInsight,
  UserState,
  CognitiveWeight,
  COGNITIVE_WEIGHT_COST,
  MENTAL_LOAD_CAPACITY,
} from "@shared/types";

const KEYS = {
  COMMITMENTS: "@lifeops/commitments",
  SESSIONS: "@lifeops/sessions",
  MENTAL_STATE: "@lifeops/mentalState",
  USER_STATE: "@lifeops/userState",
  DAILY_INSIGHTS: "@lifeops/dailyInsights",
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

const WEIGHT_COST: Record<CognitiveWeight, number> = {
  Light: 10,
  Moderate: 25,
  Heavy: 45,
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

  async create(commitment: Omit<Commitment, "id" | "completed" | "createdAt">): Promise<Commitment> {
    const commitments = await this.getAll();
    const newCommitment: Commitment = {
      ...commitment,
      id: generateId(),
      completed: false,
      createdAt: new Date().toISOString(),
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

  async delete(id: string): Promise<boolean> {
    const commitments = await this.getAll();
    const filtered = commitments.filter((c) => c.id !== id);
    if (filtered.length === commitments.length) return false;
    await this.save(filtered);
    return true;
  },

  async markComplete(id: string): Promise<Commitment | null> {
    return this.update(id, {
      completed: true,
      completedAt: new Date().toISOString(),
    });
  },

  async getActive(): Promise<Commitment[]> {
    const commitments = await this.getAll();
    return commitments.filter((c) => !c.completed);
  },

  async getCompletedToday(): Promise<Commitment[]> {
    const commitments = await this.getAll();
    const today = new Date().toDateString();
    return commitments.filter(
      (c) => c.completed && c.completedAt && new Date(c.completedAt).toDateString() === today
    );
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

  async getTodaysTotalTime(): Promise<number> {
    const sessions = await this.getTodaysSessions();
    return sessions
      .filter((s) => s.status === "completed")
      .reduce((sum, s) => sum + s.duration, 0);
  },
};

export const MentalStateStorage = {
  async get(): Promise<MentalState | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.MENTAL_STATE);
      if (!data) return null;
      const state = JSON.parse(data);
      const today = new Date().toDateString();
      if (state.date !== today) return null;
      return state;
    } catch {
      return null;
    }
  },

  async save(state: MentalState): Promise<void> {
    await AsyncStorage.setItem(KEYS.MENTAL_STATE, JSON.stringify(state));
  },

  async updateCapacity(used: number): Promise<void> {
    const state = await this.get();
    if (state) {
      state.capacityUsed = used;
      await this.save(state);
    }
  },
};

export const UserStateStorage = {
  async get(): Promise<UserState> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_STATE);
      return data ? JSON.parse(data) : { onboardingComplete: false };
    } catch {
      return { onboardingComplete: false };
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
};

export const InsightStorage = {
  async generateToday(): Promise<DailyInsight> {
    const completedToday = await CommitmentStorage.getCompletedToday();
    const sessions = await SessionStorage.getTodaysSessions();
    const mentalState = await MentalStateStorage.get();

    const capacityUsed = completedToday.reduce(
      (sum, c) => sum + WEIGHT_COST[c.cognitiveWeight],
      0
    );
    const capacityTotal = mentalState?.capacityTotal || 75;

    const avgDuration = sessions.length > 0
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
      completedCount: completedToday.length,
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
    return "A gentle day with room to breathe. This kind of pacing supports long-term clarity.";
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
