import { useState } from 'react'
import FloorPlanManagementTab from './floorPlanManagement/FloorPlanManagementTab'
import ZoneManagementTab from './zoneManagement/ZoneManagementTab'

const TABS = [
  { key: 'floorplan', label: 'Sơ đồ bàn' },
  { key: 'zones', label: 'Quản lý khu vực' },
]

export default function TableLayoutTab({ floorPlan }) {
  const [tab, setTab] = useState('floorplan')

  return (
    <div className="page-container" style={{ padding: '1.5rem 1rem' }}>
      <div className="flex gap-2" style={{ marginBottom: '1rem' }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={tab === t.key ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'floorplan'
        ? <FloorPlanManagementTab floorPlan={floorPlan} />
        : <ZoneManagementTab
            zones={floorPlan.zones}
            reloadZones={floorPlan.reloadZones}
            branchId={floorPlan.branchId}
          />}
    </div>
  )
}