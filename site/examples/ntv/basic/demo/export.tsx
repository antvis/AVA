import React, { useState, useEffect, useRef } from 'react';

import ReactDOM from 'react-dom';
import { Space, Button, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import copy from 'copy-to-clipboard';
import { NarrativeTextVis, TextExporter, createRatioValue, createDeltaValue, copyToClipboard } from '@antv/ava-react';

const exporter = new TextExporter();

function getSignAssessmentText(value, metadata) {
  if (metadata?.assessment === 'negative') return `-${value}`;
  return `${metadata?.assessment === 'positive' ? '+' : ''}${value}`;
}

const exportWithSign = new TextExporter([
  createRatioValue({ getText: getSignAssessmentText }),
  createDeltaValue({ getText: getSignAssessmentText }),
]);

const App = () => {
  const containerRef = useRef();
  const [booking, setSpec] = useState({});
  useEffect(() => {
    fetch('https://assets.antv.antgroup.com/ava/ntv-booking.json')
      .then((res) => res.json())
      .then(setSpec);
  }, []);
  const onCopySuccess = () => {
    message.success('复制成功');
  };
  const onClickCopyButton = async () => {
    const html = await exporter.getNarrativeHtml(containerRef.current);
    const plainText = exporter.getNarrativeText(booking);
    copyToClipboard(html, plainText, onCopySuccess);
  };
  return (
    <div ref={containerRef}>
      <Space>
        <Button
          icon={<CopyOutlined />}
          onClick={() => {
            const res = copy(exporter.getNarrativeText(booking));
            if (res) message.success('复制成功');
          }}
        >
          复制默认文本
        </Button>
        <Button
          icon={<CopyOutlined />}
          onClick={() => {
            const res = copy(exportWithSign.getNarrativeText(booking));
            if (res) message.success('复制成功');
          }}
        >
          复制带正号的文本
        </Button>
        <Button type="primary" icon={<CopyOutlined />} onClick={onClickCopyButton}>
          复制富文本
        </Button>
      </Space>
      <NarrativeTextVis spec={booking} onCopySuccess={onCopySuccess} />
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
