import { zip } from 'underscore';
import { scagScorer } from './scorer';
import { scagOptions, scagScanner, scagResult } from './findScag/interface'

function scagFeeder(scag: scagScanner, i: number, j: number, k: number) {
  let res: scagResult = {};

  res.indX = i;
  res.indY = j;
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
      res.val = scag.striatedScore;
    case 6:
      res.val = scag.convexScore;
    case 7:
      res.val = scag.sparseScore;
    case 8:
      res.val = scag.monotonicScore;
  }

  return res;
}

function scagChecker(input: scagResult, output: scagResult[]) {
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

  const dataLenAll = dataSource.length;

  if (dataLenAll === 0) {
    throw new TypeError('data length error');
  }

  let scagRes = new Array(9);
  let avgNum = new Array(9);
  for (let k = 0; k < 9; ++k) {
    scagRes[k] = [];
    avgNum[k] = 0;
  }

  let scagInd = 0;

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
            let res = scagFeeder(scag, i, j, k);
            scagRes[k][scagInd] = res;
            avgNum[k] += res.val!;

            for (let tmpind = 0; tmpind < scagInd; ++tmpind) {
              if (res.val! > scagRes[k][tmpind].val!) {
                let tmpscag = res;
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

  let iqrNumL: number[] = [];
  let iqrNumU: number[] = [];
  let q25 = Math.round(scagInd * 0.75);
  --scagInd;
  let q75 = Math.round(scagInd * 0.25);

  for (let k = 0; k < 9; ++k) {
    avgNum[k] /= scagInd;

    let tmpiqr = scagRes[k][q75].val! - scagRes[k][q25].val!;

    iqrNumL[k] = scagRes[k][scagInd].val! + 1.5 * tmpiqr;
    iqrNumU[k] = scagRes[k][scagInd].val! - 1.5 * tmpiqr;
  }

  let insightNum = 0;
  let outRes: scagResult[] = [];

  for (let i = 0; i < 3; ++i) {
    for (let k = 0; k < 9; ++k) {
      // let diffi = Math.abs(scagRes[k][i].val! - avgNum[k]);
      if (scagRes[k][i].val! > iqrNumU[k] && scagChecker(scagRes[k][i], outRes)) {
        outRes[insightNum] = scagRes[k][i];
        ++insightNum;
      }

      // diffi = Math.abs(scagRes[k][scagInd - i].val! - avgNum[k]);
      // if (scagRes[k][scagInd - i].val! < iqrNumL[k]) {
      //   outRes[insightNum] = scagRes[k][scagInd - i];
      //   ++insightNum;
      // }
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