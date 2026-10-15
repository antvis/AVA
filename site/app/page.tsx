'use client';

import { Header, Footer } from '../components';
import { Banner } from '../components';
import DemoChat from '../ai/ui/demo/DemoChat';
import {
  AnalyticsPipeline,
  TrustedAnalytics,
  RealWorldData,
  Integrate,
  OpenSource,
  FinalCTA,
} from '../components/landing';
import PageShell from '../components/PageShell';

export default function Home() {
  return (
    <>
      {/* canvas + sheet — shared with other pages via PageShell */}
      <PageShell>
        <Header />

        {/* hero — was `.hero`: bordered plate with layered light-blue gradients */}
        <div
          className="relative mx-6 mb-16 rounded-[28px] border border-[#edf7fc] px-7 pb-[52px] pt-14
              bg-[radial-gradient(ellipse_at_85%_80%,#cceaf680,transparent_50%),linear-gradient(150deg,#eef8ff,#f8fcfe_55%,#edfaff)]
              [&>section]:mt-0
              [&>section>div[aria-hidden]]:hidden
              [&>section>div:last-child]:m-0 [&>section>div:last-child]:pb-0
              [&_.hero-rise_a]:rounded-[9px]
              [&>main]:mx-auto [&>main]:max-w-[1040px] [&>main]:pb-0
              max-md:[&>main]:mx-auto max-md:[&>main]:max-w-[1040px]
              max-md:[&_p]:text-[13px]
              max-md:[&_.hero-rise]:gap-2
              max-md:[&_h1>span:first-child]:whitespace-normal
              max-md:[&_h1>span:first-child>span:first-child]:mb-1
              max-md:[&_h1>span:first-child>span:first-child]:block
              max-md:[&_h1>span:first-child>span:last-child]:whitespace-nowrap
              max-md:mx-2.5 max-md:rounded-[18px] max-md:px-3.5 max-md:pb-6 max-md:pt-10
              max-md:[&_.hero-rise_a]:px-4 max-md:[&_.hero-rise_a]:text-xs"
        >
          <Banner />
          <DemoChat />
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
              bg-[radial-gradient(ellipse_at_12%_0%,color-mix(in_srgb,var(--color-primary)_26%,transparent),transparent_45%),
                radial-gradient(ellipse_at_90%_100%,color-mix(in_srgb,var(--color-primary-light)_45%,transparent),transparent_55%),
                linear-gradient(150deg,#f4fbfe,#f8fcfe_55%,#f2fafe)]
              [&>footer>div]:py-0 [&>footer>div]:pt-10 [&>footer>div]:pb-7
              max-md:[&>footer>div>div:first-child]:grid-cols-2
              max-md:[&>footer>div>div:first-child]:gap-7
              max-md:[&>footer>div>div:first-child>div]:col-span-full"
        >
          <FinalCTA />
          <Footer />
        </div>
      </PageShell>
    </>
  );
}
