import { useState } from 'react'
import LayoutToolbar from './components/LayoutToolbar'
import LayoutCanvas from './components/LayoutCanvas'
import BulkPositionConfig from './components/BulkPositionConfig'
import TableFormModal from './components/TableFormModal'

export default function FloorPlanManagementTab({ floorPlan }) {
  const [adding, setAdding] = useState(false)
  const {
    zones, activeZone, activeZoneTables, savingTableId,
    selectZone, isTableEditable, moveTable, addTable,
  } = floorPlan

  return (
    <div>
      <LayoutToolbar
        zones={zones}
        activeZoneId={activeZone?.id}
        onSelectZone={selectZone}
        onAddTableClick={() => setAdding(true)}
      />

      <LayoutCanvas
        tables={activeZoneTables}
        isTableEditable={isTableEditable}
        savingTableId={savingTableId}
        onMoveTable={moveTable}
      />

      <BulkPositionConfig savingTableId={savingTableId} />

      <TableFormModal
        open={adding}
        onClose={() => setAdding(false)}
        onSubmit={addTable}
      />
    </div>
  )
}