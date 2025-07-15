// import * as Effect from 'effect/Effect';
// import * as Context from 'effect/Context';
// import * as Array from 'effect/Array';
// import type { WordCount } from '../types/schemas.js';

// export interface WordCountService {
//   readonly countWords: (text: string) => Effect.Effect<WordCount[]>;
// }

// export const WordCountService =
//   Context.GenericTag<WordCountService>('WordCountService');

// const cleanWord = (word: string): string =>
//   word.replace(/[.,!?;:"'()[\]{}—-]/g, '').trim();

// const countWordsImpl = (text: string): Effect.Effect<WordCount[]> =>
//   Effect.sync(() => {
//     const words = text.toLowerCase().split(/\s+/).filter(Boolean);
//     const wordMap = new Map<string, number>();

//     for (const word of words) {
//       const cleaned = cleanWord(word);
//       if (cleaned) {
//         wordMap.set(cleaned, (wordMap.get(cleaned) || 0) + 1);
//       }
//     }

//     const result = Array.fromIterable(wordMap.entries()).map(
//       ([word, count]) => ({ word, count }),
//     );

//     return result.sort((a, b) => {
//       if (a.count !== b.count) {
//         return b.count - a.count;
//       }
//       return a.word.localeCompare(b.word);
//     });
//   });

// export const WordCountServiceLive = WordCountService.of({
//   countWords: countWordsImpl,
// });
