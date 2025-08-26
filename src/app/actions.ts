'use server';

import { generateFeedback as genkitFeedback, type FeedbackInput } from '@/ai/flows/positive-feedback';

export async function generateFeedback(input: FeedbackInput): Promise<string> {
  try {
    const result = await genkitFeedback(input);
    return result.feedback;
  } catch (error) {
    console.error('Error generating feedback:', error);
    // Return a generic fallback message on error
    return "멋진 한 수였어요!";
  }
}
