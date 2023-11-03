import React from 'react';

import { EditorProvider, FloatingMenu, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import { Highlight } from './plugins';

// define your extension array
const extensions = [StarterKit, Highlight.configure()];

const content = `
  <p>
    <measure-name>DAU</measure-name>
    <span data-entity-type="metric_value">1.23亿</span>
  </p>
`;

export const AugmentedInput = () => {
  return (
    <EditorProvider extensions={extensions} content={content}>
      <FloatingMenu>This is the floating menu</FloatingMenu>
      <BubbleMenu>This is the bubble menu</BubbleMenu>
    </EditorProvider>
  );
};
