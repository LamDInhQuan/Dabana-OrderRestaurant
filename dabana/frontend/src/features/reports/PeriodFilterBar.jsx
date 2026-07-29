const PERIOD_OPTIONS = [
  { value: 'DAY', label: 'Ngày' },
  { value: 'MONTH', label: 'Tháng' },
  { value: 'QUARTER', label: 'Quý' },
  { value: 'YEAR', label: 'Năm' },
  { value: 'CUSTOM', label: 'Tuỳ chọn' },
]

const inputStyle = { width: 'auto', minWidth: '7rem' }
const fieldWrapStyle = { display: 'flex', flexDirection: 'column', gap: '.3rem' }
const labelStyle = { fontSize: '.75rem', color: 'var(--text-muted)', fontWeight: 600 }

function toMonthInputValue(year, month) {
  if (!year || !month) return ''
  return `${year}-${String(month).padStart(2, '0')}`
}

function toDateInputValue(date) {
  if (!date) return ''
  // date có thể là Date object hoặc chuỗi 'YYYY-MM-DD'
  if (typeof date === 'string') return date
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Props: { state: ReturnType<usePeriodState>, onApply?: () => void }
 * Render dropdown chọn chu kỳ (Ngày/Tháng/Quý/Năm/Tuỳ chọn), DatePicker tương ứng
 * (bằng input HTML thuần, không thêm thư viện mới) và checkbox "So sánh kỳ trước".
 */
export default function PeriodFilterBar({ state, onApply }) {
  const {
    period, setPeriod,
    date, setDate,
    month, setMonth,
    quarter, setQuarter,
    year, setYear,
    from, setFrom,
    to, setTo,
    compareWithPrevious, setCompareWithPrevious,
  } = state

  const currentYear = new Date().getFullYear()
  const yearOptions = []
  for (let y = currentYear + 1; y >= currentYear - 5; y--) yearOptions.push(y)

  function handlePeriodChange(e) {
    setPeriod(e.target.value)
  }

  function handleApply() {
    if (onApply) onApply()
  }

  return (
    <div
      className="card flex items-center gap-4"
      style={{ flexWrap: 'wrap', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}
    >
      <div style={fieldWrapStyle}>
        <span style={labelStyle}>Chu kỳ</span>
        <select value={period} onChange={handlePeriodChange} style={inputStyle}>
          {PERIOD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {period === 'DAY' && (
        <div style={fieldWrapStyle}>
          <span style={labelStyle}>Chọn ngày</span>
          <input
            type="date"
            style={inputStyle}
            value={toDateInputValue(date)}
            onChange={(e) => setDate(e.target.value || null)}
          />
        </div>
      )}

      {period === 'MONTH' && (
        <div style={fieldWrapStyle}>
          <span style={labelStyle}>Chọn tháng</span>
          <input
            type="month"
            style={inputStyle}
            value={toMonthInputValue(year, month)}
            onChange={(e) => {
              const v = e.target.value // 'YYYY-MM'
              if (!v) return
              const [y, m] = v.split('-').map(Number)
              setYear(y)
              setMonth(m)
            }}
          />
        </div>
      )}

      {period === 'QUARTER' && (
        <>
          <div style={fieldWrapStyle}>
            <span style={labelStyle}>Quý</span>
            <select
              style={inputStyle}
              value={quarter}
              onChange={(e) => setQuarter(Number(e.target.value))}
            >
              {[1, 2, 3, 4].map((q) => (
                <option key={q} value={q}>Quý {q}</option>
              ))}
            </select>
          </div>
          <div style={fieldWrapStyle}>
            <span style={labelStyle}>Năm</span>
            <select
              style={inputStyle}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </>
      )}

      {period === 'YEAR' && (
        <div style={fieldWrapStyle}>
          <span style={labelStyle}>Năm</span>
          <select
            style={inputStyle}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      )}

      {period === 'CUSTOM' && (
        <>
          <div style={fieldWrapStyle}>
            <span style={labelStyle}>Từ ngày</span>
            <input
              type="date"
              style={inputStyle}
              value={toDateInputValue(from)}
              onChange={(e) => setFrom(e.target.value || null)}
            />
          </div>
          <div style={fieldWrapStyle}>
            <span style={labelStyle}>Đến ngày</span>
            <input
              type="date"
              style={inputStyle}
              value={toDateInputValue(to)}
              onChange={(e) => setTo(e.target.value || null)}
            />
          </div>
        </>
      )}

      <label className="flex items-center gap-2" style={{ fontSize: '.85rem', cursor: 'pointer', userSelect: 'none' }}>
        <input
          type="checkbox"
          style={{ width: 'auto' }}
          checked={!!compareWithPrevious}
          onChange={(e) => setCompareWithPrevious(e.target.checked)}
        />
        So sánh kỳ trước
      </label>

      {onApply && (
        <button className="btn-primary btn-sm" onClick={handleApply} style={{ marginLeft: 'auto' }}>
          Áp dụng
        </button>
      )}
    </div>
  )
}