// Bộ pattern SVG "thật" cho các loại sàn/tiểu cảnh - thay cho CSS gradient chấm bi
// độ phân giải thấp trước đây. Đây là kỹ thuật bắt buộc để làm được herringbone,
// terrazzo, sóng nước... vì CSS background-image chỉ tạo được gradient/chấm đơn giản,
// còn <pattern> của SVG cho phép vẽ hình dạng vector tuỳ ý rồi lặp lại vô hạn.
//
// Mỗi decoration render 1 <svg> riêng, patternUnits="userSpaceOnUse" nên kích thước ô
// lặp (tile) tính theo px thật - không phụ thuộc kích thước khối, giống 1 tấm sàn thật
// được cắt vừa khung chứ không bị co giãn méo hoạ tiết.
//
// LƯU Ý ID: SVG id phải duy nhất trong toàn bộ DOM (không chỉ trong 1 <svg>), nên
// patternId luôn được ghép với decoration.id (xem DecorationShape.jsx) để 2 khối cùng
// chất liệu trên 1 sơ đồ không bị đụng id.

// ---------------- Cỏ: từng cụm cỏ dạng nét cong nhỏ, tông xanh lục ấm ----------------
function GrassPattern({ id }) {
  const tuft = (x, y, rotate, scale = 1) => (
    <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}
      stroke="#4F7A34" strokeWidth="1.4" strokeLinecap="round" fill="none" opacity="0.8">
      <path d="M0 10 Q-2 3 -4 -2" />
      <path d="M0 10 Q0 2 0 -4" />
      <path d="M0 10 Q2 3 4 -2" />
    </g>
  )
  return (
    <pattern id={id} width="38" height="38" patternUnits="userSpaceOnUse">
      <rect width="38" height="38" fill="#7CA65B" />
      <circle cx="6" cy="6" r="1.3" fill="#5C8A3F" opacity=".3" />
      <circle cx="30" cy="26" r="1.6" fill="#5C8A3F" opacity=".28" />
      {tuft(9, 30, -8)}
      {tuft(28, 10, 12, 0.9)}
      {tuft(18, 20, 4, 1.1)}
    </pattern>
  )
}

// ---------------- Sàn gỗ: vân chéo xen kẽ kiểu ô cờ (basket-weave), tông gỗ ấm ---------
// Đây là biến thể đơn giản hoá của herringbone: mỗi ô vuông nhỏ có vân gỗ chạy chéo,
// ô kế bên chạy chéo ngược lại - tạo cảm giác ván gỗ ghép chéo giống herringbone thật,
// dễ nhận diện ngay là "sàn gỗ ghép" thay vì 1 màu nâu phẳng.
function WoodPattern({ id }) {
  const P = 18
  const stripes = (angle, key) => (
    <g key={key} transform={`rotate(${angle} ${P / 2} ${P / 2})`}>
      {[-1, 0, 1, 2].map((i) => (
        <rect key={i} x={-P} y={i * 6 - 3} width={P * 3} height="4" fill={i % 2 === 0 ? '#C9A472' : '#B07C46'} />
      ))}
    </g>
  )
  return (
    <pattern id={id} width={P * 2} height={P * 2} patternUnits="userSpaceOnUse">
      <rect width={P * 2} height={P * 2} fill="#B98A55" />
      <clipPath id={`${id}-a`}><rect x="0" y="0" width={P} height={P} /></clipPath>
      <clipPath id={`${id}-b`}><rect x={P} y="0" width={P} height={P} /></clipPath>
      <clipPath id={`${id}-c`}><rect x="0" y={P} width={P} height={P} /></clipPath>
      <clipPath id={`${id}-d`}><rect x={P} y={P} width={P} height={P} /></clipPath>
      <g clipPath={`url(#${id}-a)`}>{stripes(45, 'a')}</g>
      <g clipPath={`url(#${id}-b)`}>{stripes(-45, 'b')}</g>
      <g clipPath={`url(#${id}-c)`}>{stripes(-45, 'c')}</g>
      <g clipPath={`url(#${id}-d)`}>{stripes(45, 'd')}</g>
      {/* mach ghep giua cac o cho ro net */}
      <path d={`M${P} 0 V${P * 2} M0 ${P} H${P * 2}`} stroke="#7A5230" strokeWidth="1" opacity=".5" />
    </pattern>
  )
}

// ---------------- Sàn gạch: terrazzo ấm - nền đá vôi nhạt + đốm đá hoa nhiều màu -------
function TilePattern({ id }) {
  const chips = [
    { x: 6, y: 8, r: 2.6, c: '#C97B5A' }, { x: 22, y: 4, r: 1.8, c: '#9CAA6B' },
    { x: 36, y: 14, r: 2.2, c: '#B08968' }, { x: 14, y: 24, r: 1.6, c: '#D8CBAE' },
    { x: 30, y: 34, r: 2.4, c: '#C97B5A' }, { x: 4, y: 38, r: 1.9, c: '#9CAA6B' },
    { x: 42, y: 40, r: 1.5, c: '#B08968' }, { x: 24, y: 44, r: 2, c: '#D8CBAE' },
  ]
  return (
    <pattern id={id} width="48" height="48" patternUnits="userSpaceOnUse">
      <rect width="48" height="48" fill="#EFE7D6" />
      {chips.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={c.r} fill={c.c} opacity=".65" />)}
      <path d="M48 0 V48 M0 48 H48" stroke="rgba(120,105,80,.25)" strokeWidth="1.5" />
    </pattern>
  )
}

