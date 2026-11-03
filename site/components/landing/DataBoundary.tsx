'use client';

import { useTranslations } from 'use-intl';

import styles from './FeatureCards.module.css';

/** Local processing and a model connection with a visible boundary. */
export default function DataBoundary() {
  const t = useTranslations('DataBoundary');
  return (
    <svg className={styles.securityGraphic} viewBox="0 0 360 210" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="security-glass" x1="67" y1="37" x2="209" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" stopOpacity=".86" />
          <stop offset=".5" stopColor="#f4ffff" stopOpacity=".5" />
          <stop offset="1" stopColor="#b8dce0" stopOpacity=".38" />
        </linearGradient>
        <linearGradient id="security-data" x1="109" y1="83" x2="171" y2="125" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f4fdfc" />
          <stop offset=".5" stopColor="#d8edeb" />
          <stop offset="1" stopColor="#b1d2d4" />
        </linearGradient>
        <linearGradient id="security-base" x1="54" y1="166" x2="228" y2="184" gradientUnits="userSpaceOnUse">
          <stop stopColor="#e3f2f1" />
          <stop offset="1" stopColor="#a1c6cc" />
        </linearGradient>
        <filter id="security-shadow" x="-40%" y="-40%" width="180%" height="190%">
          <feDropShadow dx="0" dy="7" stdDeviation="5" floodColor="#54858f" floodOpacity=".13" />
        </filter>
      </defs>

      <ellipse cx="143" cy="186" rx="109" ry="12" fill="#7cabb2" opacity=".1" />
      <path d="m37 166 111 37 111-37M77 179l111-37M108 190l111-37" stroke="#fff" strokeOpacity=".55" />
      <text x="138" y="15" textAnchor="middle" fill="#75979f" fontSize="10.5">
        {t('yourEnvironment')}
      </text>

      <g filter="url(#security-shadow)">
        <rect
          x="76"
          y="25"
          width="158"
          height="139"
          rx="18"
          fill="#eefaf8"
          fillOpacity=".25"
          stroke="#fff"
          strokeOpacity=".72"
        />
        <path
          d="m216 43 13-13c3 3 5 8 5 13v103c0 8-2 14-7 19l-12 13 3-18V56Z"
          fill="#b2d4d8"
          fillOpacity=".5"
          stroke="#e9f8f8"
        />
        <path d="m73 38 13-12h129c6 0 11 2 14 5l-13 12-14-5Z" fill="#f8fffe" fillOpacity=".74" />
        <rect
          x="57"
          y="38"
          width="160"
          height="139"
          rx="18"
          fill="url(#security-glass)"
          stroke="#fff"
          strokeWidth="1.4"
        />
        <path d="M74 49h61M67 59v38" stroke="#fff" strokeOpacity=".8" strokeWidth="2" strokeLinecap="round" />
        <path d="M72 162h128" stroke="#fff" strokeOpacity=".5" />

        <g>
          <path d="M109 81v41c0 6.3 13.9 11.5 31 11.5s31-5.2 31-11.5V81Z" fill="url(#security-data)" stroke="#c3dfe0" />
          <path
            d="M109 96c0 6.3 13.9 11.5 31 11.5s31-5.2 31-11.5M109 109c0 6.3 13.9 11.5 31 11.5s31-5.2 31-11.5"
            stroke="#a9cccf"
            strokeOpacity=".8"
          />
          <ellipse cx="140" cy="81" rx="31" ry="11.5" fill="#f8fffe" stroke="#d0e7e7" />
          <ellipse cx="140" cy="79" rx="20" ry="6.5" fill="#e7f4f2" />
          <text x="140" y="102" textAnchor="middle" fill="#81a8ae" fontSize="8" letterSpacing="1.4">
            {t('dATA')}
          </text>
        </g>

        <rect x="81" y="146" width="90" height="18" rx="6" fill="#f5fdfb" fillOpacity=".9" stroke="#fff" />
        <circle cx="92" cy="155" r="2.5" fill="#89b5ae" />
        <text x="103" y="158" fill="#7ba0a4" fontSize="8.5">
          {t('localProcessing')}
        </text>
        <path
          d="M58 166c1 7 8 12 17 12h122c9 0 16-5 19-12v8c-3 7-10 11-19 11H75c-9 0-16-4-17-11Z"
          fill="url(#security-base)"
          stroke="#e6f6f3"
        />
      </g>

      <path d="M224 113h42" stroke="#fff" strokeWidth="2" strokeDasharray="3 4" />
      <circle cx="224" cy="113" r="4" fill="#90b9ba" stroke="#eefbf8" strokeWidth="2" />
      <path d="m261 109 5 4-5 4" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <text x="246" y="100" textAnchor="middle" fill="#83a4ab" fontSize="8.5">
        {t('aIContext')}
      </text>

      <g filter="url(#security-shadow)" transform="rotate(6 293 113)">
        <rect x="267" y="87" width="52" height="52" rx="14" fill="#f9fffe" stroke="#fff" />
        <circle cx="293" cy="113" r="13" fill="#eef8f7" stroke="#cce3e3" />
        <path d="m293 104 8 13h-16Z" stroke="#85aeb5" strokeWidth="1.2" strokeLinejoin="round" />
        <circle cx="293" cy="104" r="2.3" fill="#81abb3" />
        <circle cx="285" cy="117" r="2.3" fill="#a2c1c6" />
        <circle cx="301" cy="117" r="2.3" fill="#a2c1c6" />
      </g>
      <text x="293" y="157" textAnchor="middle" fill="#75979f" fontSize="10.5">
        {t('yourModel')}
      </text>
      <path d="m288 166 5 4 5-4" stroke="#9ab8bd" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />

      <g filter="url(#security-shadow)">
        <circle cx="200" cy="155" r="28" fill="#fbfffe" stroke="#d7ece9" />
        <circle cx="200" cy="155" r="24.5" stroke="#edf7f3" />
        <path
          d="m200 138 13 6v12c0 8-5 14-13 19-8-5-13-11-13-19v-12Z"
          fill="#eaf7f1"
          stroke="#83aaa7"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path d="m194 155 5 5 8-11" stroke="#6c9d98" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <path
        d="m42 94 6 3m-3-5v7M245 42l7 3m-3-6v8"
        stroke="#fff"
        strokeOpacity=".8"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}
