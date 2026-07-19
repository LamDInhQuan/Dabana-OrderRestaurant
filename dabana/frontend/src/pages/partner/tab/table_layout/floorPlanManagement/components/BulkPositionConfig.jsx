import React from 'react';
import toast from 'react-hot-toast';

export default function BulkPositionConfig({ tables, updateTableLocalPosition }) {
  
  // Tự động căn chỉnh toàn bộ bàn trong khu vực hiện tại thành một lưới (Grid) ngăn nắp
  const handleAutoAlignGrid = () => {
    if (!tables || tables.length === 0) {
      toast.error('Không có bàn nào trong khu vực này để sắp xếp.');
      return;
    }

    const COLUMNS = 4; // Số cột mong muốn trong lưới
    const START_X = 15; // Tọa độ % bắt đầu của cột đầu tiên
    const START_Y = 15; // Tọa độ % bắt đầu của hàng đầu tiên
    const GAP_X = 22;   // Khoảng cách giữa các cột (%)
    const GAP_Y = 20;   // Khoảng cách giữa các hàng (%)

    tables.forEach((table, index) => {
      const col = index % COLUMNS;
      const row = Math.floor(index / COLUMNS);
      
      const newX = START_X + col * GAP_X;
      const newY = START_Y + row * GAP_Y;

      // Cập nhật tọa độ cục bộ (Client-side) thông qua hook trạng thái
      updateTableLocalPosition(table.id, Math.min(newX, 90), Math.min(newY, 90));
    });

    toast.success('Đã tự động căn chỉnh sơ đồ bàn theo lưới.');
  };

  const handleResetPositions = () => {
    if (!window.confirm('Bạn có chắc chắn muốn đưa tất cả bàn về góc xuất phát (15%, 15%)?')) return;
    
    tables.forEach((table) => {
      updateTableLocalPosition(table.id, 15, 15);
    });
    toast.success('Đã thiết lập lại vị trí toàn bộ bàn.');
  };

  return (
    <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 flex items-center justify-between gap-4 text-xs">
      <div className="flex items-center gap-2 text-indigo-900">
        <span className="text-base">⚡</span>
        <div>
          <p className="font-bold">Công cụ sắp xếp nhanh</p>
          <p className="text-gray-500 font-normal">Sắp đặt vị trí hàng loạt trước khi tinh chỉnh chi tiết.</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleAutoAlignGrid}
          className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-sm transition"
        >
          Tự Động Căn Lưới (Grid)
        </button>
        <button
          onClick={handleResetPositions}
          className="px-3 py-1.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-lg hover:bg-gray-50 hover:text-red-600 transition"
        >
          Xóa Vị Trí Cũ
        </button>
      </div>
    </div>
  );
}