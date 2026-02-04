import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AVA - AI-Native Visual Analytics | AntV',
  description: 'AVA is a technology framework designed for more convenient visual analytics. AI-native, automated visual analytics with natural language queries, LLM-powered analysis, and smart data handling.',
  keywords: 'AVA, visual analytics, AI-native, LLM, data visualization, natural language, data analysis, AntV, chart generation',
  authors: [{ name: 'AntV' }],
  openGraph: {
    type: 'website',
    url: 'https://ava.antv.vision/',
    title: 'AVA - AI-Native Visual Analytics | AntV',
    description: 'AVA is a technology framework designed for more convenient visual analytics. AI-native, automated visual analytics with natural language queries, LLM-powered analysis, and smart data handling.',
    images: [{
      url: 'https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*yOHIQ48aRwgAAAAAAAAAAAAADmJ7AQ/original',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AVA - AI-Native Visual Analytics | AntV',
    description: 'AVA is a technology framework designed for more convenient visual analytics. AI-native, automated visual analytics with natural language queries, LLM-powered analysis, and smart data handling.',
    images: ['https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*yOHIQ48aRwgAAAAAAAAAAAAADmJ7AQ/original'],
  },
  icons: {
    icon: 'https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*FBLnQIAzx6cAAAAAQDAAAAgAemJ7AQ/original',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            // Buffer polyfill for browser compatibility with csv-parse
            window.Buffer = window.Buffer || {
              isBuffer: function() { return false; },
              from: function(str) { return new TextEncoder().encode(str); },
              alloc: function(size) { return new Uint8Array(size); },
            };
          `
        }} />
      </head>
      <body className="min-h-screen bg-[#f8fbfc]">
        {children}
      </body>
    </html>
  )
}
