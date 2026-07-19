import React, { useState } from 'react';
import FloorPlanManagementTab from './floorPlanManagement/FloorPlanManagementTab';
import ZoneManagementTab from './zoneManagement/ZoneManagementTab';
import { useFloorPlanState } from './hooks/useFloorPlanState';

export default function TableLayoutTab({ branchId }) {
  const [currentTab, setCurrentTab] = useState('floor_plan');
  
  // Khởi tạo và chia sẻ trạng thái chung từ Centralized Custom Hook
  const floorPlanState = useFloorPlanState(branchId);

  const tabs = [
    { id: 'floor_plan', label: 'Bố Trí Sơ Đồ Bàn' },
    { id: 'zone_settings', label: 'Cấu Hình Khu Vực (Zone)' }
  ];

  return (
    <div className="w-full flex flex-col space-y-4">
      <div className="flex gap-1 border-b border-gray-200 bg-white p-1 rounded-lg shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              if (floorPlanState.isDirty && !window.confirm('Bạn có các thay đổi vị trí bàn chưa được lưu. Chuyển trang sẽ mất dữ liệu?')) {
                return;
              }
              setCurrentTab(tab.id);
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
              currentTab === tab.id
                ? 'bg-indigo-50 text-indigo-600 shadow-sm border border-indigo-100'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 min-h-[500px]">
        {currentTab === 'floor_plan' && (
          <FloorPlanManagementTab state={floorPlanState} />
        )}
        {currentTab === 'zone_settings' && (
          <ZoneManagementTab branchId={branchId} state={floorPlanState} />
        )}
      </div>
    </div>
  );
}