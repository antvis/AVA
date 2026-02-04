import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read the base HTML template
const distPath = path.resolve(__dirname, '../dist');
const indexPath = path.join(distPath, 'index.html');
const indexHtml = fs.readFileSync(indexPath, 'utf-8');

// Create documentation page HTML with updated meta tags
const documentationHtml = indexHtml
  .replace(
    '<title>AVA - AI-Native Visual Analytics | AntV</title>',
    '<title>AVA Documentation - AI-Native Visual Analytics | AntV</title>'
  )
  .replace(
    '<meta name="description" content="AVA is a technology framework designed for more convenient visual analytics. AI-native, automated visual analytics with natural language queries, LLM-powered analysis, and smart data handling." />',
    '<meta name="description" content="Complete documentation for AVA - AI-Native Visual Analytics. Learn about installation, quick start, architecture, API reference, and best practices for using AVA in your projects." />'
  )
  .replace(
    '<meta property="og:title" content="AVA - AI-Native Visual Analytics | AntV" />',
    '<meta property="og:title" content="AVA Documentation - AI-Native Visual Analytics | AntV" />'
  )
  .replace(
    '<meta property="og:description" content="AVA is a technology framework designed for more convenient visual analytics. AI-native, automated visual analytics with natural language queries, LLM-powered analysis, and smart data handling." />',
    '<meta property="og:description" content="Complete documentation for AVA - AI-Native Visual Analytics. Learn about installation, quick start, architecture, API reference, and best practices for using AVA in your projects." />'
  )
  .replace(
    '<meta property="twitter:title" content="AVA - AI-Native Visual Analytics | AntV" />',
    '<meta property="twitter:title" content="AVA Documentation - AI-Native Visual Analytics | AntV" />'
  )
  .replace(
    '<meta property="twitter:description" content="AVA is a technology framework designed for more convenient visual analytics. AI-native, automated visual analytics with natural language queries, LLM-powered analysis, and smart data handling." />',
    '<meta property="twitter:description" content="Complete documentation for AVA - AI-Native Visual Analytics. Learn about installation, quick start, architecture, API reference, and best practices for using AVA in your projects." />'
  )
  .replace(
    '<meta property="og:url" content="https://ava.antv.vision/" />',
    '<meta property="og:url" content="https://ava.antv.vision/documentation" />'
  )
  .replace(
    '<meta property="twitter:url" content="https://ava.antv.vision/" />',
    '<meta property="twitter:url" content="https://ava.antv.vision/documentation" />'
  )
  .replace(
    '<link rel="canonical" href="https://ava.antv.vision/" />',
    '<link rel="canonical" href="https://ava.antv.vision/documentation" />'
  );

// Write the pre-rendered documentation page
const documentationPath = path.join(distPath, 'documentation.html');
fs.writeFileSync(documentationPath, documentationHtml);

console.log('✓ Pre-rendered documentation.html with updated meta tags');
