import * as React from 'react';
import { Layout, Menu } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';
import manifest, { Demo } from '../manifest';
import './index.less';

const { Header, Sider, Content } = Layout;

interface TestState {
  collapsed: boolean;
  demo: Demo;
}
class App extends React.Component<{}, TestState> {
  constructor(props: {}) {
    super(props);

    this.state = {
      demo: manifest.demos[0], // init for test
      collapsed: false,
    };
  }

  setDemo = (demo: Demo) => {
    this.setState({
      demo,
    });
  };

  toggle = () => {
    this.setState({
      collapsed: !this.state.collapsed,
    });
  };

  render() {
    const { demo, collapsed } = this.state;

    return (
      <Layout style={{ height: '100vh' }} id="custom-trigger">
        <Header>
          {React.createElement(this.state.collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
            className: 'trigger',
            onClick: this.toggle,
          })}
          AntV AVA
        </Header>
        <Layout>
          <Sider collapsible collapsed={collapsed} trigger={null}>
            <Menu mode="inline" selectedKeys={[demo.name]} style={{ height: '100%', borderRight: 0 }}>
              {manifest.demos.map((demo) => (
                <Menu.Item
                  key={demo.name}
                  onClick={() => {
                    this.setDemo(demo);
                  }}
                  icon={demo.icon}
                >
                  {`${demo.name}`}
                </Menu.Item>
              ))}
            </Menu>
          </Sider>
          <Content style={{ padding: 24 }}>{demo.contentComp}</Content>
        </Layout>
      </Layout>
    );
  }
}

export default App;
