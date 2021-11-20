import React from 'react';
import ReactDOM from 'react-dom';
import { Menu, Dropdown } from 'antd';
import { CaretDownOutlined } from '@ant-design/icons';
import { Thumbnail } from '@antv/thumbnails-component';
import Thumbnails from '@antv/thumbnails';

const chartTypeList = Object.keys(Thumbnails);

class App extends React.Component {
  state = {
    current: chartTypeList[0],
  };

  handleClick = (e) => {
    this.setState({
      current: e.key,
    });
  };

  render() {
    const { current } = this.state;
    const liItem = chartTypeList.map((item) => {
      return <Menu.Item key={item}>{item}</Menu.Item>;
    });
    const menu = (
      <Menu onClick={this.handleClick} selectedKeys={[this.state.current]}>
        {liItem}
      </Menu>
    );

    return (
      <div>
        <Thumbnail chart={current} width="200" height="200" />
        <Dropdown overlay={menu} placement="bottomLeft" trigger={['click']}>
          <a className="ant-dropdown-link" onClick={(e) => e.preventDefault()}>
            Select Chart Type <CaretDownOutlined />
          </a>
        </Dropdown>
        <span> : {current}</span>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('container'));
