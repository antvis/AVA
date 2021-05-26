import { compareTwoStrings } from 'string-similarity';

export function pickMostSimilar(elements: string[], compareTo: string) {
  return elements
    .map((e) => {
      return {
        score: compareTwoStrings(compareTo, e),
        element: e,
      };
    })
    .reduce((acc, cur) => {
      return acc.score > cur.score ? acc : cur;
    }).element;
}
