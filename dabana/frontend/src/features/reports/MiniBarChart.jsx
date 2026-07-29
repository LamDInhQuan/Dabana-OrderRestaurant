// Bảng màu dùng chung cho các series/cột — bám theo design token của app (xem styles/global.css)
const SERIES_COLORS = [
  'var(--gold)',
  'var(--brown-mid)',
  'var(--accent)',
  'var(--brown-light)',
  'var(--gold-dark)',
  '#3B82F6',
]

const CHART_HEIGHT = 200
const CHART_WIDTH = 560
const PADDING_LEFT = 8
const PADDING_RIGHT = 8
const PADDING_TOP = 16
const PADDING_BOTTOM = 34

function toNumber(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function formatNumber(v) {
  return Number(v || 0).toLocaleString('vi-VN')
}

/**
 * MiniBarChart — biểu đồ cột đơn giản, tự vẽ bằng SVG (không thêm thư viện mới).
 * Props: { data: {label:string, value:number, series?:Record<string,number>}[], colorBy?: 'series'|'single' }
 * - colorBy = 'series' (mặc định khi data có `series`): vẽ cột stacked, mỗi series 1 màu, kèm legend.
 * - colorBy = 'single': vẽ cột đơn theo `value`, tất cả cùng 1 màu.
 */
export default function MiniBarChart({ data = [], colorBy }) {
  const hasSeries = data.some((d) => d.series && Object.keys(d.series).length > 0)
  const mode = colorBy || (hasSeries ? 'series' : 'single')

  const seriesKeys = mode === 'series'
    ? Array.from(data.reduce((set, d) => {
        Object.keys(d.series || {}).forEach((k) => set.add(k))
        return set
      }, new Set()))
    : []

  if (!data || data.length === 0) {
    return <p style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>Chưa có dữ liệu.</p>
  }

  const totals = data.map((d) =>
    mode === 'series'
      ? seriesKeys.reduce((sum, k) => sum + toNumber(d.series?.[k]), 0)
      : toNumber(d.value)
  )
  const maxValue = Math.max(...totals, 1)

  const plotWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM
  const slotWidth = plotWidth / data.length
  const barWidth = Math.min(slotWidth * 0.55, 48)

  return (
    <div>
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        role="img"
        aria-label="Biểu đồ cột"
      >
        {/* trục ngang */}
        <line
          x1={PADDING_LEFT}
          y1={CHART_HEIGHT - PADDING_BOTTOM}
          x2={CHART_WIDTH - PADDING_RIGHT}
          y2={CHART_HEIGHT - PADDING_BOTTOM}
          stroke="var(--border)"
          strokeWidth="1"
        />

        {data.map((d, i) => {
          const slotX = PADDING_LEFT + i * slotWidth
          const barX = slotX + (slotWidth - barWidth) / 2

          if (mode === 'series') {
            let stackedFromBottom = 0
            return (
              <g key={d.label ?? i}>
                {seriesKeys.map((key, si) => {
                  const val = toNumber(d.series?.[key])
                  const segH = maxValue > 0 ? (val / maxValue) * plotHeight : 0
                  const y = CHART_HEIGHT - PADDING_BOTTOM - stackedFromBottom - segH
                  stackedFromBottom += segH
                  return (
                    <rect
                      key={key}
                      x={barX}
                      y={y}
                      width={barWidth}
                      height={segH}
                      fill={SERIES_COLORS[si % SERIES_COLORS.length]}
                      rx="2"
                    >
                      <title>{`${key}: ${formatNumber(val)}`}</title>
                    </rect>
                  )
                })}
                <text
                  x={slotX + slotWidth / 2}
                  y={CHART_HEIGHT - PADDING_BOTTOM + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--text-muted)"
                >
                  {d.label}
                </text>
              </g>
            )
          }

          const val = toNumber(d.value)
          const barH = maxValue > 0 ? (val / maxValue) * plotHeight : 0
          const y = CHART_HEIGHT - PADDING_BOTTOM - barH
          return (
            <g key={d.label ?? i}>
              <rect
                x={barX}
                y={y}
                width={barWidth}
                height={barH}
                fill="var(--gold)"
                rx="2"
              >
                <title>{`${d.label}: ${formatNumber(val)}`}</title>
              </rect>
              <text
                x={slotX + slotWidth / 2}
                y={CHART_HEIGHT - PADDING_BOTTOM + 16}
                textAnchor="middle"
                fontSize="10"
                fill="var(--text-muted)"
              >
                {d.label}
              </text>
            </g>
          )
        })}
      </svg>

      {mode === 'series' && seriesKeys.length > 0 && (
        <div className="flex items-center gap-3" style={{ flexWrap: 'wrap', marginTop: '.5rem' }}>
          {seriesKeys.map((key, si) => (
            <span key={key} className="flex items-center gap-2" style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
              <span style={{
                width: 10, height: 10, borderRadius: 2,
                background: SERIES_COLORS[si % SERIES_COLORS.length], display: 'inline-block',
              }} />
              {key}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}