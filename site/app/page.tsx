'use client'

import { useState } from 'react'
import styles from './landing.module.css'
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
      <div className={styles.canvas}>
        <div className={styles.sheet}>
          <Header onOpenConfig={() => setIsConfigOpen(true)} />
          <div className={styles.hero}>
            <div className={styles.orb} aria-hidden="true" />
            <Banner />
            <Playground />
          </div>
          <div className={styles.features}>
            <AnalyticsPipeline />
            <TrustedAnalytics />
            <RealWorldData />
            <Integrate />
            <OpenSource />
          </div>
          <div className={styles.closing}>
            <FinalCTA />
            <Footer />
          </div>
        </div>
      </div>
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={llmConfig}
        onSave={handleSaveConfig}
      />
    </>
  )
}
