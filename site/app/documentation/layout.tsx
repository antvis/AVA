import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AVA Documentation - AI-Native Visual Analytics | AntV',
  description: 'Complete documentation for AVA - AI-Native Visual Analytics. Learn about installation, quick start, architecture, API reference, and best practices for using AVA in your projects.',
  openGraph: {
    type: 'website',
    url: 'https://ava.antv.vision/documentation/',
    title: 'AVA Documentation - AI-Native Visual Analytics | AntV',
    description: 'Complete documentation for AVA - AI-Native Visual Analytics. Learn about installation, quick start, architecture, API reference, and best practices for using AVA in your projects.',
    images: [{
      url: 'https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*yOHIQ48aRwgAAAAAAAAAAAAADmJ7AQ/original',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AVA Documentation - AI-Native Visual Analytics | AntV',
    description: 'Complete documentation for AVA - AI-Native Visual Analytics. Learn about installation, quick start, architecture, API reference, and best practices for using AVA in your projects.',
    images: ['https://mdn.alipayobjects.com/huamei_qa8qxu/afts/img/A*yOHIQ48aRwgAAAAAAAAAAAAADmJ7AQ/original'],
  },
}

export default function DocumentationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
