import { getTranslator, type Locale } from '../lib/i18n';
import Link from './LocaleLink';
import Header from './Header';
import Banner from './Banner';
import Footer from './Footer';
import PageShell from './PageShell';
import DemoChat from '../ai/ui/demo/DemoChat';
import Integrate from './landing/Integrate';
import FeatureCards from './landing/FeatureCards';
import Ecosystem from './landing/Ecosystem';
import TrustedAnalytics from './landing/TrustedAnalytics';
import styles from '../app/home.module.css';

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

export default function Home({ locale }: { locale: Locale }) {
  const t = getTranslator(locale, 'Home');

  return (
    <PageShell>
      <div className={styles.home}>
        <a className={styles.skipLink} href="#analytics">
          {t('skipToFeatures')}
        </a>
        <Header />
        <div className={styles.hero}>
          <div className={styles.heroIntro}>
            <Banner />
          </div>
          <div className={styles.demo} aria-label={t('interactiveDemoUsingSampleData')}>
            <DemoChat />
          </div>
          <aside className={styles.campaign} aria-labelledby="campaign-title">
            <span className={styles.campaignIcon} aria-hidden="true">
              🎟️
            </span>
            <div className={styles.campaignCopy}>
              <strong id="campaign-title">{t('campaignTitle')}</strong>
              <p>{t('campaignDescription')}</p>
            </div>
            <a
              href="https://github.com/antvis/AVA/issues/1035"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.campaignLink}
            >
              {t('campaignAction')}
              <Arrow />
            </a>
          </aside>
        </div>

        <section id="analytics" className={styles.features} aria-labelledby="features-title">
          <div className={styles.sectionHeading}>
            <h2 id="features-title">
              {t('fromRawDataTo')}
              <br />
              {t('answersYouCanInspect')}
            </h2>
          </div>
          <FeatureCards />
        </section>

        <section id="data" className={styles.dataSection} aria-labelledby="data-title">
          <div className={styles.dataCopy}>
            <h2 id="data-title">
              {t('connectYourData')}
              <br />
              {t('runAnywhere')}
            </h2>
            <Link href="/documentation/data/sources/" className={styles.textLink}>
              {t('allDataSources')}
              <Arrow />
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
                    <span>{logo === 'feishu-bitable' ? t('feishu') : label}</span>
                    {['csv', 'json'].includes(logo) && <small>{t('sourceDetail')}</small>}
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
              {t('howAVAWorks')}
              <br />
              {t('whatYouNeedToStart')}
            </h2>
          </div>
          <div className={styles.faqList}>
            {['what', 'start', 'sources', 'key', 'open'].map((key) => (
              <details key={key}>
                <summary>
                  {t(`${key}Question`)}
                  <span aria-hidden="true">+</span>
                </summary>
                <div>
                  {t.rich(`${key}Answer`, {
                    playground: (chunks) => <Link href="/ai/">{chunks}</Link>,
                    skill: (chunks) => <Link href="/documentation/agent-skill/">{chunks}</Link>,
                    sdk: (chunks) => <Link href="/documentation/quickstart/">{chunks}</Link>,
                  })}
                </div>
              </details>
            ))}
          </div>
        </section>
        <section className={styles.closing} aria-labelledby="closing-title">
          <h2 id="closing-title">
            {t('yourAgentSNextSkill')}
            <br />
            <span>{t('understandingYourData')}</span>
          </h2>
          <p>{t('connectAnalyzeAndVisualizeWithTheTools')}</p>
          <div className={styles.actions}>
            <Link href="/documentation/quickstart/" className={styles.primaryButton}>
              {t('getStarted')}
              <Arrow />
            </Link>
            <a
              href="https://github.com/antvis/AVA"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.secondaryButton}
            >
              {t('exploreGitHub')}
              <Arrow />
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
