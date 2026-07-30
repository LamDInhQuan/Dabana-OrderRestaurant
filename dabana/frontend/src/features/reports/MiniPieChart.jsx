import { translateLabel } from '../../utils/labelTranslator'

const SLICE_COLORS = [
  'var(--gold)',
  'var(--brown-mid)',
  'var(--accent)',
  'var(--brown-light)',
  'var(--gold-dark)',
  '#3B82F6',
  '#10B981',
  '#8B5CF6',
]

const SIZE = 180
const RADIUS = 80
const CENTER = SIZE / 2

function toNumber(v) {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

function formatNumber(v) {
  return Number(v || 0).toLocaleString('vi-VN')
}

function polarToCartesian(angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: CENTER + RADIUS * Math.cos(angleRad),
    y: CENTER + RADIUS * Math.sin(angleRad),
  }
}

function describeSlice(startAngle, endAngle) {
  // Lát chiếm trọn 360° (chỉ 1 phần tử có value > 0): vẽ hình tròn đầy đủ.
  if (endAngle - startAngle >= 359.999) {
    return `M ${CENTER - RADIUS} ${CENTER} A ${RADIUS} ${RADIUS} 0 1 1 ${CENTER + RADIUS} ${CENTER} A ${RADIUS} ${RADIUS} 0 1 1 ${CENTER - RADIUS} ${CENTER} Z`
  }
  const start = polarToCartesian(endAngle)
  const end = polarToCartesian(startAngle)
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0
  return `M ${CENTER} ${CENTER} L ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`
}

/**
 * MiniPieChart — biểu đồ tròn đơn giản, tự vẽ bằng SVG (không thêm thư viện mới).
 * Props: { data: {label:string, value:number}[] }
 */
export default function MiniPieChart({ data = [] }) {
  const total = data.reduce((sum, d) => sum + toNumber(d.value), 0)

  if (!data || data.length === 0 || total <= 0) {
    return <p style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>Chưa có dữ liệu.</p>
  }

  let cumulativeAngle = 0
  const slices = data.map((d, i) => {
    const val = toNumber(d.value)
    const angle = (val / total) * 360
    const slice = {
      label: translateLabel(d.label),
      value: val,
      percent: (val / total) * 100,
      color: SLICE_COLORS[i % SLICE_COLORS.length],
      path: describeSlice(cumulativeAngle, cumulativeAngle + angle),
    }
    cumulativeAngle += angle
    return slice
  })

  return (
    <div className="flex items-center gap-4" style={{ flexWrap: 'wrap' }}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{ width: 160, height: 160, flexShrink: 0 }}
        role="img"
        aria-label="Biểu đồ tròn"
      >
        {slices.map((s) => (
          <path key={s.label} d={s.path} fill={s.color}>
            <title>{`${s.label}: ${formatNumber(s.value)} (${s.percent.toFixed(1)}%)`}</title>
          </path>
        ))}
      </svg>

      <div className="flex-col gap-2" style={{ display: 'flex' }}>
        {slices.map((s) => (
          <span key={s.label} className="flex items-center gap-2" style={{ fontSize: '.78rem' }}>
            <span style={{
              width: 10, height: 10, borderRadius: 2,
              background: s.color, display: 'inline-block', flexShrink: 0,
            }} />
            <span style={{ color: 'var(--text)' }}>{s.label}</span>
            <span style={{ color: 'var(--text-muted)' }}>
              {formatNumber(s.value)} ({s.percent.toFixed(1)}%)
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}