import * as React from 'react';
import { Layout, Menu } from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  RobotOutlined,
  ApartmentOutlined,
  EyeOutlined,
  ApiOutlined,
  CarryOutOutlined,
  SisternodeOutlined,
} from '@ant-design/icons';
import { AutoChartTest } from './AutoChartTest';
// import { FindInsightTest } from './FindInsightTest/index';
import { DataTransformTest } from './DataTransformTest';
import { PipelineTest } from './pipelineTest';
import { LinterDemo } from './Linter';
import { LinterExtendDemo } from './LinterExtend';

const { Header, Sider, Content } = Layout;

const tuple = <T extends string[]>(...args: T) => args;

const TESTS = tuple('autoChart', 'pipeline', 'dataTransform', 'linter', 'linterExtend'); //insights
type TestType = typeof TESTS[number];

const testComponents: Record<TestType, any> = {
  autoChart: <AutoChartTest />,
  pipeline: <PipelineTest />,
  // insights: <FindInsightTest />,
  dataTransform: <DataTransformTest />,
  linter: <LinterDemo />,
  linterExtend: <LinterExtendDemo />,
};

const icons = {
  autoChart: <RobotOutlined />,
  pipeline: <ApartmentOutlined />,
  insights: <EyeOutlined />,
  dataTransform: <ApiOutlined />,
  linter: <CarryOutOutlined />,
  linterExtend: <SisternodeOutlined />,
};

interface TestState {
  test: TestType;
  collapsed: boolean;
}
class App extends React.Component<{}, TestState> {
  constructor(props: {}) {
    super(props);

    this.state = {
      test: 'autoChart', // init for test
      collapsed: false,
    };
  }

  setTest = (t: TestType) => {
    this.setState({
      test: t,
    });
  };

  toggle = () => {
    this.setState({
      collapsed: !this.state.collapsed,
    });
  };

  render() {
    const { test, collapsed } = this.state;

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
            <Menu mode="inline" selectedKeys={[test]} style={{ height: '100%', borderRight: 0 }}>
              {TESTS.map((t) => (
                <Menu.Item
                  key={t}
                  onClick={() => {
                    this.setTest(t);
                  }}
                  icon={icons[t]}
                >
                  {`${t}`}
                </Menu.Item>
              ))}
            </Menu>
          </Sider>
          <Content style={{ padding: 24 }}>{testComponents[test]}</Content>
        </Layout>
      </Layout>
    );
  }
}

export default App;
