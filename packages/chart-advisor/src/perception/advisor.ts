import { RowData } from '@antv/dw-transform';
import { scagFixData } from './findScag/interface';
export function getType(obj: any) {
  return Object.prototype.toString.call(obj).slice(8, -1);
}

export function JSONto2DArray(arr: RowData[]) {
  let outArr: number[][] = [];
  let fixnum: number[] = [];
  let fixidx = 0;
  let arridx = 0;
  
  let tmpArr: number[] = [];
  for (let attr in arr[0]) {

    if (getType(arr[0][attr]) == 'Number') {
      tmpArr.push(arr[0][attr]);

      fixnum[fixidx] = arridx;
      ++fixidx;
    }

    ++arridx;
  }
  outArr[0] = tmpArr;

  for (let i = 1; i < arr.length; ++i) {
    tmpArr = [];

    for (let attr in arr[i]) {
      if (getType(arr[i][attr]) == 'Number') {
        tmpArr.push(arr[i][attr]);
      }
    }

    outArr[i] = tmpArr;
  }

  const scagData: scagFixData = {outArr, fixnum};

  return scagData;
};