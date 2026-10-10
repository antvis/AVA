'use client';

import { useState } from 'react'
import { Header, Footer } from '../../components'
import HomePage from '../../components/HomePage'
import PageShell from '../../components/PageShell'

export default function AIPlaygroundPage() {
  const [isConfigOpen, setIsConfigOpen] = useState(false)

  return (
    <PageShell>
      <Header onOpenConfig={() => setIsConfigOpen(true)} />
      <HomePage
        isConfigOpen={isConfigOpen}
        onCloseConfig={() => setIsConfigOpen(false)}
      />
      <Footer />
    </PageShell>
  )
}