import React from 'react';

import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import { Advisor } from '@antv/ava';

import AdviseSummary from './examples/advise-summary';
import MultipleChartsDemo from './examples/advise-summary/multiple';
import { chartRenderer } from './utils/renderer';

import './App.css';

const { Header, Content, Sider } = Layout;

// 全局只绑定一次渲染器
Advisor.bindRenderer(chartRenderer as any);

// 路由到菜单项的映射
const routeToMenuKey: Record<string, string> = {
  '/': 'advise-summary-basic',
  '/advise-summary': 'advise-summary-basic',
  '/advise-summary-multiple': 'advise-summary-multiple',
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const selectedKey = routeToMenuKey[location.pathname] || 'advise-summary-basic';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>AVA Playground</Header>
      <Layout>
        <Sider width={220} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            defaultOpenKeys={['advice', 'advise-summary']}
            style={{ height: '100%', borderRight: 0 }}
          >
            <Menu.SubMenu key="advice" title="Advice Examples">
              <Menu.SubMenu key="advise-summary" title="Advise Summary">
                <Menu.Item key="advise-summary-basic">
                  <Link to="/advise-summary">基础示例</Link>
                </Menu.Item>
                <Menu.Item key="advise-summary-multiple">
                  <Link to="/advise-summary-multiple">多图表示例</Link>
                </Menu.Item>
              </Menu.SubMenu>
            </Menu.SubMenu>
          </Menu>
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              background: '#fff',
              padding: 24,
              margin: 0,
              minHeight: 280,
            }}
          >
            <Routes>
              <Route path="/" element={<AdviseSummary />} />
              <Route path="/advise-summary" element={<AdviseSummary />} />
              <Route path="/advise-summary-multiple" element={<MultipleChartsDemo />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
