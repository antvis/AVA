import { RowData } from '@antv/dw-transform';
import { ScagFixData } from './findScag/interface';
export function getType(obj: any) {
  return Object.prototype.toString.call(obj).slice(8, -1);
}

export function JSONto2DArray(arr: RowData[]) {
  const fixnum: number[] = [];
  let fixidx = 0;
  let arridx = 0;

  for (const attr in arr[0]) {
    if (getType(arr[0][attr]) == 'Number') {
      fixnum[fixidx] = arridx;
      fixidx += 1;
    }
    arridx += 1;
  }

  const outArr: number[][] = [];
  arr.map(function(item) {
    const tmpArr: number[] = [];

    Object.keys(item).map(function(key){
      if (getType(item[key]) == 'Number') {
        tmpArr.push(item[key]);
      }
    });

    outArr.push(tmpArr);
  });

  const scagData: ScagFixData = { outArr, fixnum };

  return scagData;
}
