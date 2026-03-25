'use server';
/**
 * @fileOverview A Genkit flow for calculating a synergy match score between two textual descriptions.
 *
 * - calculateSynergyMatchScore - A function that calculates the synergy score.
 * - CalculateSynergyMatchScoreInput - The input type for the calculateSynergyMatchScore function.
 * - CalculateSynergyMatchScoreOutput - The return type for the calculateSynergyMatchScore function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculateSynergyMatchScoreInputSchema = z.object({
  description1: z
    .string()
    .describe(
      'The first description for synergy calculation, e.g., a player’s ideal teammate preferences.'
    ),
  description2: z
    .string()
    .describe(
      'The second description for synergy calculation, e.g., an organization’s team playstyle.'
    ),
});
export type CalculateSynergyMatchScoreInput = z.infer<
  typeof CalculateSynergyMatchScoreInputSchema
>;

const CalculateSynergyMatchScoreOutputSchema = z.object({
  synergyScore: z
    .number()
    .min(0)
    .max(100)
    .describe(
      'A percentage score (0-100) indicating the synergy match between the two descriptions.'
    ),
  explanation: z
    .string()
    .describe('A brief explanation of how the synergy score was determined.'),
});
export type CalculateSynergyMatchScoreOutput = z.infer<
  typeof CalculateSynergyMatchScoreOutputSchema
>;

const calculateSynergyPrompt = ai.definePrompt({
  name: 'calculateSynergyMatchScorePrompt',
  input: {schema: CalculateSynergyMatchScoreInputSchema},
  output: {schema: CalculateSynergyMatchScoreOutputSchema},
  prompt: `You are an expert in team synergy analysis for competitive gaming.
Your task is to analyze two descriptions and determine a synergy match score between them, expressed as a percentage from 0 to 100.
Also, provide a brief explanation for the score.

Consider the following two descriptions:

Description 1: {{{description1}}}
Description 2: {{{description2}}}

Based on these descriptions, calculate the synergy score and provide a brief explanation.`,
});

const calculateSynergyMatchScoreFlow = ai.defineFlow(
  {
    name: 'calculateSynergyMatchScoreFlow',
    inputSchema: CalculateSynergyMatchScoreInputSchema,
    outputSchema: CalculateSynergyMatchScoreOutputSchema,
  },
  async input => {
    const {output} = await calculateSynergyPrompt(input);
    if (!output) {
      throw new Error('Failed to generate synergy score.');
    }
    return output;
  }
);

export async function calculateSynergyMatchScore(
  input: CalculateSynergyMatchScoreInput
):
  Promise<CalculateSynergyMatchScoreOutput> {
  return calculateSynergyMatchScoreFlow(input);
}
