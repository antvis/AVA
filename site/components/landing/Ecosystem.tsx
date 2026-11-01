'use client';

import { useEffect, useRef } from 'react';
import { SectionHeading, SectionLink } from './Section';
import styles from './Ecosystem.module.css';

const DISCUSSION = 'https://github.com/antvis/AVA/issues/1035';

// Project descriptions and status come from the ecosystem discussion.
const PROJECTS = [
  {
    name: 'AVA Notebook',
    category: 'Analysis workspace',
    description: 'Revisit the SQL, results, and evidence behind your analysis in an editable notebook.',
    status: 'In development',
    href: 'https://github.com/yvonneyx/ava-notebook',
    repository: 'yvonneyx/ava-notebook',
    image: '/ecosystem/notebook.png',
    kind: 'notebook',
  },
  {
    name: 'DeepSeek Harness',
    category: 'dsh-antv-ava',
    description: 'Bring AVA v4 queries, streaming narratives, and AntV charts into DSH conversations.',
    status: 'Community integration',
    href: 'https://github.com/HellowVirgil/dsh-antv-ava',
    repository: 'HellowVirgil/dsh-antv-ava',
    image: '/ecosystem/deepseek-harness.png',
    kind: 'dsh',
  },
  {
    name: 'DuckDB-Wasm',
    category: 'Browser engine',
    description: 'Run SQL on CSV data in a browser worker, then analyze and visualize with AVA.',
    status: 'Community extension',
    href: 'https://github.com/yvonneyx/ava-engine-duckdb-wasm',
    repository: 'yvonneyx/ava-engine-duckdb-wasm',
    kind: 'sql',
  },
  {
    name: 'ava-observability',
    category: 'Tracing & diagnostics',
    description: 'Trace analysis steps, timings, and SQL attempts through AVA’s public events.',
    status: 'Community extension',
    href: 'https://github.com/lyw405/ava-observability',
    repository: 'lyw405/ava-observability',
    kind: 'tracing',
  },
  {
    name: 'AVA Agent Skill',
    category: 'Agent workflow',
    description: 'Explore data and generate charts directly from the AI agent you already use.',
    status: 'Agent Skill',
    href: 'https://github.com/antvis/AVA',
    repository: 'antvis/AVA',
    image: '/ecosystem/agent-skill.png',
    kind: 'skill',
  },
  {
    name: 'AI Dou',
    category: 'Game analytics',
    description: 'Review AI card games through match data, analysis, and visual recaps.',
    status: 'In development',
    href: 'https://github.com/Keikeikm/ai-dou',
    repository: 'Keikeikm/ai-dou',
    image: '/ecosystem/ai-dou.png',
    kind: 'game',
  },
  {
    name: 'AVA Feishu Bot',
    category: 'Feishu integration',
    description: 'A proposed chat bot for querying files and returning answers and charts in Feishu.',
    status: 'Planned',
    href: `${DISCUSSION}#issuecomment-6342091466`,
    repository: 'antvis/AVA #1035',
    kind: 'feishu-bot',
  },
  {
    name: 'AVA Feishu Plugin',
    category: 'Feishu integration',
    description: 'A proposed Bitable plugin for analyzing and visualizing data inside Feishu.',
    status: 'Planned',
    href: `${DISCUSSION}#issuecomment-6342091466`,
    repository: 'antvis/AVA #1035',
    kind: 'feishu-plugin',
  },
];

