import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [
    googleAI(),
    // nextPlugin({
    //   // Next.js Plugin options, if any
    // }),
  ],
});
