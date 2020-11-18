import React from 'react';
import ReactDOM from 'react-dom';
import { ShowJSON } from 'demo-utils';

import { CKBJson } from '@antv/knowledge';

// Knowledage base for completed charts.
const completedKB = CKBJson(undefined, true);

ReactDOM.render(<ShowJSON json={completedKB} />, document.getElementById('container'));
