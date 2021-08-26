/* eslint-disable react/prop-types */
import React from 'react';
import ReactJson from 'react-json-view';

export const ShowJSON = ({ json }) => {
  return (
    <ReactJson
      src={json}
      iconStyle
      name={false}
      displayObjectSize={false}
      displayDataTypes={false}
      enableClipboard={false}
    />
  );
};
