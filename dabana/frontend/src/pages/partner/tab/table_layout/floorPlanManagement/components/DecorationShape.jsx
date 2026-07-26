import { useRef, useState } from 'react'
import { dbPositionToPercent, clampSize, angleFromCenter } from '../../utils/layoutTransform'
import { getTextureBackground, getPreset } from './decorationPresets'
import FloorTexture, { WaterPond } from './floorPatterns'
import { BarCounter, StagePlatform } from './markerFurniture'

const DEFAULT_SIZE = 70
// Cac preset marker co hinh mau vector rieng (xem markerFurniture.jsx) thay vi chi
// icon emoji + khung net dut don gian.
// Cay canh la NGOAI LE: khong dung vector top-down (tan la nhin tu tren xuong chi la
// 1 vong tron xanh, khong ai doan duoc la "cay") - giu icon emoji 🌳 de nhan biet
// ngay, du kem "chuan kien truc" hon. Chi quay/san khau dung vector vi 2 cai do van
// doc duoc du trau tuong hoa (mat quay+ghe don, san+truss/den).
const FURNITURE_SHAPES = { bar: BarCounter, stage: StagePlatform, water: WaterPond }

// Render 1 tiểu cảnh dạng "khối" (marker/floor/wall). Đường đi (path) dùng
// DecorationPath riêng vì là polyline nhiều điểm chứ không phải 1 khối chữ nhật/tròn.
//
// Ưu tiên nhận diện bằng MẮT trước, chữ chỉ là nhãn phụ:
//  - floor: pattern SVG chất liệu thật (herringbone gỗ, terrazzo, sỏi bước chân, cỏ,
//    hồ Koi - xem floorPatterns.jsx). Mặc định PHỦ TOÀN BỘ khu vực canvas
//    (decoration.fullCover !== false) - không cần người dùng tự chỉnh kích thước/vị trí.
//  - wall: khối kiến trúc đặc màu trầm + đổ bóng nhẹ tạo chiều sâu.
//  - marker có hình mẫu vector (quầy bar/sân khấu/cây cảnh - xem markerFurniture.jsx):
//    vẽ minh hoạ top-down thật thay vì icon emoji, kèm bóng đổ để "nổi" trên sàn.
//  - marker không có hình mẫu (nhãn tròn/vuông tự do): giữ kiểu khoanh vùng nét đứt +
//    tên như cũ, vì đây là loại "tự đặt tên tuỳ ý".
//
// editable=false (dùng ở trang khách đặt bàn): chỉ hiển thị, không kéo/xoay/đổi cỡ,
// không có viền nét đứt của trình chỉnh sửa - trông giống "thật" hơn.
//
// livePosition: {left, top} % - khi đang được kéo (xem LayoutCanvas.startMove), ghi đè
// vị trí tính từ decoration.x/y để hiển thị theo đúng vị trí chuột tức thời.
//
// QUAN TRỌNG về nhãn tên: mọi <span> tên đều tự áp `rotate(-displayRotation)` để LUÔN
// hiển thị NGANG, không bị xoay nghiêng theo khối cha (khối cha đã bị `rotate()` ở
// ngoài) - đây là lỗi trước đó khiến tên vật thể (vd "Cửa") xoay dọc rất khó đọc khi
// khối được xoay 90°.
export default function DecorationShape({ decoration, editable = false, selected = false, livePosition, onStartMove, onClick, onResize, onRotate }) {
  const { left, top } = livePosition || dbPositionToPercent(decoration.x, decoration.y)
  const elRef = useRef(null)
  // Dữ liệu cũ (trước khi có floor/wall) không có field kind -> mặc định 'marker' để
  // vẫn hiển thị đúng như hành vi cũ (khoanh vùng nét đứt + tên).
  const kind = decoration.kind || 'marker'
  const isMarker = kind === 'marker'
  const isCircle = decoration.shape === 'circle' || decoration.round
  const preset = getPreset(decoration.shape)
  const icon = preset?.icon || null
  const Furniture = isMarker ? FURNITURE_SHAPES[decoration.shape] : null

  const width = decoration.width ?? DEFAULT_SIZE
  const height = decoration.height ?? DEFAULT_SIZE
  const rotation = decoration.rotation ?? 0

  const [liveSize, setLiveSize] = useState(null)
  const [liveRotation, setLiveRotation] = useState(null)
  const displayWidth = liveSize?.width ?? width
  const displayHeight = liveSize?.height ?? height
  const displayRotation = liveRotation ?? rotation
  const isTransforming = liveSize !== null || liveRotation !== null

  const startResize = (e) => {
    e.stopPropagation()
    e.preventDefault()
    const startX = e.clientX
    const startY = e.clientY
    const startW = width
    const startH = height

    const compute = (ev) => ({
      width: clampSize(startW + (ev.clientX - startX) * 2),
      height: clampSize(startH + (ev.clientY - startY) * 2),
    })

    const onMove = (ev) => setLiveSize(compute(ev))
    const onUp = (ev) => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      const next = compute(ev)
      setLiveSize(null)
      onResize?.(decoration, next.width, next.height)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const startRotate = (e) => {
    e.stopPropagation()
    e.preventDefault()
    const rect = elRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2

    const onMove = (ev) => setLiveRotation(angleFromCenter(cx, cy, ev.clientX, ev.clientY))
    const onUp = (ev) => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      const finalDeg = angleFromCenter(cx, cy, ev.clientX, ev.clientY)
      setLiveRotation(null)
      onRotate?.(decoration, finalDeg)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  // Marker co hinh mau vector (cay canh/quay bar/san khau): khong con dung khung net
  // dut xanh + icon emoji nua - de vector la thu duoc chu y truoc.
  const isFurnitureMarker = isMarker && !!Furniture
  const isIconicMarker = isMarker && icon && !isFurnitureMarker
  const isFloor = kind === 'floor'
  // Mac dinh TRUE (phu het canvas) tru khi nguoi dung tat rieng trong ObjectPanel -
  // du lieu cu chua co field nay cung tu dong duoc coi la fullCover luon.
  const isFullCoverFloor = isFloor && decoration.fullCover !== false

  const materialStyle = isFurnitureMarker
    ? { background: 'transparent', border: `1.5px ${selected && editable ? 'solid #1D4ED8' : 'solid transparent'}`, overflow: 'hidden' }
    : isIconicMarker
    ? {
        background: selected ? 'rgba(29,78,216,.10)' : 'rgba(0,0,0,.035)',
        border: `1.5px ${selected ? 'solid #1D4ED8' : 'dashed rgba(0,0,0,.18)'}`,
      }
    : isMarker
    ? {
        background: 'rgba(59,130,246,.12)',
        border: `2px dashed ${selected ? '#1D4ED8' : '#3B82F6'}`,
        color: '#1D4ED8',
      }
    : isFloor
    ? {
        // San gio dung pattern SVG that (xem FloorTexture) thay vi CSS gradient, nen
        // o day chi con vien khoanh vung khi dang chinh sua + cat goc bo tron theo
        // borderRadius cua khoi (overflow hidden ben duoi).
        border: editable ? `2px dashed ${selected ? '#1D4ED8' : 'rgba(0,0,0,.28)'}` : '1px solid rgba(0,0,0,.1)',
        overflow: 'hidden',
        color: '#4B4B4B',
      }
    : {
        ...getTextureBackground(decoration.texture || decoration.shape),
        border: editable
          ? `2px dashed ${selected ? '#1D4ED8' : 'rgba(255,255,255,.4)'}`
          : '1px solid rgba(0,0,0,.3)',
        color: '#fff',
        // Do bong nho de tuong "noi" khoi so voi san - dung cho khoi kien truc dac.
        boxShadow: editable ? undefined : '0 3px 6px rgba(0,0,0,.28)',
      }

  // Icon watermark cho tuong - kich thuoc ty le theo be nho nhat cua khoi.
  const floorIconSize = Math.max(18, Math.min(displayWidth, displayHeight) * 0.42)

  // Sàn phủ toàn bộ: bỏ hẳn vị trí/kích thước/góc xoay theo % - luôn phủ kín 100% canvas
  // (canvas cha có position:relative nên inset:0 ở đây tương đương phủ trọn khu vực).
  const positionStyle = isFullCoverFloor
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: 0 }
    : {
        position: 'absolute', left: `${left}%`, top: `${top}%`,
        transform: `translate(-50%, -50%) rotate(${displayRotation}deg)`,
        width: displayWidth, height: displayHeight,
        borderRadius: isCircle ? '50%' : kind === 'floor' ? 10 : 4,
      }

  // Nhan ten LUON hien ngang bat ke khoi cha xoay bao nhieu do - tu xoay nguoc lai
  // displayRotation de trung hoa. Day la phan sua loi nhan bi xoay nghieng kho doc.
  // display:'inline-block' bat buoc phai co vi transform khong dam bao ap dung dung
  // cho phan tu inline thuan (span) tren moi trinh duyet.
  const nameLabelStyle = {
    display: 'inline-block',
    transform: `rotate(${-displayRotation}deg)`,
    whiteSpace: 'nowrap',
  }

  return (
    <div
      ref={elRef}
      onMouseDown={editable && !isFullCoverFloor ? (e) => onStartMove(e, decoration) : undefined}
      onClick={() => editable && onClick?.(decoration)}
      style={{
        ...positionStyle,
        cursor: editable && !isFullCoverFloor ? 'grab' : editable ? 'pointer' : 'default',
        userSelect: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: isIconicMarker ? 'column' : undefined,
        gap: isIconicMarker ? 2 : 0,
        fontSize: '.7rem', fontWeight: 600, textAlign: 'center', padding: '.3rem',
        transition: (isTransforming || livePosition) ? 'none' : undefined,
        // Thu tu lop: san(1) < tuong/duong di(2) < ban(3) < nhan/vat trang tri(4),
        // de nhan luon hien ro tren cung, khong bi san/tuong/ban che.
        zIndex: kind === 'floor' ? 1 : kind === 'wall' ? 2 : 4,
        boxShadow: isFurnitureMarker && !editable ? '0 3px 6px rgba(0,0,0,.22)' : undefined,
        borderRadius: isFurnitureMarker ? (isCircle ? '50%' : 6) : undefined,
        ...materialStyle,
      }}>
      {/* San: pattern SVG that (herringbone/terrazzo/soi/co/ho Koi) thay cho CSS
          gradient + icon watermark cu - ban than hoa tiet da du de nhan biet. */}
      {isFloor && (
        <FloorTexture
          texture={decoration.texture || decoration.shape}
          decorationId={decoration.id}
          width={displayWidth}
          height={displayHeight}
        />
      )}
      {/* Icon watermark cho tuong - can giua toan khoi, khong day layout chu */}
      {icon && kind === 'wall' && (
        <span aria-hidden style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          fontSize: floorIconSize, lineHeight: 1, opacity: 0.35,
          filter: 'grayscale(1) brightness(2.4)',
          pointerEvents: 'none', userSelect: 'none',
        }}>
          {icon}
        </span>
      )}
      {/* Marker co hinh mau vector (cay canh/quay bar/san khau) */}
      {isFurnitureMarker && (
        <Furniture width={displayWidth} height={displayHeight} id={decoration.id} />
      )}
      {isFurnitureMarker && decoration.name && (
        <span style={{
          position: 'absolute', bottom: 2, left: '50%',
          transform: `translateX(-50%) rotate(${-displayRotation}deg)`,
          display: 'inline-block',
          fontSize: '.62rem', fontWeight: 600, color: '#374151',
          background: 'rgba(255,255,255,.88)', padding: '0 4px', borderRadius: 4, lineHeight: 1.4,
          maxWidth: '92%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          zIndex: 1,
        }}>
          {decoration.name}
        </span>
      )}
      {/* Marker co icon emoji don gian (du phong cho preset tuong lai chua co vector rieng) */}
      {isIconicMarker && (
        <>
          <span aria-hidden style={{ fontSize: Math.max(20, Math.min(displayWidth, displayHeight) * 0.5), lineHeight: 1 }}>
            {icon}
          </span>
          {decoration.name && (
            <span style={{
              fontSize: '.62rem', fontWeight: 600, color: '#374151',
              background: 'rgba(255,255,255,.85)', padding: '0 4px', borderRadius: 4, lineHeight: 1.3,
              maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              ...nameLabelStyle,
            }}>
              {decoration.name}
            </span>
          )}
        </>
      )}
      {/* Marker tu do (nhan tron/vuong khong icon rieng): nhan hien giua khoi nhu cu -
          khoi nay du lon de chua chu ben trong. */}
      {isMarker && !isIconicMarker && !isFurnitureMarker && decoration.name && (
        <span style={{ position: 'relative', zIndex: 1, ...nameLabelStyle }}>
          {decoration.name}
        </span>
      )}
      {/* Tuong: nhan noi HAN ra NGOAI phia tren khoi thay vi nhoi ben trong - vi tuong
          thuong rat mong (18-20px) nen chu de bi cat/kho doc neu ep vao ben trong.
          Nen trang dac + bong do de luon noi ro bat ke dung tren nen san nao. Chi hien
          khi dang chinh sua (editable) - khach xem so do khong can thay ten tuong. */}
      {kind === 'wall' && editable && decoration.name && (
        <span style={{
          position: 'absolute', top: -22, left: '50%',
          transform: `translateX(-50%) rotate(${-displayRotation}deg)`,
          display: 'inline-block', whiteSpace: 'nowrap',
          fontSize: '.72rem', fontWeight: 700, color: '#1F2937',
          background: '#fff', padding: '2px 7px', borderRadius: 5,
          boxShadow: '0 2px 5px rgba(0,0,0,.35)', border: '1px solid rgba(0,0,0,.12)',
        }}>
          {decoration.name}
        </span>
      )}
      {selected && editable && !isFullCoverFloor && (
        <>
          <div
            onMouseDown={startRotate}
            title="Kéo để xoay"
            style={{
              position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)',
              width: 14, height: 14, borderRadius: '50%', background: '#1D4ED8',
              border: '2px solid #fff', cursor: 'grab', boxShadow: '0 1px 3px rgba(0,0,0,.3)',
            }}
          />
          <div
            onMouseDown={startResize}
            title="Kéo để đổi kích cỡ"
            style={{
              position: 'absolute', bottom: -6, right: -6,
              width: 12, height: 12, borderRadius: 4, background: '#1D4ED8',
              border: '2px solid #fff', cursor: 'nwse-resize', boxShadow: '0 1px 3px rgba(0,0,0,.3)',
            }}
          />
        </>
      )}
    </div>
  )
}