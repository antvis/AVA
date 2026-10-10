'use client';

import React from 'react';

/**
 * Shared page shell extracted from the landing page.
 * Provides the same `canvas` / `sheet` wrapper styling so every page
 * (home, documentation, ...) renders the Header the same way.
 */
const PageShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen font-sans text-[#24212d] [--font-heading:'DM Sans',sans-serif]">
    <div
      className="w-full bg-white
        [&_[id]]:scroll-mt-[110px]
        [&_:is(a,button,textarea)]:focus-visible:outline-2
        [&_:is(a,button,textarea)]:focus-visible:outline-offset-4
        [&_:is(a,button,textarea)]:focus-visible:outline-[color:var(--color-primary-dark)]
        motion-reduce:[&_*]:transition-none
        [&>header>div]:h-[84px] [&>header>div]:px-10
        [&>header_a:hover]:text-[color:var(--color-primary-dark)]
        [&>header_button]:rounded-[9px] [&>header_button]:bg-[#24212d] [&>header_button]:text-white
        [&>header_button:hover]:bg-[color:var(--color-primary-dark)] [&>header_button:hover]:text-white
        max-md:[&>header>div]:h-[70px] max-md:[&>header>div]:px-[18px]"
    >
      {children}
    </div>
  </div>
);

export default PageShell;