import * as React from 'react';
import { name as ckbName, version as ckbVersion } from '../../../packages/ckb/src';

class Tmp extends React.Component<{}, {}> {
  constructor(props: {}) {
    super(props);
  }

  render() {
    return (
      <ul>
        <li>
          {ckbName} - {ckbVersion}
        </li>
      </ul>
    );
  }
}

export default Tmp;
