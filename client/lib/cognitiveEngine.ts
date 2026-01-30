import type {
  Commitment,
  MentalState,
  CognitiveWeight,
  EnergyLevel,
  AvailableTime,
} from "@shared/types";

const WEIGHT_COST: Record<CognitiveWeight, number> = {
  Light: 10,
  Moderate: 25,
  Heavy: 45,
};

const ENERGY_WEIGHT_MATCH: Record<CognitiveWeight, Record<EnergyLevel, number>> = {
  Heavy: { High: 3, Moderate: 1, Low: 0 },
  Moderate: { High: 2, Moderate: 3, Low: 1 },
  Light: { High: 1, Moderate: 2, Low: 3 },
};

export interface SuggestedAction {
  type: "commitment" | "recovery" | "none";
  commitment?: Commitment;
  message: string;
  submessage?: string;
}

export function selectNextAction(
  commitments: Commitment[],
  mentalState: MentalState,
  energyLevel: EnergyLevel
): SuggestedAction {
  const activeCommitments = commitments.filter((c) => !c.completed);
  
  if (activeCommitments.length === 0) {
    return {
      type: "none",
      message: "Your mind is clear.",
      submessage: "No commitments need your attention right now.",
    };
  }

  const remainingCapacity = mentalState.capacityTotal - mentalState.capacityUsed;
  
  if (remainingCapacity <= 10) {
    return {
      type: "recovery",
      message: "Your mental load is saturated.",
      submessage: "Pushing further may reduce focus quality. Recovery is more valuable.",
    };
  }

  if (energyLevel === "Low" && mentalState.energyMode === "Protect") {
    const lightCommitments = activeCommitments.filter(
      (c) => c.cognitiveWeight === "Light" && c.estimatedMinutes <= mentalState.availableTime
    );
    
    if (lightCommitments.length === 0) {
      return {
        type: "recovery",
        message: "No action recommended right now.",
        submessage: "Your current energy is best preserved. Rest supports tomorrow's clarity.",
      };
    }
  }

  const eligibleCommitments = activeCommitments.filter((c) => {
    const cost = WEIGHT_COST[c.cognitiveWeight];
    return (
      c.estimatedMinutes <= mentalState.availableTime &&
      cost <= remainingCapacity
    );
  });

  if (eligibleCommitments.length === 0) {
    const anyFit = activeCommitments.filter(
      (c) => c.estimatedMinutes <= mentalState.availableTime
    );
    
    if (anyFit.length === 0) {
      return {
        type: "recovery",
        message: "Available time is limited.",
        submessage: "Consider shorter windows later, or adjust your commitments.",
      };
    }

    return {
      type: "recovery",
      message: "Mental capacity reached for now.",
      submessage: "A short rest will restore your ability to focus.",
    };
  }

  const scoredCommitments = eligibleCommitments.map((commitment) => {
    let score = 0;

    score += ENERGY_WEIGHT_MATCH[commitment.cognitiveWeight][energyLevel] * 10;

    if (commitment.pressurePoint) {
      const pressure = new Date(commitment.pressurePoint);
      const now = new Date();
      const hoursUntil = (pressure.getTime() - now.getTime()) / (1000 * 60 * 60);
      
      if (hoursUntil < 0) score += 40;
      else if (hoursUntil < 24) score += 25;
      else if (hoursUntil < 72) score += 10;
    }

    if (mentalState.energyMode === "Push") {
      if (commitment.cognitiveWeight === "Heavy") score += 15;
      if (commitment.cognitiveWeight === "Moderate") score += 8;
    } else {
      if (commitment.cognitiveWeight === "Light") score += 15;
      if (commitment.cognitiveWeight === "Moderate") score += 5;
    }

    const timeFit = 1 - Math.abs(commitment.estimatedMinutes - mentalState.availableTime) / mentalState.availableTime;
    score += timeFit * 5;

    return { commitment, score };
  });

  scoredCommitments.sort((a, b) => b.score - a.score);

  const selected = scoredCommitments[0]?.commitment;

  if (!selected) {
    return {
      type: "none",
      message: "Nothing quite fits right now.",
      submessage: "Check back when your availability changes.",
    };
  }

  return {
    type: "commitment",
    commitment: selected,
    message: `Suggested focus: ${selected.title}`,
    submessage: `${selected.estimatedMinutes} min · ${selected.cognitiveWeight} weight`,
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
  status: "available" | "moderate" | "saturated";
  message: string;
} {
  const percentage = Math.min((used / total) * 100, 100);
  
  if (percentage < 50) {
    return {
      percentage,
      status: "available",
      message: "Mental capacity available",
    };
  }
  
  if (percentage < 85) {
    return {
      percentage,
      status: "moderate",
      message: "Pace yourself thoughtfully",
    };
  }
  
  return {
    percentage,
    status: "saturated",
    message: "Rest supports clarity",
  };
}
