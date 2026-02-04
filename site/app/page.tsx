'use client'

import { useState } from 'react'
import HomePage from '../components/HomePage'
import { Header, Footer } from '../components'

export default function Home() {
  const [isConfigOpen, setIsConfigOpen] = useState(false)

  return (
    <>
      <Header onOpenConfig={() => setIsConfigOpen(true)} />
      <HomePage
        onOpenConfig={() => setIsConfigOpen(true)}
        isConfigOpen={isConfigOpen}
        onCloseConfig={() => setIsConfigOpen(false)}
      />
      <Footer />
    </>
  )
}
