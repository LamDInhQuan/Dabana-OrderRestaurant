import React from 'react';

export default function ZoneList({ zones, tables, onEdit, onDelete }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-wider">
          <tr>
            <th className="px-6 py-3">Tên Khu Vực</th>
            <th className="px-6 py-3">Mô tả chi tiết</th>
            <th className="px-6 py-3 text-center">Số lượng bàn đang có</th>
            <th className="px-6 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 text-gray-700 font-medium">
          {zones.length === 0 ? (
            <tr>
              <td colSpan="4" className="px-6 py-10 text-center text-gray-400 text-xs italic">
                Chưa có phân khu nào được tạo cho chi nhánh này. Vui lòng bấm thêm mới!
              </td>
            </tr>
          ) : (
            zones.map((zone) => (
              <tr key={zone.id} className="hover:bg-gray-50/80 transition-colors">
                <td className="px-6 py-4 font-extrabold text-gray-900">{zone.zoneName}</td>
                <td className="px-6 py-4 text-xs text-gray-500">{zone.description || '— Không có mô tả —'}</td>
                <td className="px-6 py-4 text-center text-sm font-bold text-indigo-600">
                  {tables[zone.id]?.length || 0} bàn
                </td>
                <td className="px-6 py-4 text-right text-xs space-x-3">
                  <button
                    onClick={() => onEdit(zone)}
                    className="text-indigo-600 hover:text-indigo-900 font-bold transition"
                  >
                    Chỉnh sửa
                  </button>
                  <button
                    onClick={() => onDelete(zone.id)}
                    className="text-red-500 hover:text-red-700 font-bold transition"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}