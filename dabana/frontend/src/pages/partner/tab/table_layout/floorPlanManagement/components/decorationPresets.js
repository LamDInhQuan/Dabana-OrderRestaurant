// Danh sách "tiểu cảnh" có thể thêm vào sơ đồ bàn.
// `kind` quyết định cách DecorationShape/DecorationPath/DecorationDoor render:
//  - 'marker' : nhãn khoanh vùng đơn giản (hình tròn/vuông có chữ) - kiểu cũ, dùng cho
//               những thứ chỉ cần đánh dấu vị trí (quầy bar, sân khấu, cây cảnh...)
//  - 'floor'  : mảng SÀN phủ nền (cỏ / sỏi / gạch / gỗ / hồ nước) - vẽ dưới cùng
//  - 'wall'   : tường / vách ngăn - khối đặc kiến trúc, vẽ trên sàn, dưới bàn
//  - 'door'   : cửa ra/vào - ký hiệu chuẩn CAD (đường thẳng cánh cửa + cung xoay nét
//               đứt), dùng DecorationDoor.jsx riêng vì hình học khác hẳn khối chữ nhật
//  - 'path'   : đường đi nhiều điểm (polyline), vẽ bằng cách nhấp chọn điểm trên canvas
//
// `icon` là 1 emoji hiển thị dạng watermark lớn giữa khối, giúp nhận biết loại tiểu
// cảnh ngay từ hình dạng/màu sắc + icon mà KHÔNG cần đọc chữ (xem DecorationShape.jsx).
//
// Dữ liệu 1 decoration (lưu trong zone.floorPlan.layoutData -> decorations[]):
//   marker/floor/wall: { id, kind, shape, texture?, name, x, y, width, height, rotation }
//   door:              { id, kind:'door', shape:'door', name, x, y, width, height(=width),
//                        rotation, flip } - flip đảo hướng bản lề/chiều mở cửa
//   path:              { id, kind:'path', name, points:[{x,y},...], strokeWidth, style, color }
//
// Dữ liệu cũ (trước khi có tính năng này) chỉ có { id, shape:'circle'|'square', name, x, y,
// width, height, rotation } và KHÔNG có field `kind` - DecorationShape mặc định kind='marker'
// khi thiếu field này nên vẫn hiển thị đúng như trước (tương thích ngược).

export const DECORATION_PRESETS = [
  { key: 'square', kind: 'marker', label: '⬜ Nhãn vuông', icon: null, defaultName: 'Khu vực', defaultSize: { width: 70, height: 70 } },
  { key: 'circle', kind: 'marker', label: '⚪ Nhãn tròn', icon: null, defaultName: 'Khu vực', defaultSize: { width: 70, height: 70 }, round: true },
  { key: 'plant', kind: 'marker', label: '🌳 Cây cảnh', icon: '🌳', defaultName: 'Cây cảnh', defaultSize: { width: 50, height: 50 }, round: true },
  { key: 'bar', kind: 'marker', label: '🍹 Quầy bar', icon: '🍹', defaultName: 'Quầy bar', defaultSize: { width: 90, height: 60 } },
  { key: 'stage', kind: 'marker', label: '🎤 Sân khấu', icon: '🎤', defaultName: 'Sân khấu', defaultSize: { width: 120, height: 80 } },
  { key: 'grass', kind: 'floor', label: '🌱 Sàn cỏ', icon: '🌱', defaultName: 'Thảm cỏ', defaultSize: { width: 160, height: 120 } },
  { key: 'gravel', kind: 'floor', label: '🪨 Sàn sỏi', icon: '🪨', defaultName: 'Sân sỏi', defaultSize: { width: 160, height: 120 } },
  { key: 'tile', kind: 'floor', label: '◻️ Sàn gạch', icon: '◻️', defaultName: 'Sàn gạch', defaultSize: { width: 160, height: 120 } },
  { key: 'wood', kind: 'floor', label: '🪵 Sàn gỗ', icon: '🪵', defaultName: 'Sàn gỗ', defaultSize: { width: 160, height: 120 } },
  { key: 'water', kind: 'floor', label: '💧 Hồ nước', icon: '💧', defaultName: 'Hồ nước', defaultSize: { width: 140, height: 100 }, round: true },
  { key: 'wall', kind: 'wall', label: '🧱 Tường', icon: null, defaultName: 'Tường', defaultSize: { width: 160, height: 18 } },
  { key: 'door', kind: 'door', label: '🚪 Cửa ra vào', icon: null, defaultName: 'Cửa', defaultSize: { width: 80, height: 80 } },
  { key: 'path', kind: 'path', label: '🚶 Đường đi', icon: null, defaultName: 'Lối đi' },
]

