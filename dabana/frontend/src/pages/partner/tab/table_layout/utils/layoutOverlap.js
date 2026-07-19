export const MIN_DISTANCE = 40.0;

/**
 * Kiểm tra va chạm giữa các bàn ăn dựa trên vị trí tọa độ
 * @param {Array} tables Danh sách bàn ăn hiện tại
 * @returns {Object} { isValid: boolean, message: string|null }
 */
export const validateTableOverlap = (tables) => {
  for (let i = 0; i < tables.length; i++) {
    const left = tables[i];
    if (left.positionX == null || left.positionY == null) continue;

    for (let j = i + 1; j < tables.length; j++) {
      const right = tables[j];
      if (right.positionX == null || right.positionY == null) continue;

      const dx = left.positionX - right.positionX;
      const dy = left.positionY - right.positionY;
      const distance = Math.hypot(dx, dy);

      if (distance < MIN_DISTANCE) {
        return {
          isValid: false,
          message: `Bàn "${left.tableName}" và bàn "${right.tableName}" nằm quá gần nhau (${distance.toFixed(1)}px < ${MIN_DISTANCE}px). Vui lòng điều chỉnh lại.`
        };
      }
    }
  }
  return { isValid: true, message: null };
};