import * as React from 'react';
import { Select } from 'antd';

const { Option } = Select;

export interface SmartBoardSamples {
  sampleNames: string[];
  initSampleIndex?: number;
}

export interface SmartBoardSelectorProps {
  changeSampleIndex: (d: any) => void;
  samples: SmartBoardSamples;
}

interface SmartBoardSelectorStates {
  canSelect: boolean;
  defaultSampleIndex: number;
  sampleNames: string[];
}

export class SmartBoardSelector extends React.Component<SmartBoardSelectorProps, SmartBoardSelectorStates> {
  changeSampleIndex: (d: any) => void;

  constructor(props: SmartBoardSelectorProps) {
    super(props);
    const { samples, changeSampleIndex } = props;
    this.changeSampleIndex = changeSampleIndex;
    if (samples.sampleNames.length > 1) {
      this.state = {
        defaultSampleIndex: samples.initSampleIndex ?? 0,
        sampleNames: samples.sampleNames,
        canSelect: true,
      };
    } else {
      this.state = {
        defaultSampleIndex: 0,
        sampleNames: samples.sampleNames,
        canSelect: false,
      };
    }
  }

  handleSampleChange = (value: any) => {
    this.changeSampleIndex(value);
  };

  render() {
    const { canSelect, sampleNames, defaultSampleIndex } = this.state;

    return (
      <React.Fragment>
        {canSelect && (
          <Select id="sample-select" defaultValue={defaultSampleIndex} size="small" onChange={this.handleSampleChange}>
            {sampleNames.map((sample, ind) => {
              return (
                <Option key={sample} value={ind}>
                  {sample}
                </Option>
              );
            })}
          </Select>
        )}
      </React.Fragment>
    );
  }
}
