import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { zoneApi, tableApi } from '../../../../../api'
import { pxToDbPosition } from '../utils/layoutTransform'
import { findOverlap } from '../utils/layoutOverlap'

// Khop voi diningtable/util/DiningTableStatus.java (backend-layout.zip):
// EMPTY(1), RESERVED(2), OCCUPIED(3), CLEANING(4), MAINTENANCE(5)
export const EMPTY_STATUS_CODE = 1

export function useFloorPlanState(branchId) {
  const [zones, setZones] = useState([])
  const [activeZoneId, setActiveZoneId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingTableId, setSavingTableId] = useState(null)

  const loadZones = useCallback(async () => {
    if (!branchId) return
    setLoading(true)
    try {
      const res = await zoneApi.getByBranch(branchId)
      const data = res.data?.data || res.data || []
      setZones(data)
      setActiveZoneId((prev) => prev ?? data[0]?.id ?? null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được sơ đồ')
    } finally {
      setLoading(false)
    }
  }, [branchId])

  useEffect(() => { loadZones() }, [loadZones])

  const activeZone = zones.find((z) => z.id === activeZoneId) || null
  const activeZoneTables = activeZone?.tables || []

  const isTableEditable = (table) => table.status === EMPTY_STATUS_CODE

  const moveTable = useCallback(async (table, clientX, clientY, canvasRect) => {
    if (!isTableEditable(table)) {
      toast.error('Chỉ có thể di chuyển bàn đang ở trạng thái Trống')
      return
    }
    const { positionX, positionY } = pxToDbPosition(clientX, clientY, canvasRect)

    const overlapWith = findOverlap(activeZoneTables, table.id, positionX, positionY)
    if (overlapWith) {
      toast.error(`Vị trí quá gần bàn ${overlapWith.tableName}, vui lòng chọn chỗ khác`)
      return
    }

    const previousTables = activeZoneTables
    setZones((prev) => prev.map((z) => z.id !== activeZoneId ? z : {
      ...z,
      tables: z.tables.map((t) => t.id === table.id ? { ...t, positionX, positionY } : t),
    }))
    setSavingTableId(table.id)

    try {
      await tableApi.updateLayout({ tables: [{ tableId: table.id, positionX, positionY }] })
    } catch (err) {
      // rollback: layout_data la nguon goc, neu BE tu choi thi FE khong duoc giu
      // optimistic state, phai khoi phuc lai trang thai truoc do.
      setZones((prev) => prev.map((z) => z.id !== activeZoneId ? z : { ...z, tables: previousTables }))
      toast.error(err.response?.data?.message || 'Lưu vị trí thất bại')
    } finally {
      setSavingTableId(null)
    }
  }, [activeZoneId, activeZoneTables])

  const addTable = useCallback(async (payload) => {
    if (!activeZone) { toast.error('Vui lòng chọn khu vực'); return false }
    try {
      const res = await tableApi.create({ ...payload, zoneId: activeZone.id })
      const created = res.data?.data || res.data
      setZones((prev) => prev.map((z) => z.id !== activeZone.id ? z : { ...z, tables: [...(z.tables || []), created] }))
      toast.success(`Đã thêm bàn ${created.tableName}`)
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi thêm bàn')
      return false
    }
  }, [activeZone])

  const deleteTable = useCallback(async (table) => {
    if (!isTableEditable(table)) {
      toast.error('Chỉ có thể xoá bàn đang ở trạng thái Trống')
      return
    }
    try {
      await tableApi.delete(table.id)
      setZones((prev) => prev.map((z) => z.id !== activeZoneId ? z : { ...z, tables: z.tables.filter((t) => t.id !== table.id) }))
      toast.success(`Đã xoá bàn ${table.tableName}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xoá bàn')
    }
  }, [activeZoneId])

  return {
    branchId, // can de ZoneManagementTab tao zone moi (CreateZoneRequest.branchId @NotNull)
    zones, loading, activeZone, activeZoneTables, savingTableId,
    selectZone: setActiveZoneId, reloadZones: loadZones,
    isTableEditable, moveTable, addTable, deleteTable,
  }
}