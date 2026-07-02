import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from '../../components/Navbar'
import { menuApi } from '../../api'

const CATEGORIES = ['Khai vị', 'Món chính', 'Đồ uống', 'Tráng miệng', 'Lẩu & nướng', 'Khác']

const STATUS_BADGE = {
  SELLING: 'badge-green', OUT_OF_STOCK: 'badge-yellow', DISCONTINUED: 'badge-red'
}
const STATUS_LABEL = { SELLING: 'Đang bán', OUT_OF_STOCK: 'Hết món', DISCONTINUED: 'Ngừng bán' }

export default function MenuManager() {
  const { branchId } = useParams()
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal]     = useState(null) // null | 'add' | item (edit)
  const [form, setForm]       = useState({ name: '', category: CATEGORIES[0], price: '', description: '' })

  const load = () => {
    menuApi.getByBranch(branchId).then(r => {
      setItems(r.data || [])
      setLoading(false)
    })
  }
  useEffect(() => { load() }, [branchId])

  const openAdd  = () => { setForm({ name: '', category: CATEGORIES[0], price: '', description: '' }); setModal('add') }
  const openEdit = (item) => { setForm({ name: item.name, category: item.category, price: item.price, description: item.description || '' }); setModal(item) }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.price || Number(form.price) <= 0) { toast.error('Giá phải lớn hơn 0 (EF02)'); return }
    try {
      if (modal === 'add') {
        await menuApi.create({ ...form, price: Number(form.price), branchId: Number(branchId) })
        toast.success('Đã thêm món')
      } else {
        await menuApi.update(modal.id, { ...form, price: Number(form.price) })
        toast.success('Đã cập nhật món')
      }
      setModal(null)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi lưu món')
    }
  }

  const cycleStatus = async (item) => {
    const next = { SELLING: 'OUT_OF_STOCK', OUT_OF_STOCK: 'DISCONTINUED', DISCONTINUED: 'SELLING' }[item.status]
    // B06 BR03: không xóa cứng món đã được đặt trước, chỉ đổi status
    try {
      await menuApi.updateStatus(item.id, next)
      toast.success(`Đã chuyển sang: ${STATUS_LABEL[next]}`)
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật')
    }
  }

  return (
    <>
      <Navbar />
      <div className="page-container" style={{ padding: '2rem 1rem' }}>
        <div className="flex items-center justify-between mb-4">
          <h1 style={{ fontWeight: 800, fontSize: '1.3rem' }}>Quản lý thực đơn</h1>
          <button className="btn-primary" onClick={openAdd}>+ Thêm món</button>
        </div>

        {loading ? <p style={{ color: 'var(--text-muted)' }}>Đang tải...</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {items.map(item => (
              <div key={item.id} className="card flex items-center justify-between" style={{ padding: '1rem', border: '1px solid var(--border)', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-2" style={{ marginBottom: '.25rem' }}>
                    <h3 style={{ fontWeight: 700 }}>{item.name}</h3>
                    <span className={`badge ${STATUS_BADGE[item.status]}`}>{STATUS_LABEL[item.status]}</span>
                  </div>
                  <p style={{ fontSize: '.82rem', color: 'var(--text-muted)' }}>{item.category}</p>
                  <p style={{ color: 'var(--brand)', fontWeight: 700, fontSize: '.95rem', marginTop: '.25rem' }}>
                    {Number(item.price).toLocaleString('vi-VN')}₫
                  </p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-outline btn-sm" onClick={() => openEdit(item)}>✏️ Sửa</button>
                  <button className="btn-outline btn-sm" onClick={() => cycleStatus(item)}>🔄 Đổi trạng thái</button>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                Chưa có món nào. Nhấn "Thêm món" để bắt đầu.
              </div>
            )}
          </div>
        )}

        {/* Modal thêm/sửa */}
        {modal !== null && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 200,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card" style={{ width: '100%', maxWidth: 420, margin: '1rem' }}>
              <h2 style={{ fontWeight: 700, marginBottom: '1rem' }}>
                {modal === 'add' ? 'Thêm món mới' : 'Sửa thông tin món'}
              </h2>
              <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
                <div>
                  <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Tên món</label>
                  <input value={form.name} onChange={e => setForm(p => ({...p,name:e.target.value}))} required />
                </div>
                <div>
                  <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Danh mục</label>
                  <select value={form.category} onChange={e => setForm(p => ({...p,category:e.target.value}))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Giá (₫)</label>
                  <input type="number" min="1000" step="1000" value={form.price}
                    onChange={e => setForm(p => ({...p,price:e.target.value}))} required />
                </div>
                <div>
                  <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Mô tả (tùy chọn)</label>
                  <textarea rows={2} value={form.description} onChange={e => setForm(p => ({...p,description:e.target.value}))} />
                </div>
                <div className="flex gap-3">
                  <button type="button" className="btn-outline" style={{ flex: 1 }} onClick={() => setModal(null)}>Huỷ</button>
                  <button type="submit" className="btn-primary" style={{ flex: 2 }}>Lưu</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
