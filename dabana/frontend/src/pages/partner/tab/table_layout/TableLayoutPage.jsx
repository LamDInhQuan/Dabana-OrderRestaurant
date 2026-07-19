import React from 'react';
import { useParams } from 'react-router-dom';
import Navbar from '../../../components/Navbar';
import TableLayoutTab from './TableLayoutTab';

export default function TableLayoutPage() {
  const { branchId } = useParams();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-gray-200 pb-4">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Thiết Kế Sơ Đồ & Quản Lý Bàn</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Kéo thả thay đổi cấu trúc sơ đồ trực quan. Trạng thái hoạt động đồng bộ hóa real-time qua hệ thống.
            </p>
          </div>
        </div>
        <TableLayoutTab branchId={Number(branchId)} />
      </div>
    </div>
  );
}