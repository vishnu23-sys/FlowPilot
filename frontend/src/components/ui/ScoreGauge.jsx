export default function ScoreGauge({ score = 0 }) {
  const color = score >= 75 ? '#10b981' : score >= 55 ? '#f59e0b' : '#ef4444'

  return (
    <svg viewBox="0 0 140 82" className="w-44 h-28 mx-auto" aria-label={`Health score: ${score} out of 100`}>
      {/* Track */}
      <path
        d="M 14,72 A 56,56 0 0 1 126,72"
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth="11"
        strokeLinecap="round"
      />
      {/* Glow layer */}
      <path
        d="M 14,72 A 56,56 0 0 1 126,72"
        fill="none"
        stroke={color}
        strokeWidth="16"
        strokeLinecap="round"
        opacity="0.12"
        pathLength="1"
        strokeDasharray="1 1"
        strokeDashoffset={String(1 - score / 100)}
      />
      {/* Fill */}
      <path
        d="M 14,72 A 56,56 0 0 1 126,72"
        fill="none"
        stroke={color}
        strokeWidth="11"
        strokeLinecap="round"
        pathLength="1"
        strokeDasharray="1 1"
        strokeDashoffset={String(1 - score / 100)}
        style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.4s' }}
      />
      <text x="70" y="61" textAnchor="middle" fill="white" fontSize="26" fontWeight="700" fontFamily="system-ui, sans-serif">{score}</text>
      <text x="70" y="76" textAnchor="middle" fill="#475569" fontSize="9.5" fontFamily="system-ui, sans-serif">out of 100</text>
    </svg>
  )
}
