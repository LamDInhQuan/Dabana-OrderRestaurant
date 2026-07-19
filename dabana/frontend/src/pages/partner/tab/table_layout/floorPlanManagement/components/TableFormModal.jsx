import React, { useState } from 'react';

export default function TableFormModal({ onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(4);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ tableName: name, capacity });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-gray-100 p-6 space-y-4">
        <h3 className="text-base font-bold text-gray-900">Thêm bàn ăn mới</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Mã hiệu bàn</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: T01, VIP-02"
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Sức chứa tối đa (Khách)</label>
            <input
              type="number"
              min={1}
              required
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-indigo-500 font-semibold"
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
              className="flex-[2] py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm"
            >
              Tạo bàn ăn
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}