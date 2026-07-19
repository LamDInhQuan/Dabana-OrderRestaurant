import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { zoneApi } from '../../../../../api';
import ZoneList from './components/ZoneList';
import ZoneFormModal from './components/ZoneFormModal';

export default function ZoneManagementTab({ branchId, state }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);

  const handleCreateOrUpdateZone = async (formData) => {
    try {
      if (editingZone) {
        await zoneApi.update(editingZone.id, {
          zoneName: formData.zoneName.trim(),
          description: formData.description
        });
        toast.success('Cập nhật thông tin khu vực thành công.');
      } else {
        await zoneApi.create({
          branchId,
          zoneName: formData.zoneName.trim(),
          description: formData.description
        });
        toast.success('Thêm mới phân khu thành công.');
      }
      setModalOpen(false);
      setEditingZone(null);
      state.refreshData(); // Kéo lại dữ liệu tổng thể mới nhất
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra trong quá trình xử lý.');
    }
  };

  const handleDeleteZone = async (zoneId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa khu vực này? Hành động này không thể hoàn tác.')) return;
    try {
      await zoneApi.delete(zoneId);
      toast.success('Đã xóa phân khu thành công.');
      state.refreshData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa khu vực hiện tại (Có thể vẫn còn chứa bàn ăn).');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-gray-800">Danh mục Phân Khu</h3>
          <p className="text-[11px] text-gray-400 font-normal">Quản lý và thiết lập phân mảnh các khu vực ăn uống tại chi nhánh.</p>
        </div>
        <button
          onClick={() => { setEditingZone(null); setModalOpen(true); }}
          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-sm transition"
        >
          + Thêm Khu Vực Mới
        </button>
      </div>

      {/* Gọi Component Danh sách đã tách lớp */}
      <ZoneList 
        zones={state.zones}
        tables={state.tables}
        onEdit={(zone) => { setEditingZone(zone); setModalOpen(true); }}
        onDelete={handleDeleteZone}
      />

      {/* Gọi Component Form Modal đã tách lớp */}
      {modalOpen && (
        <ZoneFormModal
          zone={editingZone}
          onClose={() => { setModalOpen(false); setEditingZone(null); }}
          onSubmit={handleCreateOrUpdateZone}
        />
      )}
    </div>
  );
}