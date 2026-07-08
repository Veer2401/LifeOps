import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";
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

// Fallback for userProfile which might still need local persistence before Firebase auth restores
const KEYS = {
  USER_PROFILE: "@lifeops/userProfile",
  USER_STATE: "@lifeops/userState", // We can keep user state locally for onboarding
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
    await auth.signOut();
  },

  async isAuthenticated(): Promise<boolean> {
    const user = await this.getUser();
    return user !== null || auth.currentUser !== null;
  },
};

// ─── FIRESTORE STORAGE ──────────────────────────────────────────────────────────

const getUid = () => auth.currentUser?.uid;

export const CommitmentStorage = {
  async getAll(): Promise<Commitment[]> {
    const uid = getUid();
    if (!uid) return [];
    
    const snap = await getDocs(collection(db, `users/${uid}/commitments`));
    return snap.docs.map(d => d.data() as Commitment);
  },

  async create(commitment: Omit<Commitment, "id" | "createdAt" | "archived">): Promise<Commitment> {
    const uid = getUid();
    if (!uid) throw new Error("Not authenticated");

    const id = generateId();
    const newCommitment: Commitment = {
      ...commitment,
      id,
      createdAt: new Date().toISOString(),
      archived: false,
    };

    await setDoc(doc(db, `users/${uid}/commitments/${id}`), newCommitment);
    return newCommitment;
  },

  async update(id: string, updates: Partial<Commitment>): Promise<Commitment | null> {
    const uid = getUid();
    if (!uid) return null;

    const ref = doc(db, `users/${uid}/commitments/${id}`);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const updated = { ...snap.data(), ...updates };
    await updateDoc(ref, updates);
    return updated as Commitment;
  },

  async archive(id: string): Promise<boolean> {
    const uid = getUid();
    if (!uid) return false;

    const ref = doc(db, `users/${uid}/commitments/${id}`);
    await updateDoc(ref, { archived: true });
    return true;
  },

  async getActive(): Promise<Commitment[]> {
    const uid = getUid();
    if (!uid) return [];

    const q = query(
      collection(db, `users/${uid}/commitments`),
      where("archived", "==", false)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Commitment);
  },
};

export const FulfillmentStorage = {
  async getAll(): Promise<Fulfillment[]> {
    const uid = getUid();
    if (!uid) return [];

    const snap = await getDocs(collection(db, `users/${uid}/fulfillments`));
    return snap.docs.map(d => d.data() as Fulfillment);
  },

  async fulfill(commitment: Commitment): Promise<Fulfillment> {
    const uid = getUid();
    if (!uid) throw new Error("Not authenticated");

    const today = new Date();
    const capacityConsumed = calculateCapacityCost(commitment);
    const id = generateId();

    const newFulfillment: Fulfillment = {
      id,
      commitmentId: commitment.id,
      date: today.toDateString(),
      fulfilledAt: today.toISOString(),
      capacityConsumed,
    };

    await setDoc(doc(db, `users/${uid}/fulfillments/${id}`), newFulfillment);

    const state = await MentalStateStorage.get();
    if (state) {
      state.capacityUsed += capacityConsumed;
      await MentalStateStorage.save(state);
    }

    return newFulfillment;
  },

  async getTodayFulfillments(): Promise<Fulfillment[]> {
    const uid = getUid();
    if (!uid) return [];

    const todayStr = new Date().toDateString();
    const q = query(
      collection(db, `users/${uid}/fulfillments`),
      where("date", "==", todayStr)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Fulfillment);
  },

  async isFulfilledToday(commitmentId: string): Promise<boolean> {
    const todayFulfillments = await this.getTodayFulfillments();
    return todayFulfillments.some((f) => f.commitmentId === commitmentId);
  },
};

