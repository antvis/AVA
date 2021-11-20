import React from 'react';
import ReactDOM from 'react-dom';
import { Switch } from 'antd';
import insertCss from 'insert-css';
import { Thumbnail } from '@antv/thumbnails-component';
import Thumbnails from '@antv/thumbnails';

insertCss(`
  .demo-thumbnails-all-grid {
    width: 190px;
    height: 190px;
    display: inline-block;
    margin: 6px 6px;
    box-shadow: rgba(0, 0, 0, 0.12) 0px 0px 4px 0px;
  }

  .demo-thumbnails-all-intro {
    text-align: center;
    height: 40px;
    background: rgb(246, 246, 246);
    padding: 2px 0;
  }

  .demo-thumbnails-all-intro h1 {
    font-size: 12px;
    height: 20px;
    line-height: 20px;
    color: rgb(74, 74, 74);
    margin: 0;
  }

  .demo-thumbnails-all-intro h2 {
    font-size: 10px;
    height: 16px;
    line-height: 16px;
    font-style: italic;
    color: rgba(74, 74, 74, 0.4);
    margin: 0;
  }

  .demo-thumbnails-all-thumbnail {
    text-align: center;
  }

  .demo-thumbnails-all-dark {
    background-color: #262626;
  }

  .demo-thumbnails-all-thumbnail img {
    margin: 4px;
    width: 140px;
    height: 140px;
  }

  .demo-thumbnails-all-thumbnail img.demo-thumbnails-all-hasBorder {
    outline: 1px solid red;
  }
`);

const chartTypeList = Object.keys(Thumbnails);

class App extends React.Component {
  state = {
    showImgBorder: false,
    bgDarkMode: false,
  };

  onChange = () => {
    const { showImgBorder } = this.state;

    this.setState({
      showImgBorder: !showImgBorder,
    });
  };

  onBGChange = () => {
    const { bgDarkMode } = this.state;

    this.setState({
      bgDarkMode: !bgDarkMode,
    });
  };

  render() {
    const { showImgBorder, bgDarkMode } = this.state;

    const liItem = chartTypeList.map((item) => {
      const { id, name } = Thumbnails[item];

      return (
        <div className="demo-thumbnails-all-grid" key={id}>
          <div className="demo-thumbnails-all-intro">
            <h1>{name}</h1>
            <h2>{id}</h2>
          </div>
          <div className={`demo-thumbnails-all-thumbnail demo-thumbnails-all-${bgDarkMode ? 'dark' : 'light'}`}>
            <Thumbnail chart={id} className={showImgBorder ? 'demo-thumbnails-all-hasBorder' : null} />
          </div>
        </div>
      );
    });

    return (
      <div>
        ChartBorder: <Switch onChange={this.onChange} size="small" /> | DarkMode:{' '}
        <Switch onChange={this.onBGChange} size="small" />
        <br />
        {liItem}
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('container'));
