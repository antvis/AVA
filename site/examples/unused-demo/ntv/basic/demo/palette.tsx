import React, { useState, useEffect } from 'react';

import ReactDOM from 'react-dom';
import { Form, Skeleton, Popover } from 'antd';
import { NarrativeTextVis, seedToken } from '@antv/ava-react';
import { TwitterPicker } from 'react-color';

const ColorSelector: React.FC<{ value?: string; onChange?: (color: string) => void }> = ({ value, onChange }) => {
  return (
    <Popover
      placement="bottom"
      content={
        <TwitterPicker
          color={value}
          onChange={(color) => {
            onChange(color.hex);
          }}
        />
      }
    >
      <span
        style={{
          cursor: 'pointer',
          display: 'inline-block',
          width: 30,
          height: 30,
          borderRadius: 4,
          backgroundColor: value,
        }}
      ></span>
    </Popover>
  );
};

const App = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(true);
  const [spec, setSpec] = useState({});
  const metricValueColor = Form.useWatch('metricValueColor', form);
  const positiveColor = Form.useWatch('positiveColor', form);
  const negativeColor = Form.useWatch('negative_color', form);

  useEffect(() => {
    fetch('https://assets.antv.antgroup.com/ava/ntv-booking.json')
      .then((res) => res.json())
      .then((res) => {
        setSpec(res);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Form
        layout="inline"
        form={form}
        initialValues={{
          metricValueColor: seedToken.colorMetricValue,
          positiveColor: seedToken.colorPositive,
          negative_color: seedToken.colorNegative,
        }}
      >
        <Form.Item label="指标值" name="metricValueColor">
          <ColorSelector />
        </Form.Item>
        <Form.Item label="增长值" name="positiveColor">
          <ColorSelector />
        </Form.Item>
        <Form.Item label="减小值" name="negative_color">
          <ColorSelector />
        </Form.Item>
      </Form>
      {loading ? (
        <Skeleton active />
      ) : (
        <NarrativeTextVis
          spec={spec}
          palette={{
            light: {
              metric_value: {
                color: metricValueColor,
              },
              delta_value: {
                positiveColor,
                negativeColor,
              },
              ratio_value: {
                positiveColor,
                negativeColor,
              },
            },
          }}
        />
      )}
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
