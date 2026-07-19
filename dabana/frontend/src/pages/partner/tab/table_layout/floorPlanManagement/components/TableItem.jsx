import React from 'react';
import toast from 'react-hot-toast';
import { tableApi } from '../../../../../../api';

const NEXT_STATUS = {
  EMPTY: 'RESERVED',
  RESERVED: 'OCCUPIED',
  OCCUPIED: 'CLEANING',
  CLEANING: 'EMPTY'
};

export default function TableItem({ table, meta, onDragStart, refreshData }) {
  
  const handleTableClick = async () => {
    const nextStatus = NEXT_STATUS[table.status];
    if (!nextStatus) {
      toast.error('Bàn ăn trong trạng thái bảo trì/đặc biệt không thể chuyển nhanh.');
      return;
    }

    try {
      // Gọi API cập nhật thông tin bàn ăn (gồm trạng thái mới)
      await tableApi.update(table.id, {
        zoneId: table.zoneId,
        tableName: table.tableName,
        capacity: table.capacity,
        status: nextStatus
      });
      
      toast.success(`Bàn ${table.tableName} chuyển sang: ${meta.label}`);
      refreshData(); // Kéo dữ liệu mới để đồng bộ UI
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể đổi trạng thái bàn.');
    }
  };

  // Vị trí mặc định nếu chưa được cấu hình tọa độ trong layout_data
  const leftPos = table.positionX != null ? `${table.positionX}%` : '15%';
  const topPos = table.positionY != null ? `${table.positionY}%` : '15%';

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={handleTableClick}
      style={{
        position: 'absolute',
        left: leftPos,
        top: topPos,
        transform: 'translate(-50%, -50%)',
        border: `2px solid ${meta.color}`,
        backgroundColor: `${meta.color}15`,
      }}
      className="w-24 h-20 rounded-xl cursor-grab active:cursor-grabbing flex flex-col items-center justify-center select-none shadow-sm transition-all hover:shadow-md hover:scale-105 z-10"
    >
      <span className="font-extrabold text-sm text-gray-800">{table.tableName}</span>
      <span className="text-[10px] font-bold tracking-wider uppercase mt-0.5" style={{ color: meta.color }}>
        {meta.label}
      </span>
      <span className="text-[10px] text-gray-400 font-medium mt-1">{table.capacity} chỗ</span>
    </div>
  );
}