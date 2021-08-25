import { pettittTest } from '../../algorithms';
import { SignificanceBenchmark } from '../../constant';
import { Datum, ChangePointInfo } from '../../interface';

export const findChangePoints = (data: Datum[], measureKey: string): ChangePointInfo[] => {
  if (!data || data.length === 0) return [];
  const dataArr = data.map((item) => item?.[measureKey] as number);
  const testResult = pettittTest(dataArr);

  const changePointsResult: ChangePointInfo[] = [];

  if (testResult.index >= 0 && testResult.significance >= SignificanceBenchmark) {
    changePointsResult.push({
      ...testResult,
      type: 'change_point',
    });
  }
  return changePointsResult;
};