export function getPreset(key) {
  return DECORATION_PRESETS.find((p) => p.key === key)
}

// Style nền mô phỏng chất liệu bằng CSS gradient thuần - không cần ảnh ngoài nên
// luôn hiển thị được kể cả khi offline / không có asset. Pattern được làm đậm nét
// hơn (tương phản cao hơn, hoạ tiết rõ ràng hơn: viên sỏi tròn, vân gỗ, mạch gạch,
// hàng gạch xây tường so le...) để nhận diện được ngay bằng mắt, không chỉ dựa vào
// icon/chữ.
export function getTextureBackground(textureKey) {
  switch (textureKey) {
    case 'grass':
      return {
        backgroundColor: '#7CBB6D',
        backgroundImage:
          'radial-gradient(circle at 20% 30%, rgba(255,255,255,.22) 0 4px, transparent 5px),' +
          'radial-gradient(circle at 60% 65%, rgba(0,0,0,.14) 0 4px, transparent 5px),' +
          'radial-gradient(circle at 85% 25%, rgba(255,255,255,.18) 0 3px, transparent 4px),' +
          'radial-gradient(circle at 35% 85%, rgba(0,0,0,.12) 0 3px, transparent 4px),' +
          'radial-gradient(circle at 10% 75%, rgba(255,255,255,.15) 0 3px, transparent 4px)',
        backgroundSize: '30px 30px',
      }
    case 'gravel':
      return {
        backgroundColor: '#BDB4A0',
        backgroundImage:
          'radial-gradient(ellipse 5px 4px at 20% 30%, rgba(0,0,0,.28) 40%, transparent 41%),' +
          'radial-gradient(ellipse 4px 5px at 60% 60%, rgba(255,255,255,.5) 40%, transparent 41%),' +
          'radial-gradient(ellipse 4px 3px at 80% 20%, rgba(0,0,0,.22) 40%, transparent 41%),' +
          'radial-gradient(ellipse 3px 4px at 35% 80%, rgba(255,255,255,.4) 40%, transparent 41%)',
        backgroundSize: '22px 22px',
      }
    case 'tile':
      return {
        backgroundColor: '#EFEAE0',
        backgroundImage:
          'linear-gradient(rgba(120,110,95,.35) 2px, transparent 2px),' +
          'linear-gradient(90deg, rgba(120,110,95,.35) 2px, transparent 2px)',
        backgroundSize: '32px 32px',
      }
    case 'wood':
      return {
        backgroundColor: '#B98A55',
        backgroundImage:
          'repeating-linear-gradient(90deg, rgba(90,55,20,.35) 0 3px, transparent 3px 30px),' +
          'repeating-linear-gradient(0deg, rgba(255,235,205,.12) 0 1px, transparent 1px 5px)',
      }
    case 'water':
      return {
        backgroundColor: '#6FB8D6',
        backgroundImage:
          'repeating-radial-gradient(circle at 30% 40%, rgba(255,255,255,.35) 0 2px, transparent 3px 26px),' +
          'repeating-radial-gradient(circle at 70% 70%, rgba(255,255,255,.25) 0 2px, transparent 3px 22px)',
      }
    case 'wall':
      // Tuong kien truc: khoi dac mau tram am (khong con pattern gach ke o) + 1 vien
      // sang mong phia tren de goi cam giac anh sang chieu vao canh tuong, tao chieu day.
      return {
        backgroundColor: '#463C31',
        backgroundImage: 'linear-gradient(rgba(255,241,214,.16), rgba(255,241,214,.16) 3px, transparent 3px)',
      }
    default:
      return { backgroundColor: 'rgba(59,130,246,.12)' }
  }
}

// Đọc mảng decorations từ 1 zone (zone.floorPlan.layoutData là chuỗi JSON).
export function parseZoneDecorations(zone) {
  const layoutData = zone?.floorPlan?.layoutData
  if (!layoutData) return []
  try {
    const parsed = JSON.parse(layoutData)
    return Array.isArray(parsed.decorations) ? parsed.decorations : []
  } catch {
    return []
  }
}