export const SessionStorage = {
  async getAll(): Promise<FocusSession[]> {
    const uid = getUid();
    if (!uid) return [];

    const snap = await getDocs(collection(db, `users/${uid}/sessions`));
    return snap.docs.map(d => d.data() as FocusSession);
  },

  async create(commitmentId: string): Promise<FocusSession> {
    const uid = getUid();
    if (!uid) throw new Error("Not authenticated");

    const id = generateId();
    const newSession: FocusSession = {
      id,
      commitmentId,
      startedAt: new Date().toISOString(),
      duration: 0,
      status: "paused",
    };

    await setDoc(doc(db, `users/${uid}/sessions/${id}`), newSession);
    return newSession;
  },

  async complete(id: string, duration: number, status: FocusSession["status"]): Promise<void> {
    const uid = getUid();
    if (!uid) return;

    const ref = doc(db, `users/${uid}/sessions/${id}`);
    await updateDoc(ref, {
      endedAt: new Date().toISOString(),
      duration,
      status,
    });
  },

  async getTodaysSessions(): Promise<FocusSession[]> {
    const sessions = await this.getAll();
    const today = new Date().toDateString();
    return sessions.filter((s) => new Date(s.startedAt).toDateString() === today);
  },
};

export const MentalStateStorage = {
  async get(): Promise<MentalState | null> {
    const uid = getUid();
    if (!uid) return null;

    const ref = doc(db, `users/${uid}/mentalState/current`);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;

    const state = snap.data() as MentalState;
    const today = new Date().toDateString();

    if (state.date !== today) {
      const fulfillments = await FulfillmentStorage.getAll();
      const todayUsed = calculateTodayCapacityUsed(
        await CommitmentStorage.getActive(),
        fulfillments
      );

      const newState = { ...state, date: today, capacityUsed: todayUsed };
      await setDoc(ref, newState);
      return newState;
    }
    return state;
  },

  async save(state: MentalState): Promise<void> {
    const uid = getUid();
    if (!uid) return;

    await setDoc(doc(db, `users/${uid}/mentalState/current`), state);
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
    const uid = getUid();
    const defaultState: UserState = { onboardingComplete: false, subscriptionTier: "free" };
    
    // If not logged in yet (e.g. during initial boot), check local storage as fallback
    if (!uid) {
      try {
        const data = await AsyncStorage.getItem(KEYS.USER_STATE);
        return data ? JSON.parse(data) : defaultState;
      } catch {
        return defaultState;
      }
    }

    try {
      const ref = doc(db, `users/${uid}/userState/current`);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as UserState;
        // Keep local cache in sync
        await AsyncStorage.setItem(KEYS.USER_STATE, JSON.stringify(data));
        return data;
      } else {
        // First time in Firestore, check local storage
        const localData = await AsyncStorage.getItem(KEYS.USER_STATE);
        if (localData) {
          const parsed = JSON.parse(localData);
          await setDoc(ref, parsed);
          return parsed;
        }

        // Auto-repair: If they wiped local storage before we migrated to Firestore,
        // but their MentalState exists (which is created at the end of onboarding),
        // we know they completed onboarding!
        const mentalSnap = await getDoc(doc(db, `users/${uid}/mentalState/current`));
        if (mentalSnap.exists()) {
          const repairedState: UserState = { onboardingComplete: true, subscriptionTier: "free" };
          await setDoc(ref, repairedState);
          await AsyncStorage.setItem(KEYS.USER_STATE, JSON.stringify(repairedState));
          return repairedState;
        }

        return defaultState;
      }
    } catch {
      return defaultState;
    }
  },

  async save(state: UserState): Promise<void> {
    // Always save locally for fast boot
    await AsyncStorage.setItem(KEYS.USER_STATE, JSON.stringify(state));
    
    const uid = getUid();
    if (uid) {
      const ref = doc(db, `users/${uid}/userState/current`);
      await setDoc(ref, state);
    }
  },

  async completeOnboarding(): Promise<void> {
    const state = await this.get();
    state.onboardingComplete = true;
    await this.save(state);
  },

  async reset(): Promise<void> {
    await AsyncStorage.removeItem(KEYS.USER_STATE);
    // We intentionally DO NOT delete from Firestore here, so if they sign back in, they keep their onboarding status!
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
    await UserStorage.clearUser();
    await UserStateStorage.reset();
  },
};
