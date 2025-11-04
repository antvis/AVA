import _ from 'lodash';

export const oneHotEncodeKeys = (arr: Record<string, any>[]) => {
  const keyMap = new Map();
  let keyIndex = 0;
  let encodes: number[][] = [];
  _.each(arr, (record) => {
    const keys = _.keys(record).sort();
    // one-hot encode the keys
    const encode = [];
    _.each(keys, (key) => {
      if (keyMap.has(key)) {
        encode[keyMap.get(key)] = 1;
      } else {
        keyMap.set(key, keyIndex);
        encode[keyIndex] = 1;
        keyIndex++;
      }
    });
    encodes.push(encode);
  });
  encodes = encodes.map((encode) => {
    const padencode = encode.concat(_.times(keyIndex, () => 0)).slice(0, 8);
    return Array.from(padencode, (v) => v || 0);
  });
  return encodes;
};
