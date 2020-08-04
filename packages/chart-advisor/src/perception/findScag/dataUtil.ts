export function JSONtoPointSets(json: any) {
  return JSON.stringify(
    json,
    function (_, v) {
      for (const p in v) {
        if (v[p] instanceof Object) {
          return v;
        }
      }
      return JSON.stringify(v, null, 1);
    },
    2
  )
    .replace(/\\n/g, '')
    .replace(/\\/g, '')
    .replace(/"\[/g, '[')
    .replace(/\]"/g, ']')
    .replace(/"\{/g, '{')
    .replace(/\}"/g, ' }');
}
