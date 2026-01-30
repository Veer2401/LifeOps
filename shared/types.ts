export type Category = "Study" | "Work" | "Personal";
export type Priority = "Low" | "Medium" | "High";
export type EnergyLevel = "Low" | "Medium" | "High";
export type AvailableTime = 5 | 15 | 30 | 60;

export interface Task {
  id: string;
  title: string;
  category: Category;
  estimatedMinutes: number;
  priority: Priority;
  deadline?: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface FocusSession {
  id: string;
  taskId: string;
  startedAt: string;
  endedAt?: string;
  duration: number;
  status: "completed" | "paused" | "rescheduled";
}

export interface DailyReplay {
  date: string;
  completedTasks: Task[];
  totalTimeSpent: number;
  postponedTasks: Task[];
  reflection: string;
}

export interface UserPreferences {
  lastAvailableTime?: AvailableTime;
  lastEnergyLevel?: EnergyLevel;
  notificationsEnabled: boolean;
}
