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

/* The little brand orb — pure JSX/ Tailwind (was `.orb` + `.orb::after` in CSS) */
const Orb: React.FC = () => (
  <div
    aria-hidden="true"
    className="relative mx-auto mb-5 h-11 w-11 rounded-full border border-[#ffffffc0]
      bg-[radial-gradient(circle_at_30%_20%,#efffff,transparent_32%),conic-gradient(from_35deg,#2996cf,#a8e5ff,#d5f5ff,#67bddf,#247ab9,#c8f0ff,#2996cf)]
      shadow-[inset_-5px_-7px_10px_#245c9440,inset_2px_2px_4px_#fff9,0_12px_20px_#539ac430]"
  >
    <div className="absolute inset-x-[-3px] inset-y-[7px] rotate-[-32deg] rounded-full border-2 border-[#e4faffb3] shadow-[0_1px_2px_#4889b2]" />
  </div>
)

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
      {/* canvas — was `.canvas`: min-height, ink color, body font, DM Sans headings */}
      <div className="min-h-screen font-sans text-[#24212d] [--font-heading:'DM Sans',sans-serif]">
        {/* sheet — was `.sheet`: page rhythm, anchor focus ring, scroll offset */}
        <div
          className="w-full bg-white
            [&_[id]]:scroll-mt-[110px]
            [&_:is(a,button,textarea)]:focus-visible:outline-2
            [&_:is(a,button,textarea)]:focus-visible:outline-offset-4
            [&_:is(a,button,textarea)]:focus-visible:outline-[#4ec4ef]
            motion-reduce:[&_*]:transition-none
            [&>header>div]:h-[84px] [&>header>div]:px-10
            [&>header_a:hover]:text-[#4ec4ef]
            [&>header_button]:rounded-[9px] [&>header_button]:bg-[#24212d] [&>header_button]:text-white
            [&>header_button:hover]:bg-[#4ec4ef] [&>header_button:hover]:text-white
            max-md:[&>header>div]:h-[70px] max-md:[&>header>div]:px-[18px]"
        >
          <Header onOpenConfig={() => setIsConfigOpen(true)} />

          {/* hero — was `.hero`: bordered plate with layered light-blue gradients */}
          <div
            className="relative mx-6 mb-16 rounded-[28px] border border-[#edf7fc] px-7 pb-[52px] pt-9
              bg-[radial-gradient(ellipse_at_85%_80%,#cceaf680,transparent_50%),linear-gradient(150deg,#eef8ff,#f8fcfe_55%,#edfaff)]
              [&>section]:mt-0
              [&>section>div[aria-hidden]]:hidden
              [&>section>div:last-child]:m-0 [&>section>div:last-child]:pb-0
              [&>section>div:last-child>div]:gap-5 [&>section>div:last-child>div]:pb-[38px]
              [&_p]:max-w-[520px] [&_p]:text-[14px] [&_p]:leading-[1.7]
              [&_.hero-rise_a]:rounded-[9px]
              [&>main]:mx-auto [&>main]:max-w-[1040px] [&>main]:pb-0
              [&_#playground]:rounded-[25px] [&_#playground]:border-2 [&_#playground]:border-transparent
              [&_#playground]:bg-[linear-gradient(#fff,#fff)_padding-box,linear-gradient(125deg,#c9e3f1,#d7eff8_55%,#bce8fb)_border-box]
              [&_#playground]:shadow-[0_16px_45px_#589db312,0_3px_7px_#38749310]
              [&_#playground>div]:p-3
              [&_#playground_section]:h-[510px]
              max-md:[&_#playground]:rounded-[18px]
              max-md:[&_#playground>div]:p-1
              max-md:[&_#playground_section]:h-[460px]
              max-md:[&>main]:mx-auto max-md:[&>main]:max-w-[1040px]
              max-md:[&_p]:text-[13px]
              max-md:[&_.hero-rise]:gap-2
              max-md:[&_h1>span:first-child]:whitespace-normal
              max-md:[&_h1>span:first-child>span:first-child]:mb-1
              max-md:[&_h1>span:first-child>span:first-child]:block
              max-md:[&_h1>span:first-child>span:last-child]:whitespace-nowrap
              max-md:mx-2.5 max-md:rounded-[18px] max-md:px-3.5 max-md:pb-6 max-md:pt-7
              max-md:[&>section>div:last-child>div]:gap-[17px]
              max-md:[&>section>div:last-child>div]:pb-7
              max-md:[&_.hero-rise_a]:px-4 max-md:[&_.hero-rise_a]:text-xs"
          >
            <Orb />
            <Banner />
            <Playground />
          </div>

          {/* feature sections */}
          <div>
            <AnalyticsPipeline />
            <TrustedAnalytics />
            <RealWorldData />
            <Integrate />
            <OpenSource />
          </div>

          {/* closing — was `.closing`: radial brand washes over a light gradient */}
          <div
            className="overflow-hidden
              bg-[radial-gradient(ellipse_at_12%_0%,color-mix(in_srgb,#78d3f8_26%,transparent),transparent_45%),
                radial-gradient(ellipse_at_90%_100%,color-mix(in_srgb,#a8e5ff_45%,transparent),transparent_55%),
                linear-gradient(150deg,#f4fbfe,#f8fcfe_55%,#f2fafe)]
              [&>footer>div]:py-0 [&>footer>div]:pt-10 [&>footer>div]:pb-7
              max-md:[&>footer>div>div:first-child]:grid-cols-2
              max-md:[&>footer>div>div:first-child]:gap-7
              max-md:[&>footer>div>div:first-child>div]:col-span-full"
          >
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