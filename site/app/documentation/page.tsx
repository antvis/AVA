'use client'

import { useState } from 'react'
import { Header, Footer, ConfigModal, loadLLMConfig, saveLLMConfig } from '../../components'
import Documentation from '../../components/Documentation'
import PageShell from '../../components/PageShell'
import type { LLMConfig } from '@antv/ava/browser'

export default function DocumentationPage() {
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [llmConfig, setLlmConfig] = useState<LLMConfig>(loadLLMConfig)

  const handleSaveConfig = (config: LLMConfig) => {
    setLlmConfig(config)
    saveLLMConfig(config)
  }

  return (
    <>
      <PageShell>
        <Header onOpenConfig={() => setIsConfigOpen(true)} />
        <Documentation />
        <Footer />
      </PageShell>
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={llmConfig}
        onSave={handleSaveConfig}
      />
    </>
  )
}