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