import { z } from 'genkit';
import { ai } from './genkit';

export const ocrSchema = z.object({
  ign: z.string().describe('The player In-Game Name (IGN) found in the screenshot'),
  uid: z.string().describe('The player User ID (UID) found in the screenshot'),
});

export const extractProfileData = ai.defineFlow(
  {
    name: 'extractProfileData',
    inputSchema: z.object({
        base64Image: z.string().describe('Base64 data URL of the image'),
    }),
    outputSchema: ocrSchema,
  },
  async (input) => {
    const response = await ai.generate({
      prompt: [
        { text: `Extract the BGMI (Battlegrounds Mobile India) In-Game Name (IGN) and User ID (UID) from this player profile screenshot. 
               - The UID is a numeric string (e.g., 5490536342) usually located at the top or near the player's avatar.
               - The IGN is the player's creative username (e.g., AURA Piyush) displayed next to their level or rank.
               - Ignore labels like "Member", "Elite Collector", "Platinum", etc.
               - Focus on finding the specific numeric UID and the primary bold username.
               Return the data in the specified JSON format.` },
        { media: { url: input.base64Image, contentType: 'image/jpeg' } }
      ],
    });

    const result = response.output();
    if (!result) {
        throw new Error('Failed to extract data from image');
    }
    return result as z.infer<typeof ocrSchema>;
  }
);
