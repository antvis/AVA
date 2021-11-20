import React from 'react';
import ReactDOM from 'react-dom';
import Thumbnails from '@antv/thumbnails';
import { Thumbnail } from '@antv/thumbnails-component';
import { Popover } from 'antd';

// import
import { CKBJson } from '@antv/ckb';

const chartTypeList = Object.keys(Thumbnails);

const ckb = CKBJson('en-US', true);

const ViewAll = () =>
  chartTypeList.map((item) => {
    const { name, alias, def, purpose, coord, shape, channel } = ckb[item];

    const content = (
      <div>
        <h3>{name}</h3>
        <h4>Alias</h4>
        <p>
          <small>{alias.toString() || '-'}</small>
        </p>
        <h4>Definition</h4>
        <p>
          <small>{def || '-'}</small>
        </p>
        <h4>Purposes</h4>
        <p>
          <small>{purpose.toString() || '-'}</small>
        </p>
        <h4>Coordinate</h4>
        <p>
          <small>{coord.toString() || '-'}</small>
        </p>
        <h4>Shape</h4>
        <p>
          <small>{shape.toString() || '-'}</small>
        </p>
        <h4>Channels</h4>
        <p>
          <small>{channel.toString() || '-'}</small>
        </p>
      </div>
    );

    return (
      <div
        className="grid"
        style={{
          display: 'inline-block',
          margin: '6px',
          border: '1px solid LightSteelBlue',
        }}
        key={item}
      >
        <Popover
          placement="right"
          content={content}
          overlayStyle={{ maxWidth: '300px' }}
          mouseLeaveDelay={0}
          arrowPointAtCenter
        >
          <div className="thumbnail" style={{ textAlign: 'center' }}>
            <Thumbnail chart={item} style={{ margin: '4px', width: '140px', height: '140px' }} />
          </div>
        </Popover>
      </div>
    );
  });

ReactDOM.render(<ViewAll />, document.getElementById('container'));
