import React, { useState, useEffect } from 'react';

import { Skeleton, Switch } from 'antd';
// import { PlusOutlined, MinusOutlined } from '@ant-design/icons';

import { NarrativeTextVis } from '../../../../packages/ava-react/src';

const App = () => {
  const [loading, setLoading] = useState(true);
  const [isSmall, setIsSmall] = useState(false);
  const [spec, setSpec] = useState({});
  useEffect(() => {
    fetch('https://assets.antv.antgroup.com/ava/ntv-booking.json')
      .then((res) => res.json())
      .then((res) => {
        setSpec(res);
        setLoading(false);
      });
  }, []);
  return (
    <>
      <Switch checked={isSmall} onChange={setIsSmall} checkedChildren="Small" unCheckedChildren="Normal" />
      {loading ? (
        <Skeleton active />
      ) : (
        <NarrativeTextVis
          spec={spec}
          showCollapse={{
            showLine: false,
            // 调试代码注释
            // switcherIcon: (collapsed) => (!collapsed ? <MinusOutlined /> : <PlusOutlined />),
          }}
          size={isSmall ? 'small' : 'normal'}
        />
      )}
    </>
  );
};

export default <App />;
