import React from 'react';

import { CaretDownOutlined } from '@ant-design/icons';
import Thumbnails from '@antv/thumbnails';
import { Thumbnail } from '@antv/thumbnails-component';
import { Dropdown, Space } from 'antd';
import ReactDOM from 'react-dom';

const chartTypeList = Object.keys(Thumbnails);

class App extends React.Component {
  state = {
    current: chartTypeList[0],
  };

  handleClick = ({ key }) => {
    this.setState({
      current: key,
    });
  };

  render() {
    const { current } = this.state;
    const items = chartTypeList.map((item) => {
      return { key: item, label: <a onClick={this.handleClick}>{item}</a> };
    });

    return (
      <div>
        <Thumbnail chart={current} width="200" height="200" />
        <Dropdown menu={{ items, onClick: this.handleClick, selectable: true }} placement="bottomLeft">
          <a className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
            <Space>
              Select Chart Type <CaretDownOutlined />
            </Space>
          </a>
        </Dropdown>
        <span> : {current}</span>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('container'));
