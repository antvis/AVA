import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Input, Select, Divider } from 'antd';
import { random } from '@antv/data-wizard';

const { TextArea } = Input;
const { Option } = Select;

const randomCategories = ['Basic', 'Address', 'Color', 'Datetime', 'Location', 'Text', 'Web'];
const randomTypes = {
  Basic: ['boolean', 'integer', 'float', 'natural'],
  Address: ['country', 'province', 'city', 'district', 'road', 'address', 'postcode'],
  Color: ['rgb', 'rgba', 'hsl', 'hsla', 'colorname', 'hexcolor', 'decimalcolor'],
  Datetime: ['date', 'time', 'datetime', 'timestamp', 'weekday', 'month'],
  Location: ['latitude', 'longtitude', 'coordinates'],
  Text: [
    'character',
    'string',
    'syllable',
    'word',
    'sentence',
    'paragraph',
    'name',
    'lastname',
    'firstname',
    'cname',
    'cfirstname',
    'clastname',
    'ccharacter',
    'cword',
    'csentence',
    'cparagraph',
    'phone',
    'cZodiac',
  ],
  Web: ['url', 'domain', 'ipv4', 'ipv6', 'email', 'tld'],
};

const R = new random.Random();

const App = () => {
  const [types, setTypes] = useState(randomTypes[randomCategories[0]]);
  const [type, setType] = useState(randomTypes[randomCategories[0]][0]);

  const onCategoryChange = (value) => {
    setTypes(randomTypes[value]);
    setType(randomTypes[value][0]);
  };

  const onTypeChange = (value) => {
    setType(value);
  };

  return (
    <div>
      <h3>Random Type</h3>
      <Select
        style={{ width: '240px', marginRight: '20px' }}
        defaultValue={randomCategories[0]}
        onChange={onCategoryChange}
      >
        {randomCategories.map((c) => (
          <Option key={c}>{c}</Option>
        ))}
      </Select>
      <Select style={{ width: '240px' }} value={type} onChange={onTypeChange}>
        {types.map((t) => (
          <Option key={t}>{t}</Option>
        ))}
      </Select>
      <Divider />
      <h3>Data</h3>
      <TextArea style={{ resize: 'none', width: '500px', height: '100px' }} value={JSON.stringify(R[type]())} />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
