import React from 'react';
import { Radio, Tooltip } from 'antd';
import { InsertRowBelowOutlined, ClusterOutlined, InteractionOutlined } from '@ant-design/icons';
import { SmartBoardToolbarProps } from '../interfaces';

const smartBoardModes = ['defaultMode', 'clusterMode', 'connectionMode'];

const smartBoardModesAbbr = ['default', 'cluster', 'connection'];

interface SmartBoardToolbarStates {
  defaultMode: string;
}

export class SmartBoardToolbar extends React.Component<SmartBoardToolbarProps, SmartBoardToolbarStates> {
  changeMode: (d: any) => void;

  constructor(props: SmartBoardToolbarProps) {
    super(props);
    const { changeMode, defaultMode } = props;
    this.changeMode = changeMode;
    if (defaultMode) {
      let catchUpMode = defaultMode;
      if (smartBoardModesAbbr.includes(defaultMode)) {
        catchUpMode += 'Mode';
      }
      this.state = {
        defaultMode: smartBoardModes.includes(defaultMode) ? catchUpMode : 'defaultMode',
      };
    } else {
      this.state = {
        defaultMode: 'defaultMode',
      };
    }
  }

  handleModeChange = (e: any) => {
    this.changeMode(e.target.value);
  };

  render() {
    const { defaultMode } = this.state;

    return (
      <React.Fragment>
        <Radio.Group id="mode-select" defaultValue={defaultMode} size="small" onChange={this.handleModeChange}>
          <Radio.Button value="defaultMode">
            <Tooltip title={'Default Mode'}>
              <InsertRowBelowOutlined />
            </Tooltip>
          </Radio.Button>
          <Radio.Button value="clusterMode">
            <Tooltip title={'Cluster Mode'}>
              <ClusterOutlined />
            </Tooltip>
          </Radio.Button>
          <Radio.Button value="connectionMode">
            <Tooltip title={'Connection Mode'} placement="bottomRight" arrowPointAtCenter>
              <InteractionOutlined />
            </Tooltip>
          </Radio.Button>
        </Radio.Group>
      </React.Fragment>
    );
  }
}
