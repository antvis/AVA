import React from 'react';
import { Radio, Tooltip, Select } from 'antd';
import { InsertRowBelowOutlined, ClusterOutlined, InteractionOutlined } from '@ant-design/icons';

const { Option } = Select;
interface Props {
  changeMode: (d: any) => void;
  changeSampleIndex: (d: any) => void;
}

const Toolbar = (props: Props) => {
  const { changeMode, changeSampleIndex } = props;
  const handleModeChange = (e: any) => {
    changeMode(e.target.value);
  };
  const handleSampleChange = (value: any) => {
    changeSampleIndex(value);
  };

  return (
    <div id="toolbar">
      <div id="demo-selection">
        <Select
          id="sample-select"
          defaultValue="sample1"
          style={{ width: 120 }}
          size="small"
          onChange={handleSampleChange}
        >
          <Option value="0">sample1</Option>
          <Option value="1">sample2</Option>
        </Select>
      </div>
      <Radio.Group defaultValue="defaultMode" size="small" onChange={handleModeChange}>
        <Radio.Button value="defaultMode">
          <Tooltip title={'Default Mode'}>
            <InsertRowBelowOutlined className="toolbar_icons" />
          </Tooltip>
        </Radio.Button>
        <Radio.Button value="clusterMode">
          <Tooltip title={'Cluster Mode'}>
            <ClusterOutlined className="toolbar_icons" />
          </Tooltip>
        </Radio.Button>
        <Radio.Button value="connectionMode">
          <Tooltip title={'Connection Mode'} placement="bottomRight" arrowPointAtCenter>
            <InteractionOutlined className="toolbar_icons" />
          </Tooltip>
        </Radio.Button>
      </Radio.Group>
    </div>
  );
};

export default Toolbar;
