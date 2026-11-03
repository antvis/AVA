'use client';

import { useTranslations } from 'use-intl';

import Link from '../LocaleLink';
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
  const t = useTranslations('FeatureCards');
  return (
    <div className={styles.grid}>
      <article className={styles.card}>
        <h3>
          {t('filesAndDatabases')}
          <br />
          {t('oneInterface')}
        </h3>
        <p>{t('aConsistentDataContextLetsYourAgent')}</p>
        <div
          className={`${styles.art} ${styles.sources}`}
          role="img"
          aria-label={t('cSVExcelPostgreSQLMongoDBAndClickHouseConnected')}
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
              AVA<span>{t('oneSourceInterface')}</span>
            </div>
          </div>
        </div>
        <CardLink href="/documentation/data/sources/">{t('exploreDataSources')}</CardLink>
      </article>

      <article className={styles.card}>
        <h3>
          {t('anAnswerWith')}
          <br />
          {t('anEvidenceTrail')}
        </h3>
        <p>{t('executedQueriesAndTheirResultsGiveEach')}</p>
        <div
          className={`${styles.art} ${styles.evidence}`}
          role="img"
          aria-label={t('illustrativeAnalysisChainLinkingASQLQuery')}
        >
          <div className={styles.queryCard} aria-hidden="true">
            <div>
              <span className={styles.smallDot} />
              {t('sourceLinkedQuery')}
              <span>SQL</span>
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
            <strong>{t('4Rows')}</strong>
            <span>{t('traceableResult')}</span>
          </div>
        </div>
        <CardLink href="/documentation/analysis/overview/">{t('exploreTrustedAnalysis')}</CardLink>
      </article>

      <article className={styles.card}>
        <h3>
          {t('theRightChart')}
          <br />
          {t('forYourQuestion')}
        </h3>
        <p>{t('theQuestionAndTheShapeOfThe')}</p>
        <div
          className={`${styles.art} ${styles.charts}`}
          role="img"
          aria-label={t('illustrativeChartRecommendationsForComparisonTrendsAnd')}
        >
          <div className={styles.chartTag} aria-hidden="true">
            ↗<span>{t('trend')}</span>
          </div>
          <div className={styles.chartPlate} aria-hidden="true">
            <div className={styles.chartPlateHeading}>
              <span className={styles.smallDot} />
              {t('revenueByRegion')}
              <span>{t('comparison')}</span>
            </div>
            <div className={styles.columns}>
              {[
                [t('east'), '82%'],
                [t('south'), '59%'],
                [t('north'), '53%'],
                [t('west'), '34%'],
              ].map(([name, height]) => (
                <div key={name}>
                  <i style={{ height }} />
                  <span>{name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <CardLink href="/documentation/visualization/overview/">{t('exploreIntelligentVisualization')}</CardLink>
      </article>

      <article className={styles.card}>
        <h3>
          {t('dataSecurity')}
          <br />
          {t('runAVALocally')}
        </h3>
        <p>{t('youControlWhereAnalysisRunsAndWhich')}</p>
        <div className={styles.art} role="img" aria-label={t('localDataProcessingInsideAControlledEnvironment')}>
          <DataBoundary />
        </div>
        <CardLink href="/documentation/engines/overview/">{t('exploreLocalEngines')}</CardLink>
      </article>

      <article className={styles.card}>
        <h3>
          {t('accuracyYou')}
          <br />
          {t('canInspect')}
        </h3>
        <p>{t('accuracyIsMeasuredAgainstReferenceAnswersUnder')}</p>
        <div
          className={`${styles.art} ${styles.evaluations}`}
          role="img"
          aria-label={t('publishedEvaluationCoverageDataBench1789QuestionsBIRD')}
        >
          <div className={styles.paperBack} aria-hidden="true" />
          <div className={styles.benchmarkSheet} aria-hidden="true">
            <div className={styles.sheetHeading}>
              <span className={styles.smallDot} />
              {t('publishedEvaluations')}
              <span>↗</span>
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
        <CardLink href="/documentation/reference/benchmarks/">{t('explorePublishedEvaluations')}</CardLink>
      </article>

      <article className={styles.card}>
        <h3>
          {t('readyForYourAgent')}
          <br />
          {t('builtToReuse')}
        </h3>
        <p>{t('yourAgentProvidesTheReasoningAVAExecutes')}</p>
        <div
          className={`${styles.art} ${styles.toolkit}`}
          role="img"
          aria-label={t('claudeAndCodexBuildingBlocksConnectTo')}
        >
          <AgentBlocks />
        </div>
        <CardLink href="#integrate">{t('getStartedWithAVA')}</CardLink>
      </article>
    </div>
  );
}
