import React from 'react';

export function prettyJSON(json: any) {
  return JSON.stringify(
    json,
    function(_, v) {
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

export function JSONToTable(jsonArray: any) {
  if (!Array.isArray(jsonArray)) {
    return <div>Data is NOT array!</div>;
  }

  if (jsonArray.length === 0) {
    return <div>Data array is empty!</div>;
  }

  const fields = Object.keys(jsonArray[0]);

  return (
    <table className="columnTable">
      <thead>
        <tr>
          {fields.map((fieldTitle) => {
            return <th key={fieldTitle}>{fieldTitle}</th>;
          })}
        </tr>
      </thead>
      <tbody>
        {jsonArray.map((row, index) => (
          <tr key={index}>
            {fields.map((field) => (
              <td key={field}>{`${row[field]}`}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
