import React, { useRef } from 'react';
import TableItem from './TableItem';
import { calculateCanvasPosition } from '../../utils/layoutTransform';

export default function LayoutCanvas({ tables, statusMeta, state }) {
  const canvasRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (!state.draggingTable || !canvasRef.current) return;

    // Tính toán lại tọa độ phần trăm chuẩn hóa dựa theo Canvas Container
    const { x, y } = calculateCanvasPosition(e.clientX, e.clientY, canvasRef.current);
    
    // Lưu tạm thời vị trí mới ở Client-side
    state.updateTableLocalPosition(state.draggingTable.id, x, y);
    state.setDraggingTable(null);
  };

  return (
    <div
      ref={canvasRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="relative w-full h-[500px] bg-white border-2 border-dashed border-gray-200 rounded-xl overflow-hidden shadow-inner bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]"
    >
      {tables.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 space-y-2">
          <span className="text-3xl">🪑</span>
          <span className="text-sm font-medium">Khu vực trống. Nhấn "+ Thêm bàn" để bố trí sơ đồ.</span>
        </div>
      )}

      {tables.map((table) => (
        <TableItem 
          key={table.id}
          table={table}
          meta={statusMeta[table.status] || { color: '#94A3B8', label: 'Không xác định' }}
          onDragStart={(e) => {
            state.setDraggingTable(table);
            e.dataTransfer.effectAllowed = 'move';
          }}
          refreshData={state.refreshData}
        />
      ))}
    </div>
  );
}