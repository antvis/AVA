'use client'

import { useState } from 'react'
import { Header, Footer, ConfigModal, loadLLMConfig, saveLLMConfig } from '../components'
import { Banner, Playground } from '../components'
import type { LLMConfig } from '@antv/ava/browser'
import {
  AnalyticsPipeline,
  TrustedAnalytics,
  RealWorldData,
  Integrate,
  OpenSource,
  FinalCTA,
} from '../components/landing'

export default function Home() {
  // LLM settings modal (shared with the interactive examples below)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(loadLLMConfig)

  const handleSaveConfig = (config: LLMConfig) => {
    setLlmConfig(config)
    saveLLMConfig(config)
  }

  return (
    <>
      {/* 01 — Navigation */}
      <Header onOpenConfig={() => setIsConfigOpen(true)} />
      {/* 02 — Hero Banner (existing implementation, preserved) */}
      <Banner />
      {/* 03 — Interactive Examples (existing agent demo, preserved) */}
      <Playground />
      {/* 04 — End-to-End Analytics */}
      <AnalyticsPipeline />
      {/* 05 — Trusted by Design */}
      <TrustedAnalytics />
      {/* 06 — Built for Real-World Data */}
      <RealWorldData />
      {/* 07 — Integrate Your Way */}
      <Integrate />
      {/* 08 — Open Source & Extensible */}
      <OpenSource />
      {/* 09 — Final CTA */}
      <FinalCTA />
      {/* 10 — Footer */}
      <Footer />
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={llmConfig}
        onSave={handleSaveConfig}
      />
    </>
  )
}