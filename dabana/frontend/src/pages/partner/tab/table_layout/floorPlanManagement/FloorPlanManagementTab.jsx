import LayoutToolbar from './components/LayoutToolbar'
import LayoutCanvas from './components/LayoutCanvas'
import BulkPositionConfig from './components/BulkPositionConfig'
import ObjectPanel from './components/ObjectPanel'

export default function FloorPlanManagementTab({ floorPlan }) {
  const { zones, activeZone, activeZoneTables, decorations, selected, savingTableId,
    selectZone, isTableEditable, moveTable, moveDecoration, selectTable, selectDecoration,
    resizeTable, rotateTable, resizeDecoration, rotateDecoration } = floorPlan

  return (
    <div>
      <LayoutToolbar zones={zones} activeZoneId={activeZone?.id} onSelectZone={selectZone} />

      <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <LayoutCanvas
            tables={activeZoneTables}
            decorations={decorations}
            isTableEditable={isTableEditable}
            savingTableId={savingTableId}
            selected={selected}
            onMoveTable={moveTable}
            onMoveDecoration={moveDecoration}
            onSelectTable={selectTable}
            onSelectDecoration={selectDecoration}
            onResizeTable={resizeTable}
            onRotateTable={rotateTable}
            onResizeDecoration={resizeDecoration}
            onRotateDecoration={rotateDecoration}
          />
          <BulkPositionConfig savingTableId={savingTableId} />
        </div>

        <ObjectPanel floorPlan={floorPlan} />
      </div>
    </div>
  )
}
