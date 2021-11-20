/* eslint-disable quotes */
import React from 'react';
import ReactDOM from 'react-dom';
import { Thumbnail } from '@antv/thumbnails-component';
import Thumbnails, { BAR_CHART } from '@antv/thumbnails';

const App = () => {
  return (
    <>
      <code>{`<Thumbnail svg={svgCode} alt={name} width={200} />`}</code>
      <div>
        {Object.keys(Thumbnails)
          .slice(0, 5)
          .map((chart) => {
            const { svgCode, name } = Thumbnails[chart];
            return <Thumbnail key={chart} svg={svgCode} alt={name} width={200} />;
          })}
      </div>

      <br />

      <code>{`<Thumbnail chart={'pie_chart'} width="200" />`}</code>
      <div>
        <Thumbnail chart={'pie_chart'} width="200" />
      </div>

      <code>{`<Thumbnail svg={Thumbnails.radar_chart.svgCode} width="200" />`}</code>
      <div>
        <Thumbnail svg={Thumbnails.radar_chart.svgCode} width="200" />
      </div>

      <code>{`<img src={\`data:image/svg+xml;utf8,\${encodeURIComponent(BAR_CHART.svgCode)}\`} />`}</code>
      <div>
        <img src={`data:image/svg+xml;utf8,${encodeURIComponent(BAR_CHART.svgCode)}`} width="200" />
      </div>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
