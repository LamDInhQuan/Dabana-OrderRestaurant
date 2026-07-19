// Doi chieu voi MIN_DISTANCE = 40.0 trong DiningTableService (backend).
// Chi la CANH BAO SOM o FE de UX muot hon khi keo-tha - backend van la noi
// validate cuoi cung (validateNoOverlap), khong duoc coi day la nguon xac thuc.
export const MIN_DISTANCE = 40

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