import keys from './keys';

// Convert an object into a list of `[key, value]` pairs.
// The opposite of `_.object` with one argument.
export function pairs(obj: { [x: string]: any }) {
  const _keys = keys(obj);
  const length = _keys.length;
  const pairs = Array(length);

  for (let i = 0; i < length; i++) {
    pairs[i] = [_keys[i], obj[_keys[i]]];
  }

  return pairs;
}
