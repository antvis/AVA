import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { specToG2Plot } from '@antv/antv-spec';
import { colorToHex } from '@antv/smart-color';

import { Advisor } from '@antv/chart-advisor';

const myAdvisor = new Advisor();

// contants

const defaultData = [
  { type: '石油', value: 1200 },
  { type: '电子', value: 250 },
  { type: '机械', value: 180 },
  { type: '食物', value: 150 },
  { type: '服饰', value: 100 },
];

const initColor = {
  model: 'rgb',
  value: { r: 255, g: 36, b: 12 },
};

const theme = {
  primaryColor: colorToHex(initColor),
};

/**
 * `genType`: color generation type
 * options are listed as follows:
 * discrete types:
 * 'monochromatic', 'analogous'
 * '单色配色', '近似配色'
 * categorical types:
 * 'polychromatic', 'split-complementary', 'triadic', 'tetradic'
 * '多色', '补色分割', '三等分配色', '矩形配色'
 */
const genType = 'polychromatic';

/**
 * `simType`: color simulation type
 * options are listed as follows:
 * 'normal', 'protanomaly', 'deuteranomaly', 'tritanomaly',
 * '正常', '红色弱', '绿色弱', '蓝色弱',
 * 'protanopia', 'deuteranopia', 'tritanopia',
 * '红色盲', '绿色盲', '蓝色盲',
 * 'achromatomaly', 'achromatopsia'
 * '全色弱', '全色盲'
 */
const simType = 'protanomaly';

const setColors = {
  /**
   * `themeColor`: color in Hex string
   * such as '#ff5733'
   * theme of SmartColor mode
   * default is lite blue
   */
  themeColor: colorToHex(initColor),
  /**
   * `colorSchemeType`: color generation type
   * contains discrete and categorical types
   * default value is 'monochromatic' or 'polychromatic' based on data type
   */
  colorSchemeType: genType,
  /**
   * `simulationType`: color simulation type
   * employed for color blindness and grayscale
   * default value is 'normal'
   */
  simulationType: simType,
};

const App = () => {
  const currentAdvice = 0;
  const advices = myAdvisor.advise({
    data: defaultData,
    options: {
      theme,
    },
  });
  const advicesWithColor = myAdvisor.advise({
    data: defaultData,
    /**
     * `smartColor`: SmartColor mode on/off
     * SmartColor mode contains default color options
     */
    smartColor: true,
    /**
     * `colorOptions`: SmartColor options
     * This variable is optional for SmartColor mode
     */
    colorOptions: setColors,
  });

  useEffect(() => {
    if (advices[currentAdvice]) {
      specToG2Plot(advices[currentAdvice].spec, document.getElementById('init'));
    }
    if (advicesWithColor[currentAdvice]) {
      specToG2Plot(advicesWithColor[currentAdvice].spec, document.getElementById('smart'));
    }
  }, []);

  return (
    <>
      <p>Render chart with specified color theme.</p>

      <div className="init-content" style={{ height: 'calc(55% - 80px)' }}>
        <div id="init" key="plot" style={{ flex: 5, height: '100%' }}></div>
      </div>

      <p>
        Render chart with SmartColor using <b>{genType}</b> method for <b>{simType}</b> color blindness.
      </p>

      <div className="smart-content" style={{ height: 'calc(55% - 80px)' }}>
        <div id="smart" key="plot" style={{ flex: 5, height: '100%' }}></div>
      </div>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
