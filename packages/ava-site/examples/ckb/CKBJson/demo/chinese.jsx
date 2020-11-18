import React from 'react';
import ReactDOM from 'react-dom';
import { ShowJSON } from 'demo-utils';

import { CKBJson } from '@antv/knowledge';

// Knowledage base for completed charts in Chinese.
const zhCompletedKB = CKBJson('zh-CN', true);

ReactDOM.render(<ShowJSON json={zhCompletedKB} />, document.getElementById('container'));
