import { scagScorer } from './scorer';
import { getCol, zip } from './findScag/util';
import { ScagOptions, ScagScanner, ScagResult } from './findScag/interface';

function scagFeeder(scag: ScagScanner, i: number, j: number, k: number) {
  const res: ScagResult = {};

  res.indX = i;
  res.indY = j;
  res.k = k;

  switch (k) {
    case 0:
      res.val = scag.clumpyScore;
      break;
    case 1:
      res.val = scag.outlyingScore;
      break;
    case 2:
      res.val = scag.skinnyScore;
      break;
    case 3:
      res.val = scag.stringyScore;
      break;
    case 4:
      res.val = scag.skewedScore;
      break;
    case 5:
      res.val = scag.striatedScore;
      break;
    case 6:
      res.val = scag.convexScore;
      break;
    case 7:
      res.val = scag.sparseScore;
      break;
    case 8:
      res.val = scag.monotonicScore;
      break;
  }

  return res;
}

function scagChecker(input: ScagResult, output: ScagResult[]) {
  for (let i = 0; i < output.length; ++i) {
    if (input.indX === output[i].indX && input.indY === output[i].indY) {
      return false;
    }
  }

  return true;
}

export function scagInsighter(dataSource: any[]) {
  if (!Array.isArray(dataSource)) {
    throw new TypeError('data type error');
  }

  const dataLenAll = dataSource[0].length;

  if (dataLenAll === 0) {
    throw new TypeError('data length error');
  }

  const scagRes = new Array(9);
  const avgNum = new Array(9);
  for (let k = 0; k < 9; ++k) {
    scagRes[k] = [];
    avgNum[k] = 0;
  }

  let scagInd = 0;
  for (let i = 0; i < dataLenAll; ++i) {
    const dataX = getCol(dataSource, i);

    if (dataX.length != 0) {
      for (let j = i + 1; j < dataLenAll; ++j) {
        const dataY = getCol(dataSource, j);

        if (dataY.length != 0 && dataY.length == dataX.length) {
          const inputPoints = zip(dataX, dataY);

          const options: ScagOptions = {};
          const scag = scagScorer(inputPoints, options);

          for (let k = 0; k < 9; ++k) {
            scagRes[k][scagInd] = scagFeeder(scag, i, j, k);
            const res = scagRes[k][scagInd];
            avgNum[k] += scagRes[k][scagInd].val!;

            for (let tmpind = 0; tmpind < scagInd; ++tmpind) {
              if (res.val! > scagRes[k][tmpind].val!) {
                const tmpscag = res;
                scagRes[k][scagInd] = scagRes[k][tmpind];
                scagRes[k][tmpind] = tmpscag;
              }
            }
          }
          ++scagInd;
        }
      }
    }
  }

  const iqrNumL: number[] = [];
  const iqrNumU: number[] = [];
  const q25 = Math.round(scagInd * 0.75);
  --scagInd;
  const q75 = Math.round(scagInd * 0.25);

  for (let k = 0; k < 9; ++k) {
    avgNum[k] /= scagInd;

    const tmpiqr = scagRes[k][q75].val! - scagRes[k][q25].val!;

    iqrNumL[k] = scagRes[k][scagInd].val! + 1.5 * tmpiqr;
    iqrNumU[k] = scagRes[k][scagInd].val! - 1.5 * tmpiqr;
  }

  let insightNum = 0;
  const outRes: ScagResult[] = [];

  for (let i = 0; i < Math.ceil(dataLenAll / 10); ++i) {
    for (let k = 0; k < 9; ++k) {
      if (scagRes[k][i].val! > iqrNumU[k] && scagChecker(scagRes[k][i], outRes)) {
        outRes[insightNum] = scagRes[k][i];
        ++insightNum;
      }
    }
  }

  if (scagInd === 0) {
    throw new TypeError('data variable error');
  }

  if (insightNum <= 0) {
    return false;
  }

  return outRes;
}
