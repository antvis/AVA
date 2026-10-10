'use client'

import { useState } from 'react'
import { Header, Footer } from '../../components'
import HomePage from '../../components/HomePage'

export default function AIPlaygroundPage() {
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