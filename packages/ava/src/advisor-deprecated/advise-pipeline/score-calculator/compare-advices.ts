/** compare two advice charts by their score */
export const compareAdvices = (chart1: { score: number }, chart2: { score: number }) => {
  if (chart1.score < chart2.score) {
    return 1;
  }
  if (chart1.score > chart2.score) {
    return -1;
  }
  return 0;
};
