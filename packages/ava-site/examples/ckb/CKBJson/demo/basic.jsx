import React from 'react';
import ReactDOM from 'react-dom';
import { ShowJSON } from 'demo-utils';

import { CKBJson } from '@antv/knowledge';

// Knowledage base for all charts in English.
const knowledgeBase = CKBJson();

ReactDOM.render(<ShowJSON json={knowledgeBase} />, document.getElementById('container'));