// ---------------- Sàn sỏi: đá lát bước chân, tông đất ấm -------------------------------
function GravelPattern({ id }) {
  return (
    <pattern id={id} width="56" height="56" patternUnits="userSpaceOnUse">
      <rect width="56" height="56" fill="#BDB49C" />
      {/* nen soi min mo lam nen giua cac vien da */}
      <g fill="#A79A80" opacity=".5">
        <circle cx="10" cy="12" r="1" /><circle cx="46" cy="8" r="1.2" />
        <circle cx="28" cy="48" r="1" /><circle cx="50" cy="40" r="1.1" />
        <circle cx="6" cy="42" r="1" />
      </g>
      {/* vien da buoc chan - hinh bau duc lech, co vien sang toi de tao khoi */}
      <ellipse cx="16" cy="18" rx="12" ry="10" fill="#8F8573" transform="rotate(-8 16 18)" />
      <ellipse cx="16" cy="18" rx="12" ry="10" fill="none" stroke="#6E6553" strokeWidth="1" transform="rotate(-8 16 18)" />
      <ellipse cx="14" cy="14" rx="5" ry="3.4" fill="#A79A80" opacity=".55" transform="rotate(-8 16 18)" />

      <ellipse cx="42" cy="34" rx="13" ry="10.5" fill="#948A72" transform="rotate(10 42 34)" />
      <ellipse cx="42" cy="34" rx="13" ry="10.5" fill="none" stroke="#6E6553" strokeWidth="1" transform="rotate(10 42 34)" />
      <ellipse cx="39" cy="29" rx="5.5" ry="3.6" fill="#B0A588" opacity=".55" transform="rotate(10 42 34)" />
    </pattern>
  )
}

// Component chính: render toàn bộ nội dung <svg> cho 1 khối sàn, theo texture key.
export default function FloorTexture({ texture, decorationId, width, height }) {
  const id = `fp-${texture}-${decorationId}`

  if (texture === 'water') {
    return (
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, display: 'block' }} preserveAspectRatio="none">
        <WaterKoiFixed id={id} width={width} height={height} />
      </svg>
    )
  }

  const Pattern = texture === 'wood' ? WoodPattern
    : texture === 'tile' ? TilePattern
    : texture === 'gravel' ? GravelPattern
    : GrassPattern

  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, display: 'block' }} preserveAspectRatio="none">
      <defs><Pattern id={id} /></defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

// Ban rieng cho nuoc vi can vi tri ca theo px thuc (khong dung % string transform de
// tranh loi cu phap SVG - SVG transform khong nhan don vi %).
// Ho nuoc gio la 1 MARKER (dat cuc bo, khong con thuoc nhom san phu toan bo khu vuc) -
// export rieng theo dung chuan cac marker vector khac (BarCounter/StagePlatform o
// markerFurniture.jsx: nhan (width,height,id), tu ve <svg> rieng phu kin khoi.
export function WaterPond({ width, height, id }) {
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, display: 'block' }} preserveAspectRatio="none">
      <WaterKoiFixed id={`marker-${id}`} width={width} height={height} />
    </svg>
  )
}

function WaterKoiFixed({ id, width, height }) {
  const gradId = `${id}-grad`
  const waveId = `${id}-wave`
  const w = width || 140
  const h = height || 100
  return (
    <>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7FC1D6" />
          <stop offset="100%" stopColor="#4E93AC" />
        </linearGradient>
        <pattern id={waveId} width="46" height="30" patternUnits="userSpaceOnUse">
          <path d="M0 8 Q11.5 2 23 8 T46 8" fill="none" stroke="rgba(255,255,255,.4)" strokeWidth="1.4" />
          <path d="M0 22 Q11.5 16 23 22 T46 22" fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="1.2" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${gradId})`} />
      <rect width="100%" height="100%" fill={`url(#${waveId})`} />
      <g opacity=".62" transform={`translate(${w * 0.28} ${h * 0.62}) rotate(-18)`}>
        <path d="M0 0 C6 -5 16 -5 22 0 C16 5 6 5 0 0 Z" fill="#E8734A" />
        <path d="M0 0 L-9 -6 L-9 6 Z" fill="#E8734A" opacity=".8" />
        <path d="M8 -1.5 Q12 -3 16 -1.5 Q12 0.5 8 -1.5 Z" fill="#F4F1E7" opacity=".85" />
      </g>
      <g opacity=".5" transform={`translate(${w * 0.64} ${h * 0.32}) rotate(24) scale(0.8)`}>
        <path d="M0 0 C6 -5 16 -5 22 0 C16 5 6 5 0 0 Z" fill="#F4F1E7" />
        <path d="M0 0 L-9 -6 L-9 6 Z" fill="#F4F1E7" opacity=".8" />
        <circle cx="6" cy="0" r="2" fill="#2C2C2C" opacity=".4" />
      </g>
    </>
  )
}