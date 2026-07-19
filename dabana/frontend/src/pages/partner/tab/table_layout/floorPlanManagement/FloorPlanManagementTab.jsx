import React, { useState } from 'react';
import toast from 'react-hot-toast';
import LayoutToolbar from './components/LayoutToolbar';
import LayoutCanvas from './components/LayoutCanvas';
import TableFormModal from './components/TableFormModal';
import { tableApi } from '../../../../../api';

const STATUS_META = {
  1:             { color: '#22C55E', label: 'Trống' }, 
  2:          { color: '#EF4444', label: 'Đã đặt' },
  3:          { color: '#F59E0B', label: 'Đang dùng' },
  4:          { color: '#94A3B8', label: 'Dọn dẹp' },
  5:          { color: '#8B5CF6', label: 'Bảo trí' },
};

export default function FloorPlanManagementTab({ state }) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleOpenAddModal = () => {
    if (!state.activeZone) {
      toast.error('Vui lòng tạo khu vực trước khi thêm bàn ăn.');
      return;
    }
    setModalOpen(true);
  };

  const handleCreateTableSuccess = async (newTableData) => {
    try {
      await tableApi.create({
        tableName: newTableData.tableName.trim(), // Khớp thuộc tính tableName của Java entity
        capacity: Number(newTableData.capacity),
        zoneId: state.activeZone.id,
        positionX: 15,
        positionY: 15
      });
      toast.success('Đã khởi tạo bàn ăn mới thành công.');
      state.refreshData(); // Kéo lại dữ liệu sạch từ Server để cập nhật Layout Data
      setModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khởi tạo bàn ăn.');
    }
  };

  return (
    <div className="space-y-4 flex flex-col h-full">
      <LayoutToolbar 
        zones={state.zones}
        activeZone={state.activeZone}
        setActiveZone={state.setActiveZone}
        isDirty={state.isDirty}
        loading={state.loading}
        onSave={state.savePositions}
        onAddTable={handleOpenAddModal}
      />

      <LayoutCanvas 
        tables={state.activeZoneTables}
        statusMeta={STATUS_META}
        state={state}
      />

      {/* Chú thích màu trạng thái (Legend) */}
      <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
        {Object.entries(STATUS_META).map(([key, { color, label }]) => (
          <div key={key} className="flex items-center gap-2 text-xs font-medium text-gray-600">
            <div className="w-3 h-3 rounded shadow-sm" style={{ backgroundColor: color }} />
            <span>{label}</span>
          </div>
        ))}
        <div className="text-xs text-gray-400 ml-auto italic">
          💡 Mẹo: Nhấp chuột vào bàn để xoay vòng trạng thái vận hành nhanh.
        </div>
      </div>

      {modalOpen && (
        <TableFormModal 
          onClose={() => setModalOpen(false)}
          onSubmit={handleCreateTableSuccess}
        />
      )}
    </div>
  );
}