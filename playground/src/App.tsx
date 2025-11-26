import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import AdviseSummary from './examples/advise';
import MultipleChartsDemo from './examples/advise/multiple';
import Insight from './examples/insight';
import RenderCustom from './examples/render/custom';
import RenderDefault from './examples/render/default';
import RenderDemand from './examples/render/demand';
import RenderGPTVis from './examples/render/gpt-vis';
import RenderGPTVisSSR from './examples/render/gpt-vis-ssr';
import './App.css';

const { Header, Content, Sider } = Layout;

// 菜单项配置类型
interface MenuItemConfig {
  key: string;
  label: string;
  path: string;
  component: React.ComponentType;
}

interface SubMenuConfig {
  key: string;
  label: string;
  children: MenuItemConfig[];
}

interface MenuConfig {
  key: string;
  label: string;
  children: SubMenuConfig[];
}

// 菜单配置
const menuConfig: MenuConfig[] = [
  {
    key: 'advice',
    label: '图表示例',
    children: [
      {
        key: 'advise-summary',
        label: '图表推荐',
        children: [
          {
            key: 'advise-summary-basic',
            label: '基础示例',
            path: '/advise-summary',
            component: AdviseSummary,
          },
          {
            key: 'advise-summary-multiple',
            label: '多图表示例',
            path: '/advise-summary-multiple',
            component: MultipleChartsDemo,
          },
        ],
      },
      {
        key: 'render-summary',
        label: '图表渲染',
        children: [
          {
            key: 'render-summary-basic',
            label: '基础示例',
            path: '/render-summary',
            component: RenderDefault,
          },
          {
            key: 'render-summary-demand',
            label: 'GPT-Vis 按需引用',
            path: '/render-demand',
            component: RenderDemand,
          },
          {
            key: 'render-summary-custom',
            label: '自定义示例',
            path: '/render-custom',
            component: RenderCustom,
          },
          {
            key: 'render-summary-gpt-vis',
            label: 'GPT-Vis MarkDown示例',
            path: '/render-gpt-vis',
            component: RenderGPTVis,
          },
          {
            key: 'render-summary-gpt-vis-ssr',
            label: 'GPT-Vis ssr 示例',
            path: '/render-gpt-vis-ssr',
            component: RenderGPTVisSSR,
          },
        ],
      },
      {
        key: 'insight',
        label: '数据洞察',
        children: [
          {
            key: 'insight-basic',
            label: '基础示例',
            path: '/insight',
            component: Insight,
          },
        ],
      },
    ],
  },
];

// 从配置生成路由映射
const routeToMenuKey: Record<string, string> = {};
const routeComponents: Array<{ path: string; component: React.ComponentType }> = [];

menuConfig.forEach((topMenu) => {
  topMenu.children.forEach((subMenu) => {
    subMenu.children.forEach((item) => {
      routeToMenuKey[item.path] = item.key;
      routeComponents.push({ path: item.path, component: item.component });
    });
  });
});

// 设置默认路由
routeToMenuKey['/'] = 'advise-summary-basic';

// 从配置生成菜单项
const generateMenuItems = (config: MenuConfig[]): MenuProps['items'] => {
  return config.map((topMenu) => ({
    key: topMenu.key,
    label: topMenu.label,
    children: topMenu.children.map((subMenu) => ({
      key: subMenu.key,
      label: subMenu.label,
      children: subMenu.children.map((item) => ({
        key: item.key,
        label: <Link to={item.path}>{item.label}</Link>,
      })),
    })),
  }));
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const selectedKey = routeToMenuKey[location.pathname] || 'advise-summary-basic';

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>AVA Playground</Header>
      <Layout>
        <Sider width={220}>
          <Menu
            mode="inline"
            selectedKeys={[selectedKey]}
            defaultOpenKeys={['advice', 'advise-summary', 'render-summary', 'insight']}
            style={{ height: '100%', borderRight: 0 }}
            items={generateMenuItems(menuConfig)}
          />
        </Sider>
        <Layout>
          <Content
            style={{
              background: '#fff',
              margin: 0,
              minHeight: 280,
            }}
          >
            <Routes>
              <Route path="/" element={<AdviseSummary />} />
              {routeComponents.map(({ path, component: Component }) => (
                <Route key={path} path={path} element={<Component />} />
              ))}
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
