import { useState, useEffect, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import { menuApi } from '../../../../../api'

/**
 * menuApi (src/api/index.js) co cac ham sau, map 1-1 voi MenuController:
 *   getCategories(branchId)                          GET  /api/menu/branches/{branchId}/categories
 *   createCategory(payload)                          POST /api/menu/categories
 *   updateCategory(categoryId, payload)               PUT  /api/menu/categories/{categoryId}
 *   deleteCategory(categoryId)                     DELETE /api/menu/categories/{categoryId}
 *   searchItems(params)                              GET  /api/menu/items/search
 *   createItem(payload)                              POST /api/menu/items
 *   updateItem(itemId, payload)                       PUT  /api/menu/items/{itemId}
 *   deleteItem(itemId)                              DELETE /api/menu/items/{itemId}
 *   updateItemStatus(itemId, status)                PATCH /api/menu/items/{itemId}/status
 *   bulkUpdateItemStatus(itemIds, status)            PATCH /api/menu/items/bulk-status
 */

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
      // Neu dang loc theo danh muc vua xoa thi bo loc do di
      setFilters((prev) => prev.categoryId === categoryId ? { ...prev, categoryId: null } : prev)
      return true
    } catch (err) {
      // BE co the chan xoa neu danh muc con mon (MENU_ITEM_ALREADY_EXISTS-kieu rang buoc), giu nguyen message tu BE
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
      setSelectedIds([]) // doi trang/loc -> bo chon cu de tranh bulk nham sang item khong con hien thi
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không tải được danh sách món')
    } finally {
      setLoadingItems(false)
    }
  }, [branchId, buildSearchParams])

  useEffect(() => { loadItems({ page: 0 }) }, [branchId, filters]) // eslint-disable-line react-hooks/exhaustive-deps

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Dung cho form filter co nut "Loc" rieng: gop nhieu field (keyword, categoryId,
  // status, priceMin, priceMax) vao 1 lan setState -> chi 1 lan re-fetch, thay vi
  // goi setFilter() tung field roi moi field kich hoat 1 lan render/fetch.
  const applyFilters = useCallback((patch) => {
    setFilters((prev) => ({ ...prev, ...patch }))
  }, [])

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), [])

  const goToPage = useCallback((page) => { loadItems({ page }) }, [loadItems])

  // Khoang gia: BE /items/search chua ho tro minPrice/maxPrice nen loc tam o phia FE
  // tren du lieu cua TRANG HIEN TAI. Luu y: cach nay khong chinh xac 100% khi ket hop
  // voi phan trang server (vi du trang 1 co the het mon phu hop du con o trang 2).
  // Neu can loc gia chinh xac, nen bo sung minPrice/maxPrice vao MenuItemSearchRequest o BE.
  const visibleItems = useMemo(() => {
    if (filters.priceMin == null && filters.priceMax == null) return items
    return items.filter((it) => {
      const price = Number(it.price)
      if (filters.priceMin != null && price < filters.priceMin) return false
      if (filters.priceMax != null && price > filters.priceMax) return false
      return true
    })
  }, [items, filters.priceMin, filters.priceMax])

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadItems])

  const deleteItem = useCallback(async (itemId) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadItems])

  // Nut "An" tren tung dong: chi dao SELLING <-> OUT_OF_STOCK (tam an / hien lai),
  // KHONG dung de chuyen sang DISCONTINUED (ngung ban han che qua form sua mon).
  const toggleItemStatus = useCallback(async (item) => {
    const next = item.status === MENU_ITEM_STATUS.SELLING
      ? MENU_ITEM_STATUS.OUT_OF_STOCK
      : MENU_ITEM_STATUS.SELLING
    setSavingItemId(item.id)
    // Cap nhat lac quan tren danh sach dang hien de UI phan hoi ngay
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  // ---------------- Chon nhieu + bulk status ----------------

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds, loadItems])

  // ---------------- Thong ke (4 the) ----------------
  // Khong co API tong hop rieng nen goi searchItems voi size=1 chi de doc totalElements,
  // gon nhe hon la tai toan bo danh sach mon ve FE roi dem tay.

  const loadStats = useCallback(async () => {
    if (!branchId) return
    setLoadingStats(true)
    try {
      const [totalRes, sellingRes, outOfStockRes] = await Promise.all([
        menuApi.searchItems({ branchId: Number(branchId), page: 0, size: 1 }),
        menuApi.searchItems({ branchId: Number(branchId), status: MENU_ITEM_STATUS.SELLING, page: 0, size: 1 }),
        menuApi.searchItems({ branchId: Number(branchId), status: MENU_ITEM_STATUS.OUT_OF_STOCK, page: 0, size: 1 }),
      ])
      setStats({
        total: unwrap(totalRes)?.totalElements ?? 0,
        selling: unwrap(sellingRes)?.totalElements ?? 0,
        outOfStock: unwrap(outOfStockRes)?.totalElements ?? 0,
      })
    } catch (err) {
      // Khong show toast cho phan thong ke de tranh spam loi, chi log
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

    // filter
    filters, setFilter, applyFilters, resetFilters,

    // chon nhieu + bulk
    selectedIds, toggleSelect, toggleSelectAllOnPage, clearSelection, savingBulk, bulkUpdateStatus,

    // thong ke
    stats: { ...stats, categoryCount: categories.length }, loadingStats,
  }
}