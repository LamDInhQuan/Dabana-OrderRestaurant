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

  // Ap dung 1 phan thay doi width/height/rotation cho 1 ban (dung chung cho keo-tay-cam
  // tren canvas VA cho ô nhập số ở ObjectPanel). positionX/positionY luon duoc gui kem
  // vi backend bat buoc (DiningTablePositionItemRequest.positionX/positionY @NotNull),
  // con width/height/rotation chi gui field nao thuc su thay doi (partial update).
  const applyTableTransform = useCallback(async (table, patch, errorMessage) => {
    if (!isTableEditable(table)) {
      toast.error('Chỉ có thể chỉnh sửa khi bàn đang ở trạng thái Trống')
      return false
    }
    const previousTables = activeZoneTables
    setZones((prev) => prev.map((z) => z.id !== activeZoneId ? z : {
      ...z, tables: z.tables.map((t) => t.id === table.id ? { ...t, ...patch } : t),
    }))
    setSavingTableId(table.id)
    try {
      await tableApi.updateLayout({
        tables: [{
          tableId: table.id,
          positionX: table.positionX,
          positionY: table.positionY,
          ...patch,
        }],
      })
      return true
    } catch (err) {
      setZones((prev) => prev.map((z) => z.id !== activeZoneId ? z : { ...z, tables: previousTables }))
      toast.error(err.response?.data?.message || errorMessage)
      return false
    } finally {
      setSavingTableId(null)
    }
  }, [activeZoneId, activeZoneTables])

  // Keo goc de resize (tu tay cam tren TableItem)
  const resizeTable = useCallback((table, width, height) => (
    applyTableTransform(table, { width, height }, 'Lưu kích thước bàn thất bại')
  ), [applyTableTransform])

  // Keo tay cam de xoay (tu tay cam tren TableItem)
  const rotateTable = useCallback((table, rotation) => (
    applyTableTransform(table, { rotation }, 'Lưu góc xoay bàn thất bại')
  ), [applyTableTransform])

  // Nhap tay W/H/goc xoay chinh xac tu ObjectPanel (gui ca 3 field cung luc)
  const updateTableGeometry = useCallback((tableId, { width, height, rotation }) => {
    const table = activeZoneTables.find((t) => t.id === tableId)
    if (!table) return Promise.resolve(false)
    return applyTableTransform(table, { width, height, rotation }, 'Lưu kích thước/góc xoay thất bại')
  }, [activeZoneTables, applyTableTransform])

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
        width: t.width, height: t.height, rotation: t.rotation,
      }))
      const res = await zoneApi.saveFloorPlan({
        zoneId: activeZone.id,
        layoutData: JSON.stringify({ tables: tablesSnapshot, decorations: nextDecorations }),
      })
      const savedFloorPlan = res.data?.data || res.data
      // Dong bo lai floorPlan (layoutData/version) vao zones: neu khong lam buoc nay,
      // zones[].floorPlan van la snapshot cu tu lan loadZones dau tien. Khi user chuyen
      // qua zone khac roi quay lai, useEffect [activeZoneId] se doc lai tu zones cu ->
      // mat vat the vua them, phai F5 lai trang moi thay (vi loadZones() goi API moi).
      setZones((prev) => prev.map((z) => z.id !== activeZone.id ? z : {
        ...z,
        floorPlan: savedFloorPlan ? { ...z.floorPlan, ...savedFloorPlan } : z.floorPlan,
      }))
      return true
    } catch (err) {
      setDecorations(previous)
      toast.error(err.response?.data?.message || 'Lưu sơ đồ thất bại')
      return false
    } finally {
      setSavingLayout(false)
    }
  }, [activeZone, activeZoneTables, decorations])

  const addDecoration = useCallback(async (shape, name, extra = {}) => {
    const newDec = { id: `dec_${Date.now()}`, shape, name, x: 50, y: 50, ...extra }
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

  // Keo tay cam resize/rotate tren ShapeItem - luu ngay (khong doi selection)
  const resizeDecoration = useCallback(async (dec, width, height) => {
    await persistDecorations(decorations.map((d) => d.id === dec.id ? { ...d, width, height } : d))
  }, [decorations, persistDecorations])

  const rotateDecoration = useCallback(async (dec, rotation) => {
    await persistDecorations(decorations.map((d) => d.id === dec.id ? { ...d, rotation } : d))
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
    resizeTable, rotateTable, updateTableGeometry,
    addDecoration, updateDecoration, moveDecoration, deleteDecoration,
    resizeDecoration, rotateDecoration,
  }
}