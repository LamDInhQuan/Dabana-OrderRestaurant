import React, { useState, useEffect } from 'react';

export default function ZoneFormModal({ isOpen, zone, onClose, onSubmit }) {
  const [zoneName, setZoneName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  // Đổ dữ liệu cũ vào form nếu phát hiện đang ở chế độ Chỉnh sửa (Edit Mode)
  useEffect(() => {
    if (zone) {
      setZoneName(zone.zoneName || '');
      setDescription(zone.description || '');
    } else {
      setZoneName('');
      setDescription('');
    }
  }, [zone]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!zoneName.trim()) return;
    onSubmit({ zoneName, description });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-gray-100 p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-gray-100 pb-2">
          <h3 className="text-base font-bold text-gray-900">
            {zone ? 'Cập nhật phân khu' : 'Tạo khu vực (Zone) mới'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
        </div>
        
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Tên khu vực / Phân khu *</label>
            <input
              type="text"
              required
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              placeholder="VD: Tầng trệt, Sân thượng, Phòng VIP"
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">Mô tả không gian</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nhập thông tin mô tả hướng nhìn, máy lạnh, không gian..."
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium resize-none"
            />
          </div>
          
          <div className="flex gap-2 pt-2 text-xs font-bold">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="flex-[2] py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm text-center"
            >
              {zone ? 'Lưu thay đổi' : 'Xác nhận tạo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}