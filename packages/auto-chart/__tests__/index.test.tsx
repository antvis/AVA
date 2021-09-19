import React from 'react';
import ReactDom from 'react-dom';
import { act } from 'react-dom/test-utils';
import { AutoChart } from '../src';

describe('template', () => {
  act(() => {
    ReactDom.render(<AutoChart data={[]} />, document.body);
  });
  test('export', () => {
    const div = document.createElement('div');
    div.innerText = '123';
    document.body.appendChild(div);
    expect(div.innerText).toBe('123');
  });
});
