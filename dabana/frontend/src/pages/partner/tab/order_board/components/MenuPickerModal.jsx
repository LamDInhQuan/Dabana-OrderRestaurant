import { useState, useEffect, useMemo } from 'react'
import { menuApi } from '../../../../../api'
import { formatMoney } from './statusMeta'
import { resizedImageUrl, IMAGE_PRESETS } from '../../menu/utils/imageProxy'

const SORT_OPTIONS = [
  { value: 'default', label: 'Mặc định' },
  { value: 'name_asc', label: 'Tên A-Z' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
]

const PRICE_RANGES = [
  { value: 'ALL', label: 'Khoảng giá', min: null, max: null },
  { value: 'UNDER_100K', label: 'Dưới 100.000đ', min: null, max: 100000 },
  { value: 'FROM_100K_300K', label: '100.000đ - 300.000đ', min: 100000, max: 300000 },
  { value: 'OVER_300K', label: 'Trên 300.000đ', min: 300000, max: null },
]

/**
 * Modal "Thuc don" dung chung cho luong Them mon (Tab Goi mon, nhan vien).
 * Thay the <select> phang truoc day bang giao dien duyet/tim/loc mon theo
 * danh muc, kem gio mon truoc khi xac nhan them vao don - dung theo wireframe
 * nguoi dung cung cap (trang "Thuc don" cua luong dat ban truoc online).
 *
 * Component nay CHI lo phan chon mon + gio mon (UI/state thuan tuy). Viec goi
 * API them tung dong vao don (extraOrderApi.addItem) do component cha
 * (TableDetailDrawer) dam nhiem qua prop onConfirm, vi cha moi biet bookingId
 * va cach xu ly loi/toast/reload theo dung quy uoc dang dung.
 */
export default function MenuPickerModal({ open, branchId, tableName, onClose, onConfirm }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeCategoryId, setActiveCategoryId] = useState('ALL')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('default')
  const [priceRange, setPriceRange] = useState('ALL')
  const [cart, setCart] = useState({}) // { [menuItemId]: { id, name, price, quantity, category } }
  const [viewMode, setViewMode] = useState('browse') // 'browse' | 'cart'
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open || !branchId) return
    setLoading(true)
    setActiveCategoryId('ALL')
    setSearch('')
    setSortBy('default')
    setPriceRange('ALL')
    setCart({})
    setViewMode('browse')
    menuApi.getByBranch(branchId)
      .then((res) => {
        // BE boc payload trong ApiResponse { success, message, data } - khop
        // dung quy uoc unwrap() cua useOrderBoardState.js, tranh lap lai loi
        // gia dinh res.data la mang truc tiep nhu ban <select> cu.
        const payload = res.data?.data ?? res.data
        setCategories(Array.isArray(payload) ? payload : [])
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false))
  }, [open, branchId])

  const allItems = useMemo(() => {
    return categories.flatMap((cat) => (cat.items || [])
      .filter((it) => it.status === 'SELLING')
      .map((it) => ({
        id: it.id,
        name: it.itemName,
        price: Number(it.price),
        imageUrl: it.imageUrl,
        categoryId: cat.id,
        categoryName: cat.categoryName,
      })))
  }, [categories])

  const visibleItems = useMemo(() => {
    const range = PRICE_RANGES.find((r) => r.value === priceRange)
    const keyword = search.trim().toLowerCase()
    let result = allItems.filter((it) => {
      if (activeCategoryId !== 'ALL' && it.categoryId !== activeCategoryId) return false
      if (keyword && !it.name.toLowerCase().includes(keyword)) return false
      if (range?.min != null && it.price < range.min) return false
      if (range?.max != null && it.price >= range.max) return false
      return true
    })
    if (sortBy === 'name_asc') result = [...result].sort((a, b) => a.name.localeCompare(b.name))
    if (sortBy === 'price_asc') result = [...result].sort((a, b) => a.price - b.price)
    if (sortBy === 'price_desc') result = [...result].sort((a, b) => b.price - a.price)
    return result
  }, [allItems, activeCategoryId, search, priceRange, sortBy])

  const cartLines = Object.values(cart)
  const cartCount = cartLines.reduce((sum, l) => sum + l.quantity, 0)
  const cartTotal = cartLines.reduce((sum, l) => sum + l.quantity * l.price, 0)

  if (!open) return null

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev[item.id]
      return {
        ...prev,
        [item.id]: existing
          ? { ...existing, quantity: existing.quantity + 1 }
          : { id: item.id, name: item.name, price: item.price, quantity: 1 },
      }
    })
  }

  const changeCartQty = (itemId, nextQty) => {
    setCart((prev) => {
      if (nextQty < 1) {
        const { [itemId]: _removed, ...rest } = prev
        return rest
      }
      return { ...prev, [itemId]: { ...prev[itemId], quantity: nextQty } }
    })
  }

  const removeFromCart = (itemId) => {
    setCart((prev) => {
      const { [itemId]: _removed, ...rest } = prev
      return rest
    })
  }

  const handleConfirm = async () => {
    if (cartLines.length === 0) return
    setSubmitting(true)
    try {
      await onConfirm?.(cartLines)
      onClose?.()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{
          width: '100%', maxWidth: 960, height: '85vh', maxHeight: 720,
          display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0,
        }}
      >
        {/* Header */}
        <div style={{ padding: '1.1rem 1.4rem', borderBottom: '1px solid #E8DECE', flexShrink: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 style={{ fontWeight: 800, fontSize: '1.15rem' }}>Thực đơn</h2>
              <p style={{ fontSize: '.8rem', color: '#8A6E57' }}>
                {tableName ? `Chọn món cho ${tableName}` : 'Chọn món để thêm vào đơn'}
              </p>
            </div>
            <button className="btn-outline btn-sm" onClick={onClose}>✕ Đóng</button>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* Sidebar danh muc */}
          <div style={{ width: 190, flexShrink: 0, borderRight: '1px solid #E8DECE', padding: '1rem .75rem', overflowY: 'auto' }}>
            <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: '#8A6E57', padding: '0 .5rem', marginBottom: '.5rem' }}>
              Danh mục món
            </div>
            <CategoryButton active={activeCategoryId === 'ALL'} onClick={() => setActiveCategoryId('ALL')}>
              Tất cả ({allItems.length})
            </CategoryButton>
            {categories.map((cat) => (
              <CategoryButton
                key={cat.id}
                active={activeCategoryId === cat.id}
                onClick={() => setActiveCategoryId(cat.id)}
              >
                {cat.categoryName} ({(cat.items || []).filter((it) => it.status === 'SELLING').length})
              </CategoryButton>
            ))}
          </div>

          {/* Main content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {viewMode === 'browse' ? (
              <>
                {/* Toolbar: tim kiem / sap xep / loc gia / xem gio mon */}
                <div className="flex gap-2 items-center" style={{ padding: '1rem 1.25rem .75rem', flexWrap: 'wrap', flexShrink: 0 }}>
                  <input
                    type="text"
                    placeholder="Tìm món ăn..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ flex: '1 1 200px' }}
                  />
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ flex: '0 0 150px' }}>
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} style={{ flex: '0 0 170px' }}>
                    {PRICE_RANGES.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <button className="btn-outline btn-sm" onClick={() => setViewMode('cart')} disabled={cartCount === 0}>
                    🛒 Xem giỏ món{cartCount > 0 ? ` (${cartCount})` : ''}
                  </button>
                </div>

                {/* Luoi mon */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '.25rem 1.25rem 1.25rem' }}>
                  {loading ? (
                    <p style={{ color: '#8A6E57', textAlign: 'center', padding: '2rem 0' }}>Đang tải thực đơn...</p>
                  ) : visibleItems.length === 0 ? (
                    <p style={{ color: '#8A6E57', textAlign: 'center', padding: '2rem 0' }}>Không tìm thấy món phù hợp.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: '.9rem', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))' }}>
                      {visibleItems.map((item) => {
                        const inCartQty = cart[item.id]?.quantity || 0
                        return (
                          <div key={item.id} className="card" style={{ padding: '.75rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                            {item.imageUrl
                              ? <img
                                  src={resizedImageUrl(item.imageUrl, IMAGE_PRESETS.card)}
                                  alt={item.name}
                                  width={320}
                                  height={240}
                                  loading="lazy"
                                  decoding="async"
                                  style={{ width: '100%', aspectRatio: '4 / 3', borderRadius: 8, objectFit: 'cover', background: '#E8E2D8' }}
                                  onError={(e) => { e.currentTarget.src = item.imageUrl }} // fallback neu proxy loi
                                />
                              : <div style={{ width: '100%', aspectRatio: '4 / 3', borderRadius: 8, background: '#E8E2D8' }} />}
                            <div style={{ fontWeight: 600, fontSize: '.85rem', lineHeight: 1.3 }}>{item.name}</div>
                            <div style={{ fontWeight: 700, color: '#8B6914', fontSize: '.85rem' }}>{formatMoney(item.price)}</div>
                            {inCartQty === 0 ? (
                              <button className="btn-outline btn-sm" onClick={() => addToCart(item)}>+ Thêm món</button>
                            ) : (
                              <div className="flex items-center justify-between">
                                <button className="btn-outline btn-sm" style={{ padding: '.15rem .5rem' }}
                                  onClick={() => changeCartQty(item.id, inCartQty - 1)}>−</button>
                                <span style={{ fontWeight: 700 }}>{inCartQty}</span>
                                <button className="btn-outline btn-sm" style={{ padding: '.15rem .5rem' }}
                                  onClick={() => changeCartQty(item.id, inCartQty + 1)}>+</button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Gio mon */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: '.75rem' }}>Giỏ món</h3>
                  {cartLines.length === 0 ? (
                    <p style={{ color: '#8A6E57', textAlign: 'center', padding: '2rem 0' }}>Giỏ món đang trống.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                      {cartLines.map((line) => (
                        <div key={line.id} className="card" style={{ padding: '.7rem .85rem' }}>
                          <div className="flex items-center justify-between" style={{ gap: '.5rem' }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: '.86rem' }}>{line.name}</div>
                              <div style={{ fontSize: '.76rem', color: '#8A6E57' }}>{formatMoney(line.price)} × {line.quantity}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', flexShrink: 0 }}>
                              <button className="btn-outline btn-sm" style={{ padding: '.15rem .5rem' }}
                                onClick={() => changeCartQty(line.id, line.quantity - 1)}>−</button>
                              <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 700 }}>{line.quantity}</span>
                              <button className="btn-outline btn-sm" style={{ padding: '.15rem .5rem' }}
                                onClick={() => changeCartQty(line.id, line.quantity + 1)}>+</button>
                              <button className="btn-outline btn-sm" style={{ padding: '.15rem .5rem', color: '#EF4444', borderColor: '#EF444455' }}
                                onClick={() => removeFromCart(line.id)}>🗑</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ padding: '.9rem 1.25rem', borderTop: '1px solid #E8DECE', flexShrink: 0 }}>
                  <button className="btn-outline btn-sm" onClick={() => setViewMode('browse')}>← Tiếp tục chọn món</button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer: xac nhan */}
        <div style={{ padding: '1rem 1.4rem', borderTop: '1px solid #E8DECE', flexShrink: 0 }}>
          <div className="flex items-center justify-between">
            <span style={{ fontSize: '.85rem', color: '#8A6E57' }}>
              {cartCount > 0 ? `${cartCount} món · ${formatMoney(cartTotal)}` : 'Chưa chọn món nào'}
            </span>
            <button className="btn-primary btn-sm" disabled={cartCount === 0 || submitting} onClick={handleConfirm}>
              {submitting ? 'Đang thêm...' : `✅ Xác nhận thêm món${cartCount > 0 ? ` (${cartCount})` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CategoryButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block', width: '100%', textAlign: 'left', padding: '.5rem .6rem',
        borderRadius: 8, border: 'none', marginBottom: '.2rem', cursor: 'pointer',
        fontSize: '.83rem', fontWeight: active ? 700 : 500,
        background: active ? 'rgba(201,168,76,.15)' : 'transparent',
        color: active ? '#8B6914' : '#3D3226',
      }}
    >
      {children}
    </button>
  )
}