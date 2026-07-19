import React from 'react';

export default function LayoutToolbar({ zones, activeZone, setActiveZone, isDirty, loading, onSave, onAddTable }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200/60">
      {/* Danh sách nút chọn Zone */}
      <div className="flex flex-wrap gap-1.5">
        {zones.map((z) => (
          <button
            key={z.id}
            onClick={() => setActiveZone(z)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
              activeZone?.id === z.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {z.zoneName}
          </button>
        ))}
      </div>

      {/* Hành động chính của sơ đồ */}
      <div className="flex items-center gap-2 text-xs font-bold">
        <button
          onClick={onAddTable}
          className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg transition"
        >
          + Thêm bàn
        </button>
        <button
          onClick={onSave}
          disabled={loading || !isDirty}
          className={`px-4 py-2 text-white rounded-lg shadow-sm transition ${
            isDirty && !loading
              ? 'bg-emerald-600 hover:bg-emerald-700 animate-pulse'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {loading ? 'Đang lưu...' : 'Lưu Vị Trí Sơ Đồ'}
        </button>
      </div>
    </div>
  );
}