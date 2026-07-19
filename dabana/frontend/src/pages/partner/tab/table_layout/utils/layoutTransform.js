// Quy uoc toa do: rt_layout_tables.position_x/y va layout_data.x/y la SO NGUYEN
// (Integer o backend). MIN_DISTANCE=40 o DiningTableService dung tren chinh don vi nay.
//
//   gia tri luu DB = phan_tram_vi_tri * 10, lam tron so nguyen (0-1000 ~ 0.0%-100.0%)
// => MIN_DISTANCE=40 tuong duong ~4% khoang cach toi thieu giua 2 tam ban, hop ly cho
// 1 so do dac ban an.
//
// LUU Y: day la quy uoc phia FE tu suy ra tu kieu du lieu Integer + MIN_DISTANCE=40,

const SCALE = 10 // 1% = 10 don vi luu DB

export function pxToDbPosition(clientX, clientY, canvasRect) {
  const percentX = ((clientX - canvasRect.left) / canvasRect.width) * 100
  const percentY = ((clientY - canvasRect.top) / canvasRect.height) * 100
  const clamp = (v) => Math.min(100, Math.max(0, v))
  return {
    positionX: Math.round(clamp(percentX) * SCALE),
    positionY: Math.round(clamp(percentY) * SCALE),
  }
}

export function dbPositionToPercent(positionX, positionY) {
  return {
    left: (positionX ?? 0) / SCALE,
    top: (positionY ?? 0) / SCALE,
  }
}