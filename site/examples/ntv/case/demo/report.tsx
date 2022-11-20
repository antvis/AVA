import React, { useState, useEffect } from 'react';

import { Skeleton } from 'antd';
import ReactDOM from 'react-dom';
import { NarrativeTextVis } from '@antv/ava-react';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [spec, setSpec] = useState({});
  useEffect(() => {
    fetch('https://assets.antv.antgroup.com/ava/ntv-report1.json')
      .then((res) => res.json())
      .then((res) => {
        setSpec(res);
        setLoading(false);
      });
  }, []);
  return <>{loading ? <Skeleton active /> : <NarrativeTextVis spec={spec} />}</>;
};

ReactDOM.render(<App />, document.getElementById('container'));
