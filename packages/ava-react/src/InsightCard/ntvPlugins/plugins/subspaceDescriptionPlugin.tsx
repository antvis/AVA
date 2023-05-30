import React from 'react';

import { Typography } from "antd";
import { createCustomPhraseFactory } from "../../../NarrativeTextVis";
import { SUBSPACE_DESCRIPTION_PLUGIN_KEY } from "../../constants";

export const SubspaceDescription = ({ subspaceDescription }: { subspaceDescription: string }) => {
  return (
    <Typography.Text
      ellipsis={{ tooltip: subspaceDescription }}
      style={{
        display: 'block',
        color: 'rgba(0, 0, 0, 0.3)',
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        marginTop: '10px'
      }}
    >
      {subspaceDescription}
    </Typography.Text>
  );
};

export const subspaceDescriptionPlugin = createCustomPhraseFactory({
  key: SUBSPACE_DESCRIPTION_PLUGIN_KEY,
  overwrite: (node, value) => {
    return <SubspaceDescription subspaceDescription={value} />;
  },
});
