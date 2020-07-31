import { RowData } from '@antv/dw-transform';

export function getType(obj: any){
  return Object.prototype.toString.call(obj).slice(8, -1);
}

export function JSONto2DArray(arr: RowData[]) {
  for (var i = 0; i < arr.length; i++) {
    var tmpArr = []

    for (var attr in arr[i]) {
      if (getType(arr[i][attr]) == 'Number') {
        tmpArr.push(arr[i][attr]);
      }
    }

    arr[i] = tmpArr
  }
  return arr
};