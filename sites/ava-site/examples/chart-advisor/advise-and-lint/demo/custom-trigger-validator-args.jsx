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
const myRule = {
  id: 'check-blocked-users',
  type: 'HARD',
  docs: {
    lintText: 'No chart recommendation for blocked users.',
  },
  option: {
    off: false,
    customTriggerArgs: {
      userId: '001',
      checkUserPermission: (userId) => {
        // suppose here we query and find user 001 is blocked
        return userId === '001';
      },
    },
    customValidatorArgs: {
      scoreForBlockedUser: 0,
    },
  },
  trigger: (args) => {
    // if the user is blocked, trigger the rule
    const { userId, checkUserPermission } = args.customTriggerArgs;
    return checkUserPermission(userId);
  },
  validator: (args) => {
    // never recommend for blocked users
    const { scoreForBlockedUser } = args.customValidatorArgs;
    return scoreForBlockedUser;
  },
};

// custom rule Config
const myRuleCfg = {
  custom: {
    'check-blocked-users': myRule,
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
      You can further customize your rule by passing custom arguments to <b>validator</b> and <b>trigger</b>. To do
      this, you can set <b>customTriggerArgs</b> and <b>customValidatorArgs</b> under the <b>option</b> field.
      <br />
      <br />
      Here suppose we need to check for a user's permission before recommendation. We add a rule with custom validator
      and trigger arguments to check if a user is blocked or not. For a blocked user, ChartAdvisor always recommend
      nothing.
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
