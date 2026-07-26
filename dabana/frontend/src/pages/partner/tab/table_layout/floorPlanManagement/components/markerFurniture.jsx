// Vector top-down cho các marker có "hình mẫu" cố định (quầy bar / sân khấu / cây
// cảnh) - nâng cấp từ icon emoji + khung nét đứt sang minh hoạ vector thật, đồng bộ
// chất lượng với floorPatterns.jsx. Mỗi hàm render 1 <svg> phủ kín khối (viewBox theo
// đúng kích thước px thật của khối nên không bị méo).

// ---------------- Cây cảnh: tán lá nhìn từ trên xuống (khoanh tròn nhiều lớp) --------
export function PlantCanopy({ width, height }) {
  const cx = width / 2
  const cy = height / 2
  const r = Math.max(6, Math.min(width, height) / 2 - 1)
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ position: 'absolute', inset: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="#5C8A3F" />
      <circle cx={cx} cy={cy} r={r * 0.72} fill="#6FA34C" />
      <circle cx={cx} cy={cy} r={r * 0.44} fill="#7CB65A" />
      {/* tan la dan cheo - vai net cong nho de khong phang le */}
      <g stroke="#4A7530" strokeWidth={Math.max(1, r * 0.06)} fill="none" opacity=".55">
        <path d={`M ${cx - r * 0.5} ${cy - r * 0.2} Q ${cx - r * 0.1} ${cy - r * 0.55} ${cx + r * 0.35} ${cy - r * 0.3}`} />
        <path d={`M ${cx - r * 0.35} ${cy + r * 0.4} Q ${cx + r * 0.1} ${cy + r * 0.1} ${cx + r * 0.5} ${cy + r * 0.3}`} />
      </g>
      {/* goc than cay lo ra chinh giua */}
      <circle cx={cx} cy={cy} r={Math.max(2, r * 0.14)} fill="#6B4A2C" />
    </svg>
  )
}

// ---------------- Quầy bar: mặt quầy + dãy ghế đôn tròn dọc 1 cạnh ---------------------
export function BarCounter({ width, height, id }) {
  const gradId = `${id}-bartop`
  const stoolY = height * 0.8
  const stoolR = Math.max(4, Math.min(height * 0.16, 9))
  const n = Math.max(2, Math.round(width / 34))
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7A5230" />
          <stop offset="100%" stopColor="#5C3B1E" />
        </linearGradient>
      </defs>
      {/* mat quay - go am, co vien sang phia tren mo phong anh phan xa */}
      <rect x="0" y="0" width={width} height={height * 0.52} rx="4" fill={`url(#${gradId})`} stroke="#3E2712" strokeWidth="1.5" />
      <rect x="2" y="2" width={width - 4} height={height * 0.1} rx="3" fill="rgba(255,255,255,.18)" />
      {/* day ghe don tron */}
      {Array.from({ length: n }).map((_, i) => {
        const x = (width / (n + 1)) * (i + 1)
        return <circle key={i} cx={x} cy={stoolY} r={stoolR} fill="#A9835A" stroke="#5C3F22" strokeWidth="1.4" />
      })}
    </svg>
  )
}

// ---------------- Sân khấu: sàn nâng + truss/đèn chiếu dọc cạnh trên -------------------
export function StagePlatform({ width, height, id }) {
  const floorId = `${id}-stagefloor`
  const trussCount = Math.max(2, Math.round(width / 28))
  const lightCount = Math.max(2, Math.round(width / 50))
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <linearGradient id={floorId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4B4458" />
          <stop offset="100%" stopColor="#332D3D" />
        </linearGradient>
      </defs>
      {/* san san khau nang len - mau tram, canh vien ro */}
      <rect x="2" y="2" width={width - 4} height={height - 4} rx="3" fill={`url(#${floorId})`} stroke="#1F1B27" strokeWidth="2" />
      {/* thanh truss doc theo canh tren */}
      <g stroke="#9992AC" strokeWidth="1.4" opacity=".85">
        <line x1="8" y1="9" x2={width - 8} y2="9" />
        {Array.from({ length: trussCount }).map((_, i) => {
          const x = 8 + ((width - 16) / (trussCount - 1 || 1)) * i
          return <line key={i} x1={x} y1="9" x2={x} y2="17" />
        })}
      </g>
      {/* den chieu sang tren truss */}
      {Array.from({ length: lightCount }).map((_, i) => {
        const x = 16 + ((width - 32) / (lightCount - 1 || 1)) * i
        return <circle key={i} cx={x} cy={13} r="3.4" fill="#F4D35E" stroke="#8B7A2E" strokeWidth="0.8" />
      })}
    </svg>
  )
}