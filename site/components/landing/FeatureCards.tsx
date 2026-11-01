import Link from 'next/link';
import styles from './FeatureCards.module.css';
import AgentBlocks from './AgentBlocks';

function CardLink({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} className={styles.cardLink}>
      <span className="sr-only">{children}</span>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <path d="M5 19 19 5M5 5h14v14" />
      </svg>
    </Link>
  );
}

export default function FeatureCards() {
  return (
    <div className={styles.grid}>
      <article className={styles.card}>
        <h3>
          Files and databases.
          <br />
          One interface.
        </h3>
        <p>Files, databases, and SaaS — one source interface for your agent.</p>
        <div
          className={`${styles.art} ${styles.sources}`}
          role="img"
          aria-label="CSV, Excel, PostgreSQL, MongoDB, and ClickHouse connected through AVA"
        >
          <div className={styles.sourceConstellation} aria-hidden="true">
            <svg className={styles.connectors} viewBox="0 0 320 160" preserveAspectRatio="none">
              <path d="M32 80v32q0 18 18 18h110M90 32v72q0 26 26 26h44M160 16v114M230 32v72q0 26-26 26h-44M288 80v32q0 18-18 18H160" />
            </svg>
            {['csv', 'excel', 'postgresql', 'mongodb', 'clickhouse'].map((logo) => (
              <span key={logo} className={styles.sourceNode}>
                <img src={`/logos/${logo}.svg`} alt="" width="24" height="24" />
              </span>
            ))}
            <div className={styles.avaHub}>
              <i />
              AVA<span>One source interface</span>
            </div>
          </div>
        </div>
        <CardLink href="/documentation/data/sources/">Explore data sources</CardLink>
      </article>

      <article className={styles.card}>
        <h3>
          An answer with
          <br />
          an evidence trail.
        </h3>
        <p>Follow the executed query and results behind each answer.</p>
        <div
          className={`${styles.art} ${styles.evidence}`}
          role="img"
          aria-label="Illustrative analysis chain linking a SQL query to its result"
        >
          <div className={styles.queryCard} aria-hidden="true">
            <div>
              <span className={styles.smallDot} />
              Source-linked query<span>SQL</span>
            </div>
            <code>
              <b>SELECT</b> region, SUM(revenue)
              <br />
              <b>FROM</b> sales <b>GROUP BY</b> region;
            </code>
          </div>
          <span className={styles.evidenceWire} aria-hidden="true" />
          <div className={styles.resultCard} aria-hidden="true">
            <i>✓</i>
            <strong>4 rows</strong>
            <span>Traceable result</span>
          </div>
        </div>
        <CardLink href="/documentation/analysis/overview/">Explore trusted analysis</CardLink>
      </article>

      <article className={styles.card}>
        <h3>
          The right chart.
          <br />
          For your question.
        </h3>
        <p>Recommend charts from your question and data. Export the spec or HTML.</p>
        <div
          className={`${styles.art} ${styles.charts}`}
          role="img"
          aria-label="Illustrative chart recommendations for comparison, trends, and distributions"
        >
          <div className={styles.chartTag} aria-hidden="true">
            ↗<span>Trend</span>
          </div>
          <div className={styles.chartPlate} aria-hidden="true">
            <div className={styles.chartPlateHeading}>
              <span className={styles.smallDot} />
              Revenue by region<span>Comparison</span>
            </div>
            <div className={styles.columns}>
              {[
                ['East', '82%'],
                ['South', '59%'],
                ['North', '53%'],
                ['West', '34%'],
              ].map(([name, height]) => (
                <div key={name}>
                  <i style={{ height }} />
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <CardLink href="/documentation/visualization/overview/">Explore intelligent visualization</CardLink>
      </article>

      <article className={styles.card}>
        <h3>
          Data Security.
          <br />
          Run AVA Locally.
        </h3>
        <p>Process data locally. Choose the model endpoint for AI features.</p>
        <div
          className={`${styles.art} ${styles.local}`}
          role="img"
          aria-label="DuckDB and Python execute locally, with AI features using your chosen model endpoint"
        >
          <div className={styles.localBoundary} aria-hidden="true">
            <span className={styles.boundaryLabel}>Local data processing</span>
            <div className={styles.shield}>
              <svg width="29" height="32" viewBox="0 0 32 36" fill="none">
                <path
                  d="m16 3 11 4v10c0 7-5 12-11 16C10 29 5 24 5 17V7l11-4Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="m11 17 4 4 7-8"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className={styles.localConnector} />
            <div className={styles.engineNodes}>
              <span>
                <i />
                DuckDB
              </span>
              <span>
                <i />
                Python
              </span>
            </div>
          </div>
          <div className={styles.endpoint} aria-hidden="true">
            AI context <span>↔</span> Your model endpoint
          </div>
        </div>
        <CardLink href="/documentation/engines/overview/">Explore local engines</CardLink>
      </article>

      <article className={styles.card}>
        <h3>
          Accuracy you
          <br />
          can inspect.
        </h3>
        <p>Inspect published evaluations, including models, datasets, and scoring.</p>
        <div
          className={`${styles.art} ${styles.evaluations}`}
          role="img"
          aria-label="Published evaluation coverage: DataBench 1789 questions, BIRD New Dev 1534, Spider2-Lite SQLite 135"
        >
          <div className={styles.paperBack} aria-hidden="true" />
          <div className={styles.benchmarkSheet} aria-hidden="true">
            <div className={styles.sheetHeading}>
              <span className={styles.smallDot} />
              Published evaluations<span>↗</span>
            </div>
            {[
              ['DataBench', '1,789', '100%'],
              ['BIRD New Dev', '1,534', '86%'],
              ['Spider2-Lite · SQLite', '135', '8%'],
            ].map(([name, count, width]) => (
              <div className={styles.benchmarkRow} key={name}>
                <span>{name}</span>
                <strong>{count}</strong>
                <i style={{ width }} />
              </div>
            ))}
          </div>
        </div>
        <CardLink href="/documentation/reference/benchmarks/">Explore published evaluations</CardLink>
      </article>

      <article className={styles.card}>
        <h3>
          Ready for your agent.
          <br />
          Built to reuse.
        </h3>
        <p>Use an Agent Skill, the command line, or the TypeScript SDK.</p>
        <div
          className={`${styles.art} ${styles.toolkit}`}
          role="img"
          aria-label="Modular building blocks connect your agent to AVA Skill and data visualization"
        >
          <AgentBlocks />
        </div>
        <CardLink href="#integrate">Get started with AVA</CardLink>
      </article>
    </div>
  );
}
