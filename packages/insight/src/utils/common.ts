import _lastIndexOf from 'lodash/lastIndexOf';

// sign
export const sign = (value: number) => {
  if (value > 0) return 1;
  return value < 0 ? -1 : 0;
};

// unique
export const unique = (arr: string[] | number[]): [(string | number)[], number[]] => {
  const sorted = arr.slice().sort();

  const uniqArr = [sorted[0]];
  const countArr = [1];
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i] !== uniqArr[uniqArr.length - 1]) {
      uniqArr.push(sorted[i]);
      countArr.push(1);
    } else {
      countArr[countArr.length - 1] += 1;
    }
  }

  return [uniqArr, countArr];
};

// rank
export const rank = (arr: (string | number)[]): number[] => {
  const sorted = arr.slice().sort();
  const rank = [];
  for (let i = 0; i < arr.length; i += 1) {
    const value = arr[i];
    const firstRank = sorted.indexOf(value) + 1;
    const lastRank = _lastIndexOf(sorted, value) + 1;
    rank.push(firstRank === lastRank ? firstRank : (firstRank + lastRank) / 2);
  }
  return rank;
};