function ProjectVisual({ kind }: { kind: string }) {
  if (kind === 'sql') {
    return (
      <div className={styles.sqlVisual} aria-hidden="true">
        <div>
          <span>● ● ●</span>
          <strong>Browser worker</strong>
        </div>
        <code>
          <span>SELECT</span> region, SUM(sales)
          <br />
          <span>FROM</span> data <span>GROUP BY</span> region;
        </code>
        <p>
          CSV <i>→</i> DuckDB-Wasm <i>→</i> Chart
        </p>
      </div>
    );
  }
  if (kind === 'tracing') {
    return (
      <div className={styles.traceVisual} aria-hidden="true">
        <strong>One run. Every step.</strong>
        {['analyze', 'translate', 'query', 'summarize'].map((step, i) => (
          <div key={step}>
            <span>{step}</span>
            <i style={{ marginLeft: `${i * 10}px`, width: `${72 - i * 14}%` }} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={styles.feishuVisual} aria-hidden="true">
      <img src="/logos/feishu-bitable.svg" alt="" width="32" height="32" />
      <strong>{kind === 'feishu-bot' ? 'Ask in your conversation.' : 'Analyze in your Bitable.'}</strong>
      <div>
        <span>Feishu</span>
        <i>↔</i>
        <span>AVA</span>
      </div>
      <small>Integration proposal</small>
    </div>
  );
}

function ProjectCard({
  project,
  index,
  duplicate = false,
}: {
  project: (typeof PROJECTS)[number];
  index: number;
  duplicate?: boolean;
}) {
  return (
    <article
      className={styles.card}
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${PROJECTS.length}: ${project.name}`}
    >
      <div className={styles.visual}>
        {'image' in project ? (
          <img src={project.image} alt={`${project.name} project screenshot`} width="640" height="360" loading="lazy" />
        ) : (
          <ProjectVisual kind={project.kind} />
        )}
      </div>
      <div className={styles.cardBody}>
        <span className={styles.category}>{project.category}</span>
        <h3>{project.name}</h3>
        <p>{project.description}</p>
        <div className={styles.cardFooter}>
          <span className={styles.status} data-planned={project.status === 'Planned'}>
            {project.status}
          </span>
          <a
            href={project.href}
            tabIndex={duplicate ? -1 : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${project.status === 'Planned' ? 'GitHub proposal' : 'GitHub repository'}: ${
              project.repository
            }`}
            title={project.repository}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.13.68-3.79-1.33-3.79-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.63 1.22 3.27.93.1-.73.4-1.22.72-1.5-2.5-.28-5.13-1.25-5.13-5.56 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.43.11-2.98 0 0 .95-.3 3.1 1.15a10.8 10.8 0 0 1 5.64 0c2.15-1.46 3.09-1.15 3.09-1.15.61 1.55.23 2.7.11 2.98a4.35 4.35 0 0 1 1.16 3.02c0 4.33-2.64 5.27-5.15 5.55.4.35.76 1.03.76 2.08v3.11c0 .3.2.65.77.54A11.25 11.25 0 0 0 12 .75Z" />
            </svg>
            <span className={styles.repository}>{project.repository}</span>
            <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </article>
  );
}

export default function Ecosystem() {
  const trackRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const interactingRef = useRef(false);

  useEffect(() => {
    const track = trackRef.current;
    const group = groupRef.current;
    if (!track || !group) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let last = 0;
    let frame: number;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(track);

    function scroll(now: number) {
      const elapsed = last ? Math.min(now - last, 64) : 0;
      last = now;
      if (
        visible &&
        !document.hidden &&
        !reducedMotion.matches &&
        !interactingRef.current &&
        !track!.matches(':focus-visible') &&
        !track!.querySelector(':focus-visible')
      ) {
        const width = group!.offsetWidth;
        const next = track!.scrollLeft + elapsed * 0.032;
        // The second group continues the same sequence across the loop boundary.
        if (width) track!.scrollLeft = next >= width ? next - width : next;
      }
      frame = requestAnimationFrame(scroll);
    }
    frame = requestAnimationFrame(scroll);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <section
      id="ecosystem"
      className={styles.section}
      aria-labelledby="ecosystem-title"
      aria-roledescription="carousel"
    >
      <div className={styles.heading}>
        <SectionHeading
          title={
            <span id="ecosystem-title">
              See What Others
              <br />
              Build with AVA.
            </span>
          }
          description="Projects, extensions, and ideas from the AVA community."
          align="left"
        />
        <span className={styles.projectCount}>{PROJECTS.length} projects & integrations</span>
      </div>
      <div
        id="ecosystem-projects"
        ref={trackRef}
        className={styles.track}
        tabIndex={0}
        aria-label="Ecosystem projects"
        onPointerEnter={(event) => {
          if (event.pointerType === 'mouse') interactingRef.current = true;
        }}
        onPointerLeave={(event) => {
          if (event.pointerType === 'mouse') interactingRef.current = false;
        }}
        onTouchStart={() => {
          interactingRef.current = true;
        }}
        onTouchEnd={() => {
          interactingRef.current = false;
        }}
        onTouchCancel={() => {
          interactingRef.current = false;
        }}
      >
        <div className={styles.belt}>
          <div className={styles.group} ref={groupRef}>
            {PROJECTS.map((project, index) => (
              <ProjectCard key={project.name} project={project} index={index} />
            ))}
          </div>
          <div className={styles.group} aria-hidden="true">
            {PROJECTS.map((project, index) => (
              <ProjectCard key={project.name} project={project} index={index} duplicate />
            ))}
          </div>
        </div>
      </div>
      <div className={styles.footer}>
        <span>Built something with AVA?</span>
        <SectionLink href={DISCUSSION} external>
          Share your project
        </SectionLink>
      </div>
    </section>
  );
}
