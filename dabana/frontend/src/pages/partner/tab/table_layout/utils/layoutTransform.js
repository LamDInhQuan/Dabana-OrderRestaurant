/**
 * Tính toán tọa độ chuẩn hóa dựa trên kích thước vùng chứa Canvas
 */
export const calculateCanvasPosition = (clientX, clientY, canvasElement) => {
  if (!canvasElement) return { x: 0, y: 0 };
  
  const rect = canvasElement.getBoundingClientRect();
  // Giới hạn giá trị nằm trong khoảng từ 0% đến 100% của khung chứa
  let x = ((clientX - rect.left) / rect.width) * 100;
  let y = ((clientY - rect.top) / rect.height) * 100;

  x = Math.max(0, Math.min(100, x));
  y = Math.max(0, Math.min(100, y));

  return {
    x: Math.round(x),
    y: Math.round(y)
  };
};