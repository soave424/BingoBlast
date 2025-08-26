'use server';

/**
 * @fileOverview Generates positive and contextually relevant feedback for players after their turn in the Bingo game.
 *
 * - generateFeedback - A function that generates feedback based on the current game state and player performance.
 * - FeedbackInput - The input type for the generateFeedback function.
 * - FeedbackOutput - The return type for the generateFeedback function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FeedbackInputSchema = z.object({
  playerName: z.string().describe('The name of the player whose turn just ended.'),
  bingoCount: z.number().describe('The number of bingos the player has.'),
  isWinner: z.boolean().describe('Whether the player has won the game.'),
  calledWord: z.string().describe('The word that was called during the player’s turn.'),
  remainingPlayers: z.number().describe('The number of players still in the game.'),
  winCondition: z.number().describe('The number of bingos required to win.'),
});
export type FeedbackInput = z.infer<typeof FeedbackInputSchema>;

const FeedbackOutputSchema = z.object({
  feedback: z.string().describe('A positive and encouraging feedback message for the player.'),
});
export type FeedbackOutput = z.infer<typeof FeedbackOutputSchema>;

export async function generateFeedback(input: FeedbackInput): Promise<FeedbackOutput> {
  return positiveFeedbackFlow(input);
}

const prompt = ai.definePrompt({
  name: 'positiveFeedbackPrompt',
  input: {schema: FeedbackInputSchema},
  output: {schema: FeedbackOutputSchema},
  prompt: `You are a supportive and encouraging game master providing positive feedback to players after their turn in a Bingo game.

  Consider the following game state:
  - Player Name: {{{playerName}}}
  - Bingo Count: {{{bingoCount}}}
  - Is Winner: {{{isWinner}}}
  - Called Word: {{{calledWord}}}
  - Remaining Players: {{{remainingPlayers}}}
  - Win Condition: {{{winCondition}}}

  Generate a short, positive, and encouraging feedback message for the player. Tailor the feedback based on their progress and the game state. Be enthusiastic and uplifting.

  Examples:
  - If the player is winning: "Great job, {{{playerName}}}! You're in the lead with {{{bingoCount}}} bingos! Keep it up!"
  - If the player is close to winning: "Nice call, {{{playerName}}}! You're getting close with {{{bingoCount}}} bingos! Just a little more!"
  - If the player is not winning: "Good effort, {{{playerName}}}! Every word counts. You are at {{{bingoCount}}} bingos. Don't give up!"
  - If there are only 2 players left: "Intense round, {{{playerName}}}! You called {{{calledWord}}}. Only you and another player remain, make every move count!"
  - If the game just started, you can include the called word: "{{{playerName}}}, {{{calledWord}}} is a great choice!"
  `,
});

const positiveFeedbackFlow = ai.defineFlow(
  {
    name: 'positiveFeedbackFlow',
    inputSchema: FeedbackInputSchema,
    outputSchema: FeedbackOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
