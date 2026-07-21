// Quy uoc CHINH THUC (thong nhat voi backend - xem comment MIN_DISTANCE trong
// DiningTableService.java): position_x/position_y la PHAN TRAM (0-100) vi tri tren
// canvas cua zone. Khong nhan/chia gi them.
export function pxToDbPosition(clientX, clientY, canvasRect) {
  const percentX = ((clientX - canvasRect.left) / canvasRect.width) * 100
  const percentY = ((clientY - canvasRect.top) / canvasRect.height) * 100
  const clamp = (v) => Math.min(100, Math.max(0, v))
  return {
    positionX: Math.round(clamp(percentX)),
    positionY: Math.round(clamp(percentY)),
  }
}

export function dbPositionToPercent(positionX, positionY) {
  return {
    left: positionX ?? 0,
    top: positionY ?? 0,
  }
}

// width/height la PIXEL, doc lap voi canvas (khop voi range 20-500 o backend:
// CreateDiningTableRequest / DiningTablePositionItemRequest).
export function clampSize(value, min = 20, max = 500) {
  if (Number.isNaN(value)) return min
  return Math.min(max, Math.max(min, Math.round(value)))
}

// rotation la DO, chuan hoa ve [0, 360) - khop voi normalizeRotation() ben
// FloorPlanSyncService.java va DECIMAL(5,2) o DB.
export function normalizeRotation(deg) {
  const r = deg % 360
  return r < 0 ? r + 360 : r
}

// Goc (do) tinh tu tam (cx, cy) toi diem chuot (px, py).
// 0deg = huong len tren (12h), tang dan theo chieu kim dong ho - khop voi CSS rotate(deg).
export function angleFromCenter(cx, cy, px, py) {
  const rad = Math.atan2(px - cx, -(py - cy))
  const deg = (rad * 180) / Math.PI
  return Math.round(normalizeRotation(deg) * 100) / 100 // giu 2 chu so thap phan
}
