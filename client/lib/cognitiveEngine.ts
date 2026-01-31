import type {
  Commitment,
  MentalState,
  CognitiveWeight,
  EnergyLevel,
  TodayCommitment,
  CommitmentNature,
  Fulfillment,
  RepeatPattern,
  COGNITIVE_WEIGHT_COST,
  NATURE_MODIFIER,
} from "@shared/types";

const WEIGHT_COST: Record<CognitiveWeight, number> = {
  Low: 10,
  Moderate: 25,
  High: 45,
};

const NATURE_COST_MODIFIER: Record<CommitmentNature, number> = {
  draining: 1.2,
  neutral: 1.0,
  restorative: 0.7,
};

const ENERGY_WEIGHT_MATCH: Record<CognitiveWeight, Record<EnergyLevel, number>> = {
  High: { High: 3, Moderate: 1, Low: 0 },
  Moderate: { High: 2, Moderate: 3, Low: 1 },
  Low: { High: 1, Moderate: 2, Low: 3 },
};

export function calculateCapacityCost(commitment: Commitment): number {
  const baseCost = WEIGHT_COST[commitment.cognitiveWeight];
  const modifier = NATURE_COST_MODIFIER[commitment.nature];
  return Math.round(baseCost * modifier);
}

export function getCapacityPercentage(commitment: Commitment, totalCapacity: number): number {
  const cost = calculateCapacityCost(commitment);
  return Math.round((cost / totalCapacity) * 100);
}

export function getNextOccurrence(
  commitment: Commitment,
  fromDate: Date = new Date()
): Date {
  const next = new Date(fromDate);
  next.setHours(0, 0, 0, 0);

  switch (commitment.repeatPattern) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
  }

  return next;
}

export function isDueToday(commitment: Commitment, fulfillments: Fulfillment[]): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toDateString();

  const startDate = new Date(commitment.startDate);
  startDate.setHours(0, 0, 0, 0);

  if (startDate > today) return false;

  const fulfilledToday = fulfillments.some(
    (f) => f.commitmentId === commitment.id && new Date(f.date).toDateString() === todayStr
  );

  if (fulfilledToday) return false;

  const daysDiff = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  switch (commitment.repeatPattern) {
    case "daily":
      return true;
    case "weekly":
      return daysDiff % 7 === 0;
    case "monthly":
      return startDate.getDate() === today.getDate();
    default:
      return false;
  }
}

export function getTodayCommitments(
  commitments: Commitment[],
  fulfillments: Fulfillment[]
): TodayCommitment[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toDateString();

  const result: TodayCommitment[] = [];

  for (const commitment of commitments) {
    if (commitment.archived) continue;

    const todayFulfillment = fulfillments.find(
      (f) => f.commitmentId === commitment.id && new Date(f.date).toDateString() === todayStr
    );

    const isDue = isDueToday(commitment, []);

    if (!isDue && !todayFulfillment) continue;

    result.push({
      commitment,
      dueDate: todayStr,
      fulfilled: !!todayFulfillment,
      fulfillment: todayFulfillment,
    });
  }

  return result;
}

export function calculateTodayCapacityUsed(
  commitments: Commitment[],
  fulfillments: Fulfillment[]
): number {
  const today = new Date().toDateString();
  const todayFulfillments = fulfillments.filter(
    (f) => new Date(f.date).toDateString() === today
  );

  return todayFulfillments.reduce((sum, f) => sum + f.capacityConsumed, 0);
}

export interface SuggestedAction {
  type: "commitment" | "recovery" | "rest";
  commitment?: Commitment;
  message: string;
  submessage?: string;
  capacityImpact?: number;
}

