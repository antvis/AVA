import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { AVA, bindRenderer } from '@antv/ava';

const { createRoot } = ReactDOM;

const renderChart = async (container, spec) => {
  const mount = typeof container === 'string' ? document.querySelector(container) : container;
  if (!mount) return;

  try {
    mount.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">正在生成图表...</div>';

    const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(spec))}`;

    const response = await fetch(chartUrl, {
      method: 'GET',
      mode: 'cors',
      cache: 'default',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // 获取图片 blob
    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);

    // 渲染图片
    mount.innerHTML = '';
    const img = document.createElement('img');
    img.src = imageUrl;
    img.alt = 'Generated Chart';
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    img.style.display = 'block';

    img.onerror = () => {
      mount.innerHTML = '<div style="padding: 20px; text-align: center; color: #ff4d4f;">图片加载失败</div>';
    };

    // 清理 blob URL
    img.onload = () => {
      URL.revokeObjectURL(imageUrl);
    };

    mount.appendChild(img);

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
    bindRenderer(renderChart);
    ava.render('#chart', {
      type:'bar',
      data:{
      labels:['Q1','Q2','Q3','Q4'],
      datasets:[
        {label:'Users',data:[50,60,70,180]},
        {label:'Revenue',data:[100,200,300,400]}]
      }
    });
    return () => {
      ava.destroy();
    };
  }, []);

  return <div id="chart" />;
};

const root = createRoot(document.getElementById('container'));
root.render(<App />);
