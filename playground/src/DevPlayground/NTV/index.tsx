import React, { useState, useEffect } from 'react';

import { Skeleton } from 'antd';

import { NarrativeTextVis } from '../../../../packages/ava-react/src';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [spec, setSpec] = useState({});
  useEffect(() => {
    fetch('https://assets.antv.antgroup.com/ava/ntv-booking.json')
      .then((res) => res.json())
      .then((res) => {
        setSpec(res);
        setLoading(false);
      });
  }, []);
  return <>{loading ? <Skeleton active /> : <NarrativeTextVis spec={spec} />}</>;
};

export default <App />;
