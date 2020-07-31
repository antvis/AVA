import { zip } from 'underscore';
import { scagScorer, scagOptions } from './scorer';

export interface scagResult {
  indX?: number;
  indY?: number;
  k?: number;
  val?: number;
}

function scagFeeder(scag: any, x: number, y: number, k: number) {
  let res: scagResult = {};

  res.indX = x;
  res.indY = y;
  res.k = k;
  switch (k) {
    case 0:
      res.val = scag.clumpyScore;
    case 1:
      res.val = scag.outlyingScore;
    case 2:
      res.val = scag.skinnyScore;
    case 3:
      res.val = scag.stringyScore;
    case 4:
      res.val = scag.skewedScore;
    case 5:
      res.val = scag.straitedScore;
    case 6:
      res.val = scag.convexScore;
    case 7:
      res.val = scag.sparseScore;
    case 8:
      res.val = scag.monotonicScore;
  }

  return res;
}

export function scagInsighter(dataSource: any[]) {
  if (!Array.isArray(dataSource)) {
    throw new TypeError('data type error');
  }

  const dataLenAll = dataSource.length;

  if (dataLenAll === 0) {
    throw new TypeError('data length error');
  }

  let scagRes: scagResult[][] = [];
  for (let k = 0; k < 9; ++k) {
    scagRes[k] = [];
  }

  let scagInd = 0;
  let avgNum: number[] = [];

  for (let i = 0; i < dataLenAll; ++i) {

    let dataX = dataSource[i].filter(Number);
    if (dataX.length != 0) {
      for (let j = i + 1; j < dataLenAll; ++j) {
        let dataY = dataSource[j].filter(Number);
        if (dataY.length != 0 && dataY.length == dataX.length) {
          let inputPoints = zip(dataX, dataY);

          const options: scagOptions = {};
          const scag = scagScorer(inputPoints, options);

          for (let k = 0; k < 9; ++k) {
            scagRes[k][scagInd] = scagFeeder(scag, i, j, k);

            if (scagInd > 0) {
              for (let tmpind = 0; tmpind < scagInd; ++tmpind) {
                avgNum[k] += scagRes[k][scagInd].val!;

                if (scagRes[k][scagInd].val! > scagRes[k][tmpind].val!) {
                  let tmpscag = scagRes[k][scagInd];
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

  }

  let iqrNumL: number[] = [];
  let iqrNumU: number[] = [];
  let q25 = Math.round(scagInd * 0.75);
  --scagInd;
  let q75 = Math.round(scagInd * 0.25);

  for (let k = 0; k < 9; ++k) {
    avgNum[k] /= scagInd;
    let tmpiqr = scagRes[q75][scagInd].val! - scagRes[q25][scagInd].val!;

    iqrNumL[k] = scagRes[q75][scagInd].val! + 1.5 * tmpiqr;
    iqrNumU[k] = scagRes[q75][scagInd].val! - 1.5 * tmpiqr;
  }

  let insightNum = 0;
  let outRes: scagResult[] = [];

  for (let i = 0; i < 3; ++i) {
    for (let k = 0; k < 9; ++k) {
      let diffi = Math.abs(scagRes[k][i].val! - avgNum[k]);
      if (scagRes[k][i].val! > iqrNumU[k]) {
        outRes[insightNum] = scagRes[k][i];
        ++insightNum;
      }

      diffi = Math.abs(scagRes[k][scagInd - i].val! - avgNum[k]);
      if (scagRes[k][scagInd - i].val! < iqrNumL[k]) {
        outRes[insightNum] = scagRes[k][scagInd - i];
        ++insightNum;
      }
    }
  }
  --insightNum;

  if (scagInd === 0) {
    throw new TypeError('data variable error');
  }

  let insightCor = true;
  if (insightNum <= 0) {
    insightCor = false;
  }

  return { outRes, insightCor };
}