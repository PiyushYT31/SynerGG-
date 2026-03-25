
"use server";

import {
  calculateSynergyMatchScore,
  type CalculateSynergyMatchScoreInput,
  type CalculateSynergyMatchScoreOutput,
} from "@/ai/flows/calculate-synergy-match-score";

export async function getSynergyScore(
  orgStyle: string,
  playerNeeds: string
): Promise<{ success: true; data: CalculateSynergyMatchScoreOutput } | { success: false; error: string }> {
  try {
    const input: CalculateSynergyMatchScoreInput = {
      description1: orgStyle,
      description2: playerNeeds,
    };

    const result = await calculateSynergyMatchScore(input);

    return { success: true, data: result };
  } catch (error) {
    console.error("Error calculating synergy score:", error);
    return { success: false, error: "Failed to calculate synergy score. Please try again." };
  }
}
