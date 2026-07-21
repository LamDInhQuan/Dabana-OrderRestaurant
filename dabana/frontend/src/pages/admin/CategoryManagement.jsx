import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'
import { adminApi } from '../../api'

const TYPE_LABEL = {
  CUISINE_TYPE: 'Loại ẩm thực',
  AMENITY: 'Tiện ích',
  AREA: 'Khu vực',
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading]       = useState(true)
  const [type, setType]             = useState('CUISINE_TYPE')
  const [name, setName]             = useState('')
  const [editing, setEditing]       = useState(null) // {id, categoryType, categoryName}

  const load = () => {
    setLoading(true)
    adminApi.listCategories().then(r => setCategories(r.data || [])).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Vui lòng nhập tên danh mục'); return }
    try {
      if (editing) {
        await adminApi.updateCategory(editing.id, { categoryType: editing.categoryType, categoryName: name })
      } else {
        await adminApi.createCategory({ categoryType: type, categoryName: name })
      }
      toast.success(editing ? 'Đã cập nhật danh mục' : 'Đã thêm danh mục')
      setName(''); setEditing(null)
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Thao tác thất bại') }
  }

  const remove = async (id) => {
    if (!window.confirm('Xoá danh mục này?')) return
    try {
      await adminApi.deleteCategory(id)
      toast.success('Đã xoá danh mục')
      load()
    } catch (err) { toast.error(err.response?.data?.message || 'Không thể xoá (có thể đang được sử dụng)') }
  }

  const grouped = categories.reduce((acc, c) => {
    (acc[c.categoryType] ||= []).push(c)
    return acc
  }, {})

  return (
    <AdminLayout title="Danh mục hệ thống" >
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '.75rem' }}>{editing ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h3>
        <form onSubmit={submit} className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <select value={editing ? editing.categoryType : type}
            onChange={e => editing ? setEditing({ ...editing, categoryType: e.target.value }) : setType(e.target.value)}>
            <option value="CUISINE_TYPE">Loại ẩm thực</option>
            <option value="AMENITY">Tiện ích</option>
            <option value="AREA">Khu vực</option>
          </select>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Tên danh mục..." style={{ flex: 1, minWidth: 180 }} />
          <button className="btn-primary btn-sm" type="submit">{editing ? 'Lưu' : '+ Thêm'}</button>
          {editing && <button type="button" className="btn-outline btn-sm" onClick={() => { setEditing(null); setName('') }}>Huỷ</button>}
        </form>
      </div>

      {loading ? <p style={{ color: 'var(--text-muted)' }}>Đang tải...</p> : (
        <div className="grid-3">
          {['CUISINE_TYPE', 'AMENITY', 'AREA'].map(t => (
            <div key={t} className="card">
              <h4 style={{ fontWeight: 700, marginBottom: '.75rem' }}>{TYPE_LABEL[t]}</h4>
              {(grouped[t] || []).length === 0
                ? <p style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>Chưa có danh mục nào.</p>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                    {grouped[t].map(c => (
                      <div key={c.id} className="flex items-center justify-between" style={{ fontSize: '.88rem' }}>
                        <span>{c.categoryName}</span>
                        <div className="flex gap-2">
                          <button className="btn-outline btn-sm" style={{ padding: '.2rem .6rem' }}
                            onClick={() => { setEditing(c); setName(c.categoryName) }}>Sửa</button>
                          <button className="btn-danger btn-sm" style={{ padding: '.2rem .6rem' }}
                            onClick={() => remove(c.id)}>Xoá</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  )
}
