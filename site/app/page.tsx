import Link from 'next/link';
import Header from '../components/Header';
import Banner from '../components/Banner';
import Footer from '../components/Footer';
import PageShell from '../components/PageShell';
import DemoChat from '../ai/ui/demo/DemoChat';
import Integrate from '../components/landing/Integrate';
import FeatureCards from '../components/landing/FeatureCards';
import Ecosystem from '../components/landing/Ecosystem';
import TrustedAnalytics from '../components/landing/TrustedAnalytics';
import styles from './home.module.css';

const SOURCES = [
  ['CSV', 'csv', 'Inline & file'],
  ['JSON', 'json', 'Inline & file'],
  ['Excel', 'excel', 'Workbook'],
  ['Parquet', 'parquet', 'Columnar file'],
  ['Text', 'text', 'Unstructured text'],
  ['SQLite', 'sqlite', 'Local database'],
  ['MySQL', 'mysql', 'SQL database'],
  ['PostgreSQL', 'postgresql', 'SQL database'],
  ['MongoDB', 'mongodb', 'Document database'],
  ['Supabase', 'supabase', 'Cloud database'],
  ['ClickHouse', 'clickhouse', 'Analytics database'],
  ['Feishu Bitable', 'feishu-bitable', 'Multidimensional table'],
];

const FAQS = [
  {
    question: 'What is AVA?',
    answer:
      'AVA is an open-source visual analytics framework from AntV. It gives AI agents the tools to connect to data, understand its structure, run analysis, and turn results into charts.',
  },
  {
    question: 'How can I get started?',
    answer: (
      <>
        Try the <Link href="/ai/">AI playground</Link>, add the{' '}
        <Link href="/documentation/agent-skill/">Agent Skill</Link> to your agent, or follow the{' '}
        <Link href="/documentation/quickstart/">TypeScript SDK quickstart</Link>. You can also use AVA from the command
        line.
      </>
    ),
  },
  {
    question: 'Which data sources can I use?',
    answer:
      'AVA supports CSV, JSON, Excel, Parquet, and text, plus SQLite, MySQL, PostgreSQL, MongoDB, Supabase, ClickHouse, and Feishu Bitable. Available sources and engines depend on your runtime.',
  },
  {
    question: 'Do I need a separate model API key?',
    answer:
      'The Agent Skill uses your agent’s own reasoning, so it does not need a separate model key. AI-powered analysis through the SDK or CLI requires your model configuration. Direct queries and data profiling can run without an LLM.',
  },
  {
    question: 'Is AVA free and open source?',
    answer:
      'Yes. AVA is released under the MIT License. You can inspect the source, build with it, and contribute on GitHub. Model providers and hosted infrastructure may have their own costs.',
  },
];

function Arrow() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden="true"
    >
      <path d="M5 12h14m-6-6 6 6-6 6" />
    </svg>
  );
}

export default function Home() {
  return (
    <PageShell>
      <div className={styles.home}>
        <a className={styles.skipLink} href="#analytics">
          Skip to features
        </a>
        <Header />
        <div className={styles.hero}>
          <div className={styles.heroIntro}>
            <Banner />
          </div>
          <div className={styles.demo} aria-label="Interactive demo using sample data">
            <DemoChat />
          </div>
        </div>

        <section id="analytics" className={styles.features} aria-labelledby="features-title">
          <div className={styles.sectionHeading}>
            <h2 id="features-title">
              From Raw Data to
              <br />
              Answers You Can Inspect.
            </h2>
          </div>
          <FeatureCards />
        </section>

        <section id="data" className={styles.dataSection} aria-labelledby="data-title">
          <div className={styles.dataCopy}>
            <h2 id="data-title">
              Connect Your Data.
              <br />
              Run Anywhere.
            </h2>
            <div className={styles.sourceCategories}>
              <span>Files</span>
              <span>Databases</span>
              <span>SaaS</span>
            </div>
            <Link href="/documentation/data/sources/" className={styles.textLink}>
              All data sources <Arrow />
            </Link>
          </div>
          <div className={styles.sourcePanel}>
            <div className={styles.sourceWindow}>
              <div className={styles.sourceGrid}>
                {SOURCES.map(([label, logo, detail]) => (
                  <Link key={label} href={`/documentation/data/sources/#${logo}`}>
                    <span className={styles.sourceIcon}>
                      <img src={`/logos/${logo}.svg`} alt="" width="32" height="32" loading="lazy" />
                    </span>
                    <span>{label}</span>
                    {['csv', 'json'].includes(logo) && <small>{detail}</small>}
                  </Link>
                ))}
              </div>
              <div className={styles.sourceHub} aria-hidden="true">
                <span />
                <div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 5v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5M12 12v7" />
                    <circle cx="5" cy="4" r="2" />
                    <circle cx="19" cy="4" r="2" />
                    <circle cx="12" cy="21" r="2" />
                  </svg>
                  AVA
                </div>
                <span />
              </div>
            </div>
          </div>
        </section>

        <div className={styles.benchmarks}>
          <TrustedAnalytics />
        </div>
        <div className={styles.integration}>
          <Integrate />
        </div>

        <div className={styles.ecosystem}>
          <Ecosystem />
        </div>

        <section className={styles.faq} aria-labelledby="faq-title">
          <div className={styles.sectionHeading}>
            <h2 id="faq-title">
              How AVA Works.
              <br />
              What You Need to Start.
            </h2>
          </div>
          <div className={styles.faqList}>
            {FAQS.map(({ question, answer }) => (
              <details key={question}>
                <summary>
                  {question}
                  <span aria-hidden="true">+</span>
                </summary>
                <div>{answer}</div>
              </details>
            ))}
          </div>
        </section>
        <section className={styles.closing} aria-labelledby="closing-title">
          <h2 id="closing-title">
            Your agent’s next skill?
            <br />
            <span>Understanding your data.</span>
          </h2>
          <p>Connect, analyze, and visualize — with the tools your agent needs.</p>
          <div className={styles.actions}>
            <Link href="/documentation/quickstart/" className={styles.primaryButton}>
              Get Started <Arrow />
            </Link>
            <a
              href="https://github.com/antvis/AVA"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.secondaryButton}
            >
              Explore GitHub <Arrow />
            </a>
          </div>
          <div className={styles.closingSignature} aria-hidden="true">
            a<span>v</span>a.
          </div>
        </section>
        <Footer />
      </div>
    </PageShell>
  );
}
