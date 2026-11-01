import Link from 'next/link';
import styles from './FeatureCards.module.css';
import AgentBlocks from './AgentBlocks';
import DataBoundary from './DataBoundary';

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
        <p>A consistent data context lets your agent reason across different sources.</p>
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
        <p>Executed queries and their results give each answer a checkable basis.</p>
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
        <p>The question and the shape of the data guide the chart choice.</p>
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
        <p>You control where analysis runs and which model endpoint it uses.</p>
        <div
          className={styles.art}
          role="img"
          aria-label="Local data processing inside a controlled environment, with a separate connection to your chosen model endpoint"
        >
          <DataBoundary />
        </div>
        <CardLink href="/documentation/engines/overview/">Explore local engines</CardLink>
      </article>

      <article className={styles.card}>
        <h3>
          Accuracy you
          <br />
          can inspect.
        </h3>
        <p>Accuracy is measured against reference answers under published test conditions.</p>
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
        <p>Your agent provides the reasoning; AVA executes the data workflow.</p>
        <div
          className={`${styles.art} ${styles.toolkit}`}
          role="img"
          aria-label="Claude and Codex building blocks connect to a central AVA Skill block"
        >
          <AgentBlocks />
        </div>
        <CardLink href="#integrate">Get started with AVA</CardLink>
      </article>
    </div>
  );
}
