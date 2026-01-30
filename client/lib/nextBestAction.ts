import type { Task, AvailableTime, EnergyLevel, Priority } from "@shared/types";

const priorityScore: Record<Priority, number> = {
  High: 3,
  Medium: 2,
  Low: 1,
};

const energyMatchScore: Record<Priority, Record<EnergyLevel, number>> = {
  High: { High: 3, Medium: 2, Low: 1 },
  Medium: { High: 2, Medium: 3, Low: 2 },
  Low: { High: 1, Medium: 2, Low: 3 },
};

export function selectNextBestTask(
  tasks: Task[],
  availableTime: AvailableTime,
  energyLevel: EnergyLevel
): Task | null {
  const incompleteTasks = tasks.filter((t) => !t.completed);
  
  if (incompleteTasks.length === 0) {
    return null;
  }

  const eligibleTasks = incompleteTasks.filter(
    (t) => t.estimatedMinutes <= availableTime
  );

  if (eligibleTasks.length === 0) {
    return incompleteTasks.reduce((shortest, task) =>
      task.estimatedMinutes < shortest.estimatedMinutes ? task : shortest
    );
  }

  const scoredTasks = eligibleTasks.map((task) => {
    let score = 0;

    score += priorityScore[task.priority] * 10;

    score += energyMatchScore[task.priority][energyLevel] * 5;

    if (task.deadline) {
      const deadline = new Date(task.deadline);
      const now = new Date();
      const hoursUntilDeadline = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntilDeadline < 0) {
        score += 50;
      } else if (hoursUntilDeadline < 24) {
        score += 30;
      } else if (hoursUntilDeadline < 72) {
        score += 15;
      }
    }

    const timeFit = 1 - Math.abs(task.estimatedMinutes - availableTime) / availableTime;
    score += timeFit * 3;

    return { task, score };
  });

  scoredTasks.sort((a, b) => b.score - a.score);

  return scoredTasks[0]?.task || null;
}

export function formatTimeEstimate(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
