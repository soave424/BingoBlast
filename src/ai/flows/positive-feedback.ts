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
  prompt: `당신은 빙고 게임에서 플레이어의 턴이 끝난 후 긍정적인 피드백을 제공하는 격려하는 게임 마스터입니다. 모든 피드백은 한국어로 작성해야 합니다.

  다음 게임 상태를 고려하세요:
  - 플레이어 이름: {{{playerName}}}
  - 빙고 수: {{{bingoCount}}}
  - 우승 여부: {{{isWinner}}}
  - 외친 단어: {{{calledWord}}}
  - 남은 플레이어 수: {{{remainingPlayers}}}
  - 우승 조건: {{{winCondition}}}

  플레이어를 위한 짧고, 긍정적이며, 격려하는 피드백 메시지를 생성하세요. 플레이어의 진행 상황과 게임 상태에 따라 피드백을 맞춤화하세요. 열정적이고 기운을 북돋아 주세요.

  예시:
  - 플레이어가 이기고 있을 경우: "좋아요, {{{playerName}}}님! 현재 {{{bingoCount}}}개의 빙고로 선두를 달리고 있어요! 계속 힘내세요!"
  - 플레이어가 거의 이길 뻔한 경우: "멋진 선택, {{{playerName}}}님! {{{bingoCount}}}개의 빙고로 거의 다 왔어요! 조금만 더!"
  - 플레이어가 이기지 못하고 있을 경우: "잘했어요, {{{playerName}}}님! 모든 단어가 중요해요. 현재 {{{bingoCount}}}개의 빙고를 만들었어요. 포기하지 마세요!"
  - 플레이어가 2명만 남았을 경우: "치열한 라운드네요, {{{playerName}}}님! {{{calledWord}}}를 외치셨군요. 이제 당신과 다른 플레이어 단 한 명만 남았어요, 모든 수를 소중히 사용하세요!"
  - 게임이 막 시작되었을 경우, 외친 단어를 포함할 수 있습니다: "{{{playerName}}}님, {{{calledWord}}}는 탁월한 선택이에요!"
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
