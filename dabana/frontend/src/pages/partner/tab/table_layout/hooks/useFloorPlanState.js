import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { zoneApi, tableApi } from '../../../../../api'
import { pxToDbPosition } from '../utils/layoutTransform'
import { findOverlap } from '../utils/layoutOverlap'

export const EMPTY_STATUS_CODE = 1

function parseDecorations(floorPlan) {
  if (!floorPlan?.layoutData) return []
  try {
    const parsed = JSON.parse(floorPlan.layoutData)
    return Array.isArray(parsed.decorations) ? parsed.decorations : []
  } catch {
    return []
  }
}

export function useFloorPlanState(branchId) {
  const [zones, setZones] = useState([])
  const [activeZoneId, setActiveZoneId] = useState(null)
  const [decorations, setDecorations] = useState([])
  const [selected, setSelected] = useState(null) // { type: 'table'|'decoration', data }
  const [loading, setLoading] = useState(true)
  const [savingTableId, setSavingTableId] = useState(null)
  const [savingLayout, setSavingLayout] = useState(false)

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

  // Doi zone -> nap lai decorations tu layout_data cua zone do, bo chon hien tai
  useEffect(() => {
    setDecorations(parseDecorations(activeZone?.floorPlan))
    setSelected(null)
  }, [activeZoneId, activeZone?.floorPlan?.version])

  const isTableEditable = (table) => table.status === EMPTY_STATUS_CODE

  const selectTable = (table) => setSelected({ type: 'table', data: table })
  const selectDecoration = (dec) => setSelected({ type: 'decoration', data: dec })
  const clearSelection = () => setSelected(null)

  // ---------------- Ban an (di qua tableApi, dung nhu truoc) ----------------

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
      ...z, tables: z.tables.map((t) => t.id === table.id ? { ...t, positionX, positionY } : t),
    }))
    setSavingTableId(table.id)
    try {
      await tableApi.updateLayout({ tables: [{ tableId: table.id, positionX, positionY }] })
    } catch (err) {
      setZones((prev) => prev.map((z) => z.id !== activeZoneId ? z : { ...z, tables: previousTables }))
      toast.error(err.response?.data?.message || 'Lưu vị trí thất bại')
    } finally {
      setSavingTableId(null)
    }
  }, [activeZoneId, activeZoneTables])

  const addTable = useCallback(async (payload) => {
    if (!activeZone) { toast.error('Vui lòng chọn khu vực'); return false }
    try {
      const res = await tableApi.create({ ...payload, zoneId: activeZone.id, positionX: 50, positionY: 50 })
      const created = res.data?.data || res.data
      setZones((prev) => prev.map((z) => z.id !== activeZone.id ? z : { ...z, tables: [...(z.tables || []), created] }))
      toast.success(`Đã thêm bàn ${created.tableName}`)
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi thêm bàn')
      return false
    }
  }, [activeZone])

  const updateTable = useCallback(async (tableId, payload) => {
    if (!activeZone) return false
    try {
      const res = await tableApi.update(tableId, { ...payload, zoneId: activeZone.id })
      const updated = res.data?.data || res.data
      setZones((prev) => prev.map((z) => z.id !== activeZoneId ? z : {
        ...z, tables: z.tables.map((t) => t.id === tableId ? updated : t),
      }))
      toast.success('Đã lưu thông tin bàn')
      setSelected(null)
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi lưu bàn')
      return false
    }
  }, [activeZone, activeZoneId])

  const deleteTable = useCallback(async (table) => {
    if (!isTableEditable(table)) {
      toast.error('Chỉ có thể xoá bàn đang ở trạng thái Trống')
      return
    }
    try {
      await tableApi.delete(table.id)
      setZones((prev) => prev.map((z) => z.id !== activeZoneId ? z : { ...z, tables: z.tables.filter((t) => t.id !== table.id) }))
      setSelected(null)
      toast.success(`Đã xoá bàn ${table.tableName}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xoá bàn')
    }
  }, [activeZoneId])

  // ---------------- Vat trang tri (Hinh vuong/tron) - luu qua layout_data.decorations ----------------
  // KHONG dung tableApi: day khong phai ban an that, chi la vat minh hoa. Luu rieng
  // trong layout_data de khong lam ban "gia" trong rt_layout_tables.

  const persistDecorations = useCallback(async (nextDecorations) => {
    if (!activeZone) return false
    const previous = decorations
    setDecorations(nextDecorations)
    setSavingLayout(true)
    try {
      const tablesSnapshot = activeZoneTables.map((t) => ({
        tableId: t.id, tableName: t.tableName, x: t.positionX, y: t.positionY,
      }))
      await zoneApi.saveFloorPlan({
        zoneId: activeZone.id,
        layoutData: JSON.stringify({ tables: tablesSnapshot, decorations: nextDecorations }),
      })
      return true
    } catch (err) {
      setDecorations(previous)
      toast.error(err.response?.data?.message || 'Lưu sơ đồ thất bại')
      return false
    } finally {
      setSavingLayout(false)
    }
  }, [activeZone, activeZoneTables, decorations])

  const addDecoration = useCallback(async (shape, name) => {
    const newDec = { id: `dec_${Date.now()}`, shape, name, x: 50, y: 50 }
    const ok = await persistDecorations([...decorations, newDec])
    if (ok) toast.success(`Đã thêm ${name}`)
    return ok
  }, [decorations, persistDecorations])

  const updateDecoration = useCallback(async (decId, payload) => {
    const next = decorations.map((d) => d.id === decId ? { ...d, ...payload } : d)
    const ok = await persistDecorations(next)
    if (ok) { toast.success('Đã lưu vật thể'); setSelected(null) }
    return ok
  }, [decorations, persistDecorations])

  const moveDecoration = useCallback(async (dec, clientX, clientY, canvasRect) => {
    const { positionX, positionY } = pxToDbPosition(clientX, clientY, canvasRect)
    await persistDecorations(decorations.map((d) => d.id === dec.id ? { ...d, x: positionX, y: positionY } : d))
  }, [decorations, persistDecorations])

  const deleteDecoration = useCallback(async (decId) => {
    const ok = await persistDecorations(decorations.filter((d) => d.id !== decId))
    if (ok) { setSelected(null); toast.success('Đã xoá vật thể') }
  }, [decorations, persistDecorations])

  return {
    branchId, zones, loading, activeZone, activeZoneTables, decorations, selected,
    savingTableId, savingLayout,
    selectZone: setActiveZoneId, reloadZones: loadZones,
    selectTable, selectDecoration, clearSelection,
    isTableEditable, moveTable, addTable, updateTable, deleteTable,
    addDecoration, updateDecoration, moveDecoration, deleteDecoration,
  }
}