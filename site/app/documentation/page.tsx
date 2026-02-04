'use client'

import Documentation from '../../components/Documentation'
import { Header, Footer } from '../../components'

export default function DocumentationPage() {
  return (
    <>
      <Header onOpenConfig={() => {}} />
      <Documentation />
      <Footer />
    </>
  )
}
