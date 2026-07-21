import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import { menuApi } from '../../../../../api'

export const MENU_ITEM_STATUS = {
  SELLING: 'SELLING',
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  DISCONTINUED: 'DISCONTINUED',
}

const DEFAULT_FILTERS = {
  keyword: '',
  categoryId: null,
  status: null,
  priceMin: null,
  priceMax: null,
}

const DEFAULT_PAGE_SIZE = 20

const unwrap = (res) => res.data?.data ?? res.data

export function useMenuState(branchId) {
  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [savingCategoryId, setSavingCategoryId] = useState(null)

  const [items, setItems] = useState([])
  const [pageInfo, setPageInfo] = useState({ page: 0, size: DEFAULT_PAGE_SIZE, totalElements: 0, totalPages: 0, last: true })
  const [loadingItems, setLoadingItems] = useState(true)
  const [savingItemId, setSavingItemId] = useState(null)
  const [savingBulk, setSavingBulk] = useState(false)

  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedIds, setSelectedIds] = useState([])

  const [stats, setStats] = useState({ total: 0, selling: 0, outOfStock: 0 })
  const [loadingStats, setLoadingStats] = useState(true)

  // ---------------- Danh muc ----------------

  const loadCategories = useCallback(async () => {
    if (!branchId) return
    setLoadingCategories(true)
    try {
      const res = await menuApi.getCategories(branchId)
      setCategories(unwrap(res) || [])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được danh mục')
    } finally {
      setLoadingCategories(false)
    }
  }, [branchId])

  useEffect(() => { loadCategories() }, [loadCategories])

  const createCategory = useCallback(async (payload) => {
    try {
      await menuApi.createCategory({ ...payload, branchId: Number(branchId) })
      toast.success('Đã thêm danh mục')
      await loadCategories()
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi thêm danh mục')
      return false
    }
  }, [branchId, loadCategories])

  const updateCategory = useCallback(async (categoryId, payload) => {
    setSavingCategoryId(categoryId)
    try {
      await menuApi.updateCategory(categoryId, payload)
      toast.success('Đã cập nhật danh mục')
      await loadCategories()
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật danh mục')
      return false
    } finally {
      setSavingCategoryId(null)
    }
  }, [loadCategories])

  const deleteCategory = useCallback(async (categoryId) => {
    try {
      await menuApi.deleteCategory(categoryId)
      toast.success('Đã xoá danh mục')
      await loadCategories()
      setFilters((prev) => prev.categoryId === categoryId ? { ...prev, categoryId: null } : prev)
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xoá danh mục')
      return false
    }
  }, [loadCategories])

  // ---------------- Danh sach mon (search + filter + phan trang) ----------------

  const buildSearchParams = useCallback((overrides = {}) => {
    const f = { ...filters, ...overrides }
    return {
      branchId: Number(branchId),
      categoryId: f.categoryId || undefined,
      status: f.status || undefined,
      keyword: f.keyword?.trim() || undefined,
      priceMin: f.priceMin ?? undefined,
      priceMax: f.priceMax ?? undefined,
      page: overrides.page ?? pageInfo.page,
      size: pageInfo.size,
    }
  }, [branchId, filters, pageInfo.page, pageInfo.size])

  const loadItems = useCallback(async (overrides = {}) => {
    if (!branchId) return
    setLoadingItems(true)
    try {
      const res = await menuApi.searchItems(buildSearchParams(overrides))
      const data = unwrap(res) || {}
      setItems(data.content || [])
      setPageInfo({
        page: data.page ?? 0,
        size: data.size ?? DEFAULT_PAGE_SIZE,
        totalElements: data.totalElements ?? 0,
        totalPages: data.totalPages ?? 0,
        last: data.last ?? true,
      })
      setSelectedIds([])
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được danh sách món')
    } finally {
      setLoadingItems(false)
    }
  }, [branchId, buildSearchParams])

  useEffect(() => { loadItems({ page: 0 }) }, [branchId, filters])

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const applyFilters = useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch }))
  }, [])

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), [])

  const goToPage = useCallback((page) => { loadItems({ page }) }, [loadItems])

  const visibleItems = items

  const createItem = useCallback(async (payload) => {
    try {
      await menuApi.createItem(payload)
      toast.success('Đã thêm món')
      await loadItems({ page: 0 })
      await loadStats()
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi thêm món')
      return false
    }
  }, [loadItems])

  const updateItem = useCallback(async (itemId, payload) => {
    setSavingItemId(itemId)
    try {
      await menuApi.updateItem(itemId, payload)
      toast.success('Đã cập nhật món')
      await loadItems()
      await loadStats()
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật món')
      return false
    } finally {
      setSavingItemId(null)
    }
  }, [loadItems])

  const deleteItem = useCallback(async (itemId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xoá món ăn này?')) return false
    try {
      await menuApi.deleteItem(itemId)
      toast.success('Đã xoá món')
      await loadItems()
      await loadStats()
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xoá món')
      return false
    }
  }, [loadItems])

  const toggleItemStatus = useCallback(async (item) => {
    const next = item.status === MENU_ITEM_STATUS.SELLING
      ? MENU_ITEM_STATUS.OUT_OF_STOCK
      : MENU_ITEM_STATUS.SELLING
    setSavingItemId(item.id)
    const previous = items
    setItems((prev) => prev.map((it) => it.id === item.id ? { ...it, status: next } : it))
    try {
      await menuApi.updateItemStatus(item.id, next)
      toast.success(next === MENU_ITEM_STATUS.SELLING ? 'Đã hiện lại món' : 'Đã tạm ẩn món')
      await loadStats()
    } catch (err) {
      setItems(previous)
      toast.error(err.response?.data?.message || 'Lỗi đổi trạng thái')
    } finally {
      setSavingItemId(null)
    }
  }, [items])

  // ---------------- Chon nhieu + bulk action ----------------

  const toggleSelect = useCallback((itemId) => {
    setSelectedIds((prev) => prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId])
  }, [])

  const toggleSelectAllOnPage = useCallback(() => {
    setSelectedIds((prev) => {
      const pageIds = visibleItems.map((it) => it.id)
      const allSelected = pageIds.length > 0 && pageIds.every((id) => prev.includes(id))
      return allSelected ? prev.filter((id) => !pageIds.includes(id)) : [...new Set([...prev, ...pageIds])]
    })
  }, [visibleItems])

  const clearSelection = useCallback(() => setSelectedIds([]), [])

  const bulkUpdateStatus = useCallback(async (status) => {
    if (selectedIds.length === 0) return false
    setSavingBulk(true)
    try {
      await menuApi.bulkUpdateItemStatus(selectedIds, status)
      toast.success(`Đã cập nhật trạng thái cho ${selectedIds.length} món`)
      setSelectedIds([])
      await loadItems()
      await loadStats()
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật hàng loạt')
      return false
    } finally {
      setSavingBulk(false)
    }
  }, [selectedIds, loadItems])

  const bulkDeleteItems = useCallback(async () => {
    if (selectedIds.length === 0) return false
    if (!window.confirm(`Bạn có chắc muốn xoá ${selectedIds.length} món ăn đã chọn?`)) return false

    setSavingBulk(true)
    try {
      await Promise.all(selectedIds.map((id) => menuApi.deleteItem(id)))
      toast.success(`Đã xoá ${selectedIds.length} món`)
      setSelectedIds([])
      await loadItems()
      await loadStats()
      return true
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xoá hàng loạt')
      return false
    } finally {
      setSavingBulk(false)
    }
  }, [selectedIds, loadItems])

  // ---------------- Thong ke (4 the) ----------------

  const loadStats = useCallback(async () => {
    if (!branchId) return
    setLoadingStats(true)
    try {
      const res = await menuApi.getItemStats(branchId)
      const data = unwrap(res) || {}
      setStats({
        total: data.total ?? 0,
        selling: data.selling ?? 0,
        outOfStock: data.outOfStock ?? 0,
      })
    } catch (err) {
      console.error('Không tải được thống kê thực đơn', err)
    } finally {
      setLoadingStats(false)
    }
  }, [branchId])

  useEffect(() => { loadStats() }, [loadStats])

  return {
    branchId,

    // danh muc
    categories, loadingCategories, savingCategoryId,
    reloadCategories: loadCategories, createCategory, updateCategory, deleteCategory,

    // danh sach mon
    items: visibleItems, rawItemCount: items.length, pageInfo, loadingItems, savingItemId,
    reloadItems: loadItems, goToPage,
    createItem, updateItem, deleteItem, toggleItemStatus,

    // chon nhieu + bulk
    selectedIds, toggleSelect, toggleSelectAllOnPage, clearSelection, savingBulk, bulkUpdateStatus, bulkDeleteItems,

    // thong ke
    stats: { ...stats, categoryCount: categories.length }, loadingStats,
  }
}