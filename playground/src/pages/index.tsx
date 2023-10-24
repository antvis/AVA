import * as React from 'react';

import { Layout, Menu } from 'antd';
import { MenuUnfoldOutlined, MenuFoldOutlined } from '@ant-design/icons';

import manifest, { Demo } from '../manifest';

import './index.less';

const { Header, Sider, Content } = Layout;

interface TestState {
  collapsed: boolean;
  openCategories: string[];
  demo: Demo;
}
class App extends React.Component<{}, TestState> {
  constructor(props: {}) {
    super(props);

    const openCategories = ['ava', 'ava-react'];
    const demo = manifest.avaReactDemos[1];

    this.state = {
      openCategories,
      demo,
      collapsed: false,
    };
  }

  onMenuTitleClick = (key: string) => {
    const { openCategories } = this.state;
    if (openCategories.includes(key)) {
      const newOC = openCategories.filter((e) => e !== key);
      this.setState({
        openCategories: newOC,
      });
    } else {
      const newOC = [...openCategories, key];
      this.setState({
        openCategories: newOC,
      });
    }
  };

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
    const { demo, collapsed, openCategories } = this.state;

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
            <Menu
              mode="inline"
              selectedKeys={[demo.id]}
              defaultOpenKeys={openCategories}
              style={{ height: '100%', borderRight: 0 }}
            >
              <Menu.SubMenu title="ava" key="ava">
                {manifest.avaDemos.map((demo) => {
                  return (
                    <Menu.Item
                      key={demo.id}
                      onClick={() => {
                        this.setDemo(demo);
                      }}
                      icon={demo.icon}
                    >
                      {demo.name}
                    </Menu.Item>
                  );
                })}
              </Menu.SubMenu>
              <Menu.SubMenu title="ava-react" key="ava-react">
                {manifest.avaReactDemos.map((demo) => {
                  return (
                    <Menu.Item
                      key={demo.id}
                      onClick={() => {
                        this.setDemo(demo);
                      }}
                      icon={demo.icon}
                    >
                      {demo.name}
                    </Menu.Item>
                  );
                })}
              </Menu.SubMenu>
            </Menu>
          </Sider>
          <Content style={{ padding: 24 }}>{demo.contentComp}</Content>
        </Layout>
      </Layout>
    );
  }
}

export default App;
