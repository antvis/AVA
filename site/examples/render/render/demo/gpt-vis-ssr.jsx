import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { AVA, bindRenderer } from '@antv/ava';

const { createRoot } = ReactDOM;

const renderPie = async (container, spec) => {
  const mount = typeof container === 'string' ? document.querySelector(container) : container;
  if (!mount) return;

  try {
    const response = await fetch('https://antv-studio.alipay.com/api/gpt-vis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(spec),
    });

    const result = await response.json();

    if (result.success && result.resultObj) {
      mount.innerHTML = '';
      const img = document.createElement('img');
      img.src = result.resultObj;
      img.alt = 'Generated Chart';
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      mount.appendChild(img);
    } else {
      throw new Error(`API 调用失败: ${result.errorMessage}`);
    }

  } catch (error) {
    mount.innerHTML = `
      <div style="padding: 20px; border: 1px solid #ffccc7; background: #fff2f0; border-radius: 4px;">
        <div style="color: #ff4d4f; margin-bottom: 8px; font-weight: bold;">⚠️ 错误</div>
        <div style="color: #666; font-size: 14px;">渲染失败: ${error.message}</div>
        <div style="margin-top: 12px; color: #999; font-size: 12px;">
          Spec: ${JSON.stringify(spec, null, 2)}
        </div>
      </div>
    `;
  }
};

const ava = new AVA();

const App = () => {
  useEffect(() => {
    bindRenderer(renderPie);
    ava.render('#chart', {
      type: 'pie',
      data: [
        { category: '分类一', value: 27 },
        { category: '分类二', value: 25 },
        { category: '分类三', value: 18 },
        { category: '分类四', value: 15 },
        { category: '分类五', value: 10 },
        { category: '其他', value: 5 },
      ],
    });

    return () => {
      ava.destroy();
    };
  }, []);

  return <div id="chart" />;
};

const root = createRoot(document.getElementById('container'));
root.render(<App />);
