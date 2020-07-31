import { RowData } from '@antv/dw-transform';

export function getType(obj: any){
  return Object.prototype.toString.call(obj).slice(8, -1);
}

export function JSONto2DArray(arr: RowData[]) {
  let outArr: number[][] = [];

  for (let i = 0; i < arr.length; i++) {
    let tmpArr: number[] = [];

    for (let attr in arr[i]) {
      if (getType(arr[i][attr]) == 'Number') {
        tmpArr.push(arr[i][attr]);
      }
    }

    outArr[i] = tmpArr;
  }

  return outArr;
};