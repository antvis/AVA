import React from 'react';
import { AdvisorPanel } from './Advisor/AdvisorPanel';
import { LinterPanel } from './Linter/LinterPanel';
import { CAPanel } from './CA/CAPanel';

export default function App() {
  return (
    <div style={{ backgroundColor: 'white' }}>
      <AdvisorPanel></AdvisorPanel>
      <LinterPanel></LinterPanel>
      <CAPanel></CAPanel>
    </div>
  );
}