export function selectNextAction(
  todayCommitments: TodayCommitment[],
  mentalState: MentalState,
  energyLevel: EnergyLevel
): SuggestedAction {
  const unfulfilled = todayCommitments.filter((tc) => !tc.fulfilled);

  if (unfulfilled.length === 0) {
    return {
      type: "rest",
      message: "Your commitments are fulfilled.",
      submessage: "Take this time to rest and restore mental clarity.",
    };
  }

  const remainingCapacity = mentalState.capacityTotal - mentalState.capacityUsed;
  const capacityPercent = (mentalState.capacityUsed / mentalState.capacityTotal) * 100;

  if (capacityPercent >= 90) {
    return {
      type: "rest",
      message: "Rest is the most sustainable choice right now.",
      submessage: "Your mental capacity has reached its limit for today. Honor that boundary.",
    };
  }

  if (remainingCapacity <= 10) {
    return {
      type: "recovery",
      message: "Limited capacity remaining.",
      submessage: "Consider deferring remaining commitments to preserve mental clarity.",
    };
  }

  if (energyLevel === "Low" && mentalState.energyMode === "Protect") {
    const lightCommitments = unfulfilled.filter(
      (tc) =>
        tc.commitment.cognitiveWeight === "Low" &&
        tc.commitment.estimatedMinutes <= mentalState.availableTime
    );

    if (lightCommitments.length === 0) {
      return {
        type: "recovery",
        message: "Protecting your energy is wise right now.",
        submessage: "Your current energy is best preserved for sustainable momentum.",
      };
    }
  }

  const eligible = unfulfilled.filter((tc) => {
    const cost = calculateCapacityCost(tc.commitment);
    return (
      tc.commitment.estimatedMinutes <= mentalState.availableTime && cost <= remainingCapacity
    );
  });

  if (eligible.length === 0) {
    const timeConstrained = unfulfilled.filter(
      (tc) => tc.commitment.estimatedMinutes <= mentalState.availableTime
    );

    if (timeConstrained.length === 0) {
      return {
        type: "recovery",
        message: "Available time is limited.",
        submessage: "Consider shorter windows later, or adjust your schedule.",
      };
    }

    return {
      type: "recovery",
      message: "Capacity is constrained.",
      submessage: "A brief rest will help restore focus for later.",
    };
  }

  const scored = eligible.map((tc) => {
    let score = 0;
    const commitment = tc.commitment;

    score += ENERGY_WEIGHT_MATCH[commitment.cognitiveWeight][energyLevel] * 10;

    if (commitment.nature === "restorative") score += 15;
    if (commitment.nature === "draining") score -= 5;

    if (mentalState.energyMode === "Push") {
      if (commitment.cognitiveWeight === "High") score += 15;
      if (commitment.cognitiveWeight === "Moderate") score += 8;
    } else {
      if (commitment.cognitiveWeight === "Low") score += 15;
      if (commitment.cognitiveWeight === "Moderate") score += 5;
    }

    const timeFit =
      1 -
      Math.abs(commitment.estimatedMinutes - mentalState.availableTime) /
        mentalState.availableTime;
    score += timeFit * 5;

    return { todayCommitment: tc, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const selected = scored[0]?.todayCommitment;

  if (!selected) {
    return {
      type: "rest",
      message: "Nothing quite fits right now.",
      submessage: "Check back when your availability changes.",
    };
  }

  const capacityImpact = getCapacityPercentage(
    selected.commitment,
    mentalState.capacityTotal
  );

  return {
    type: "commitment",
    commitment: selected.commitment,
    message: selected.commitment.title,
    submessage: `Fulfilling this will use ~${capacityImpact}% of your mental capacity.`,
    capacityImpact,
  };
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

export function getCapacityStatus(used: number, total: number): {
  percentage: number;
  remaining: number;
  status: "available" | "moderate" | "limited" | "saturated";
  message: string;
} {
  const percentage = Math.min((used / total) * 100, 100);
  const remaining = Math.max(total - used, 0);

  if (percentage < 40) {
    return {
      percentage,
      remaining,
      status: "available",
      message: "Mental capacity is available",
    };
  }

  if (percentage < 70) {
    return {
      percentage,
      remaining,
      status: "moderate",
      message: "Pace yourself thoughtfully",
    };
  }

  if (percentage < 90) {
    return {
      percentage,
      remaining,
      status: "limited",
      message: "Limited capacity remaining",
    };
  }

  return {
    percentage,
    remaining,
    status: "saturated",
    message: "Rest supports clarity",
  };
}

export function getRepeatLabel(pattern: RepeatPattern): string {
  switch (pattern) {
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "monthly":
      return "Monthly";
  }
}

export function getNextOccurrenceLabel(commitment: Commitment): string {
  const next = getNextOccurrence(commitment);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diff = Math.floor(
    (next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diff === 1) return "Tomorrow";
  if (diff <= 7) return next.toLocaleDateString("en-US", { weekday: "long" });
  return next.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
