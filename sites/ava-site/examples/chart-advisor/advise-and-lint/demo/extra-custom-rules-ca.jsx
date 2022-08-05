import React, { useRef, useState } from 'react';

import ReactDOM from 'react-dom';
import { JSONView, StepBar, PagList } from 'antv-site-demo-rc';
// import
import { ChartAdvisor } from '@antv/chart-advisor';

// constants
const toyData = [
  { name: 'Alice', age: 19 },
  { name: 'Becky', age: 18 },
  { name: 'Cathy', age: 24 },
];

// custom rule
const ruleWithExtra = {
  id: 'check-blocked-users',
  type: 'HARD',
  docs: {
    lintText: 'No chart recommendation for blocked users.',
  },
  option: {
    off: false,
    extra: {
      userId: '001',
      userPermission: (userId) => {
        // suppose here we query for the permission of the user
        const blocked = userId === '001';
        return blocked;
      },
    },
  },
  trigger: (args) => {
    // if the user is blocked, trigger the rule
    const { userId, userPermission } = args;
    return userPermission(userId);
  },
  validator: (args) => {
    // never recommend for blocked users
    return 0;
  },
};

// custom rule Config
const myRuleCfg = {
  custom: {
    'check-blocked-users': ruleWithExtra,
  },
};

// usage
const myChartAdvisor = new ChartAdvisor({ ruleCfg: myRuleCfg });

const results = myChartAdvisor.advise({ data: toyData });

const App = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const myRef = useRef();

  const onStepChange = (step) => {
    setCurrentStep(step);
  };

  const ruleContent = (
    <>
      You can further customize your rules by setting <b>extra</b> in ruleConfig. Whatever within <b>extra</b> will
      become your customized parameters in <b>trigger</b> and <b>validator</b> function.
      <br />
      <br />
      Here suppose we need to check for a user's permission before recommendation. We add a custom rule to check if a
      user is blocked or not. For a blocked user, ChartAdvisor always recommend nothing.
      <br />
      <br />
      const myRuleCfg =
      <JSONView json={myRuleCfg} rjvConfigs={{ collapsed: false }} />
    </>
  );

  const resultContent = (
    <>
      <br />
      results:
      <PagList
        data={results}
        renderItem={(item) => <JSONView json={item} style={{ height: 300 }} rjvConfigs={{ collapsed: 2 }} />}
      />
    </>
  );

  const steps = [
    {
      title: 'rule',
      desc: '',
      content: ruleContent,
    },
    {
      title: 'result',
      desc: 'Here we can see that in this case, there will be no recommendation for a blocked user.',
      content: resultContent,
    },
  ];

  return (
    <>
      <StepBar current={currentStep} onChange={onStepChange} steps={steps} />

      <p>{steps[currentStep].desc}</p>

      <div className="steps-content" style={{ height: 'calc(100% - 80px)' }}>
        {steps[currentStep].content}
      </div>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById('container'));
