// PHAI khop chinh xac voi DiningTableService.MIN_DISTANCE (backend). Doi 1 ben nho doi
// ben kia, khong duoc lech - day chi la canh bao som phia FE, quyet dinh cuoi van o BE.
export const MIN_DISTANCE = 15

export function findOverlap(tables, movingTableId, nextX, nextY) {
  for (const table of tables) {
    if (table.id === movingTableId) continue
    if (table.positionX == null || table.positionY == null) continue
    const dx = table.positionX - nextX
    const dy = table.positionY - nextY
    const distance = Math.hypot(dx, dy)
    if (distance < MIN_DISTANCE) return table
  }
  return null
}