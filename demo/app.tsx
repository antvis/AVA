import * as React from 'react';
import { AutoChartTest } from './AutoChartTest';
import { PipelineTest } from './PipelineTest';
import { FindInsightTest } from './FindInsightTest';

type TestType = 'autoChart' | 'pipeline' | 'insights';

interface TestState {
  test: TestType;
}
class App extends React.Component<{}, TestState> {
  constructor(props: {}) {
    super(props);

    this.state = {
      test: 'pipeline',
    };
  }

  setTest = (t: TestType) => {
    this.setState({
      test: t,
    });
  };
  render() {
    const { test } = this.state;

    const nav = (
      <nav>
        <ul>
          <li
            onClick={() => {
              this.setTest('autoChart');
            }}
            style={{ color: `${test === 'autoChart' ? 'blue' : 'black'}` }}
          >
            autoChart
          </li>
          <li
            onClick={() => {
              this.setTest('pipeline');
            }}
            style={{ color: `${test === 'pipeline' ? 'blue' : 'black'}` }}
          >
            pipeline
          </li>
          <li
            onClick={() => {
              this.setTest('insights');
            }}
            style={{ color: `${test === 'insights' ? 'blue' : 'black'}` }}
          >
            insights
          </li>
        </ul>
      </nav>
    );

    return (
      <>
        {nav}
        {test === 'autoChart' ? <AutoChartTest /> : null}
        {test === 'pipeline' ? <PipelineTest /> : null}
        {test === 'insights' ? <FindInsightTest /> : null}
      </>
    );
  }
}

export default App;
