import { dbPositionToPercent } from '../../utils/layoutTransform'

// Ký hiệu cửa ra/vào chuẩn bản vẽ kiến trúc: 1 đường thẳng là cánh cửa (leaf) đang mở
// vuông góc với tường + 1 cung tròn nét đứt (bán kính = bề rộng cửa, tâm tại bản lề)
// thể hiện quỹ đạo quét khi mở/đóng cửa. Đây là ký hiệu chuẩn dùng trong mọi bản vẽ
// CAD/kiến trúc, không phải hình minh hoạ tự chế.
//
// Toạ độ cục bộ trong khối vuông width×width (chưa xoay theo decoration.rotation):
//   - Khe cửa (chỗ hở trên tường) luôn nằm ở CẠNH DƯỚI: từ (0,w) đến (w,w)
//   - flip=false: bản lề tại góc DƯỚI-TRÁI (0,w), cánh cửa mở lên góc TRÊN-TRÁI (0,0)
//   - flip=true : bản lề tại góc DƯỚI-PHẢI (w,w), cánh cửa mở lên góc TRÊN-PHẢI (w,0)
// Việc đặt cửa đúng hướng trên tường thực tế dùng field `rotation` (xoay cả khối).
//
// Khác với DecorationShape/DecorationPath, cửa KHÔNG có tay cầm kéo-resize/kéo-xoay
// trên canvas để giữ đơn giản - bề rộng và góc xoay chỉnh qua form ở ObjectPanel.
export default function DecorationDoor({ decoration, editable = false, selected = false, livePosition, onStartMove, onClick }) {
  const { left, top } = livePosition || dbPositionToPercent(decoration.x, decoration.y)
  const w = decoration.width ?? 80
  const rotation = decoration.rotation ?? 0
  const flip = !!decoration.flip

  const leafPath = flip ? `M ${w} ${w} L ${w} 0` : `M 0 ${w} L 0 0`
  const arcPath = flip
    ? `M ${w} 0 A ${w} ${w} 0 0 0 0 ${w}`
    : `M 0 0 A ${w} ${w} 0 0 1 ${w} ${w}`
  const strokeColor = selected && editable ? '#1D4ED8' : '#1F2937'
  // Mau xam lanh (thay vi nau am truoc day) + lop "halo" trang phia sau net ve, giup
  // ky hieu cua luon noi ro du dung tren nen san mau am (co/go/gach terrazzo) hay mau
  // lanh - truoc day mau nau am de bi chim vao cac cham mau am tren nen san.
  const haloColor = '#FFFFFF'

  return (
    <div
      onMouseDown={editable ? (e) => onStartMove(e, decoration) : undefined}
      onClick={() => editable && onClick?.(decoration)}
      style={{
        position: 'absolute', left: `${left}%`, top: `${top}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        width: w, height: w,
        cursor: editable ? 'grab' : 'default',
        transition: livePosition ? 'none' : undefined,
        zIndex: 2,
      }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${w} ${w}`}>
        {/* khe ho tren tuong noi dat cua - vien nhe de van thay ro tren nen sang mau */}
        <rect x="0" y={w - 3} width={w} height="3" fill="#F5EFE3" stroke="rgba(0,0,0,.22)" strokeWidth="0.6" opacity=".95" />
        {/* halo trang phia sau cung quet + canh cua - giup net luon noi ro tren moi nen */}
        <path d={arcPath} fill="none" stroke={haloColor} strokeWidth="3.2" opacity=".9" />
        <path d={arcPath} fill="none" stroke={strokeColor} strokeWidth="1.4" strokeDasharray="4 3" />
        <path d={leafPath} stroke={haloColor} strokeWidth="4.8" strokeLinecap="round" opacity=".9" />
        <path d={leafPath} stroke={strokeColor} strokeWidth="2.6" strokeLinecap="round" />
        {editable && selected && (
          <rect x="0.5" y="0.5" width={w - 1} height={w - 1} fill="none" stroke="#1D4ED8" strokeWidth="1" strokeDasharray="3 2" opacity=".5" />
        )}
      </svg>
    </div>
  )
}