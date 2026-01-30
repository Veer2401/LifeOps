import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Task, FocusSession, UserPreferences, DailyReplay } from "@shared/types";

const KEYS = {
  TASKS: "@lifeops/tasks",
  SESSIONS: "@lifeops/sessions",
  PREFERENCES: "@lifeops/preferences",
  DAILY_REPLAYS: "@lifeops/dailyReplays",
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export const TaskStorage = {
  async getAll(): Promise<Task[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.TASKS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  async save(tasks: Task[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
  },

  async create(task: Omit<Task, "id" | "completed" | "createdAt">): Promise<Task> {
    const tasks = await this.getAll();
    const newTask: Task = {
      ...task,
      id: generateId(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    await this.save([...tasks, newTask]);
    return newTask;
  },

  async update(id: string, updates: Partial<Task>): Promise<Task | null> {
    const tasks = await this.getAll();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;
    
    tasks[index] = { ...tasks[index], ...updates };
    await this.save(tasks);
    return tasks[index];
  },

  async delete(id: string): Promise<boolean> {
    const tasks = await this.getAll();
    const filtered = tasks.filter((t) => t.id !== id);
    if (filtered.length === tasks.length) return false;
    await this.save(filtered);
    return true;
  },

  async markComplete(id: string): Promise<Task | null> {
    return this.update(id, {
      completed: true,
      completedAt: new Date().toISOString(),
    });
  },

  async getIncomplete(): Promise<Task[]> {
    const tasks = await this.getAll();
    return tasks.filter((t) => !t.completed);
  },

  async getCompletedToday(): Promise<Task[]> {
    const tasks = await this.getAll();
    const today = new Date().toDateString();
    return tasks.filter(
      (t) => t.completed && t.completedAt && new Date(t.completedAt).toDateString() === today
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

  async create(taskId: string): Promise<FocusSession> {
    const sessions = await this.getAll();
    const newSession: FocusSession = {
      id: generateId(),
      taskId,
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

  async getTodaysTotalTime(): Promise<number> {
    const sessions = await this.getAll();
    const today = new Date().toDateString();
    return sessions
      .filter((s) => new Date(s.startedAt).toDateString() === today && s.status === "completed")
      .reduce((sum, s) => sum + s.duration, 0);
  },
};

export const PreferencesStorage = {
  async get(): Promise<UserPreferences> {
    try {
      const data = await AsyncStorage.getItem(KEYS.PREFERENCES);
      return data
        ? JSON.parse(data)
        : { notificationsEnabled: true };
    } catch {
      return { notificationsEnabled: true };
    }
  },

  async save(prefs: UserPreferences): Promise<void> {
    await AsyncStorage.setItem(KEYS.PREFERENCES, JSON.stringify(prefs));
  },
};

export const DailyReplayStorage = {
  async getToday(): Promise<DailyReplay | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.DAILY_REPLAYS);
      const replays: DailyReplay[] = data ? JSON.parse(data) : [];
      const today = new Date().toDateString();
      return replays.find((r) => r.date === today) || null;
    } catch {
      return null;
    }
  },

  async generateToday(): Promise<DailyReplay> {
    const completedTasks = await TaskStorage.getCompletedToday();
    const totalTimeSpent = await SessionStorage.getTodaysTotalTime();
    const allTasks = await TaskStorage.getAll();
    const today = new Date().toDateString();
    
    const postponedTasks = allTasks.filter((t) => {
      if (t.completed) return false;
      if (!t.deadline) return false;
      const deadline = new Date(t.deadline);
      return deadline.toDateString() === today || deadline < new Date();
    });

    const reflection = generateReflection(completedTasks, totalTimeSpent, postponedTasks);

    const replay: DailyReplay = {
      date: today,
      completedTasks,
      totalTimeSpent,
      postponedTasks,
      reflection,
    };

    const data = await AsyncStorage.getItem(KEYS.DAILY_REPLAYS);
    const replays: DailyReplay[] = data ? JSON.parse(data) : [];
    const existingIndex = replays.findIndex((r) => r.date === today);
    
    if (existingIndex !== -1) {
      replays[existingIndex] = replay;
    } else {
      replays.push(replay);
    }
    
    await AsyncStorage.setItem(KEYS.DAILY_REPLAYS, JSON.stringify(replays.slice(-30)));
    return replay;
  },
};

function generateReflection(
  completed: Task[],
  timeSpent: number,
  postponed: Task[]
): string {
  if (completed.length === 0 && timeSpent === 0) {
    return "A fresh start awaits. Take one small step tomorrow.";
  }

  const hours = Math.floor(timeSpent / 3600);
  const mins = Math.floor((timeSpent % 3600) / 60);

  if (completed.length >= 5) {
    return "Strong momentum today. Consistent effort leads to meaningful progress.";
  }

  if (hours >= 2) {
    return "Deep focus sessions served you well. Protect this time tomorrow too.";
  }

  if (completed.length > 0 && postponed.length === 0) {
    return "Clean execution today. Every completed task builds confidence.";
  }

  if (postponed.length > completed.length) {
    return "Some tasks shifted. Consider breaking larger tasks into smaller steps.";
  }

  if (mins > 30) {
    return "Short focus sessions worked well today. Similar blocks tomorrow may help.";
  }

  return "Progress happens one task at a time. Keep moving forward.";
}
