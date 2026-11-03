import styles from './FeatureCards.module.css';

/** Agent marks sourced from https://github.com/lobehub/lobe-icons. */
export default function AgentBlocks() {
  return (
    <svg className={styles.agentBlocks} viewBox="0 0 360 210" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="toolkit-white-top" x1="50" y1="30" x2="130" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff" />
          <stop offset="1" stopColor="#edf4fc" />
        </linearGradient>
        <linearGradient id="toolkit-blue-top" x1="180" y1="58" x2="180" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#bed8fc" />
          <stop offset="1" stopColor="#8bb9ef" />
        </linearGradient>
        <linearGradient id="toolkit-blue-front" x1="100" y1="110" x2="185" y2="180" gradientUnits="userSpaceOnUse">
          <stop stopColor="#87b2e5" />
          <stop offset="1" stopColor="#6998d3" />
        </linearGradient>
        <filter id="toolkit-block-shadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="7" stdDeviation="5" floodColor="#5e80b6" floodOpacity=".13" />
        </filter>
        <g id="toolkit-blue-stud">
          <ellipse cy="6" rx="12" ry="6.5" fill="#7da8df" />
          <path d="M-12 0v6c0 3.6 5.4 6.5 12 6.5S12 9.6 12 6V0" fill="#8db7ed" />
          <ellipse rx="12" ry="6.5" fill="#c7defa" stroke="#d6e8ff" />
        </g>
      </defs>

      <ellipse cx="182" cy="183" rx="123" ry="13" fill="#7a9dc8" opacity=".09" />
      <path d="m34 133 146 83 146-83M68 152l146-83M146 196l146-83" stroke="#fff" strokeOpacity=".45" />
      <g filter="url(#toolkit-block-shadow)">
        <path d="m30 56 50 28v28L30 84Z" fill="#edf3fc" stroke="#fff" strokeLinejoin="round" />
        <path d="m80 84 50-28v28l-50 28Z" fill="#dce8f8" stroke="#f8fbff" strokeLinejoin="round" />
        <path d="m30 56 50-28 50 28-50 28Z" fill="url(#toolkit-white-top)" stroke="#fff" strokeLinejoin="round" />
        <image href="/agents/claude.svg" x="66" y="41" width="28" height="28" />
        <text x="43" y="81" transform="rotate(29 43 81)" fill="#7c98b9" fontSize="11" fontWeight="500">
          Claude
        </text>
      </g>

      <g filter="url(#toolkit-block-shadow)">
        <path d="m230 60 50 28v28l-50-28Z" fill="#eff5fc" stroke="#fff" strokeLinejoin="round" />
        <path d="m280 88 50-28v28l-50 28Z" fill="#dce9f8" stroke="#f8fbff" strokeLinejoin="round" />
        <path d="m230 60 50-28 50 28-50 28Z" fill="#f9fcff" stroke="#fff" strokeLinejoin="round" />
        <image href="/agents/codex.svg" x="266" y="45" width="28" height="28" />
        <text x="242" y="85" transform="rotate(29 242 85)" fill="#7c98b9" fontSize="11" fontWeight="500">
          Codex
        </text>
      </g>

      <g filter="url(#toolkit-block-shadow)">
        <path d="m100 104 80 46v32l-80-46Z" fill="url(#toolkit-blue-front)" stroke="#a5c8f1" strokeLinejoin="round" />
        <path d="m180 150 80-46v32l-80 46Z" fill="#598bc8" stroke="#8eb5e4" strokeLinejoin="round" />
        <path d="m100 104 80-46 80 46-80 46Z" fill="url(#toolkit-blue-top)" stroke="#d9eaff" strokeLinejoin="round" />
        <use href="#toolkit-blue-stud" transform="translate(180 78)" />
        <use href="#toolkit-blue-stud" transform="translate(145 98)" />
        <use href="#toolkit-blue-stud" transform="translate(215 98)" />
        <use href="#toolkit-blue-stud" transform="translate(180 118)" />
        <text
          x="121"
          y="137"
          transform="rotate(29 121 137)"
          fill="#fff"
          fontSize="17"
          fontWeight="600"
          letterSpacing=".5"
        >
          AVA
        </text>
        <text x="210" y="153" transform="rotate(-29 210 153)" fill="#f2f7ff" fontSize="12" fontWeight="500">
          Skill
        </text>
      </g>
      <path
        d="m92 178 10 6m-5-8v10M275 141l8 4m-4-6v8"
        stroke="#fff"
        strokeOpacity=".8"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
