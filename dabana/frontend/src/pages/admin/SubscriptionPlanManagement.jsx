import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'
import { subscriptionApi } from '../../api'

const STATUS_LABEL = { ACTIVE: 'Đang mở bán', INACTIVE: 'Ngừng bán' }
const STATUS_BADGE = { ACTIVE: 'badge-green', INACTIVE: 'badge-gray' }
const BILLING_CYCLE_LABEL = { MONTHLY: 'Hàng tháng', QUARTERLY: 'Hàng quý', YEARLY: 'Hàng năm' }

const EMPTY_FORM = {
  planCode: '', name: '', price: '', billingCycle: 'MONTHLY',
  maxBranches: '', displayOrder: 0, description: '', status: 'ACTIVE',
}

function fmtVnd(n) {
  return Number(n || 0).toLocaleString('vi-VN') + ' đ'
}

export default function SubscriptionPlanManagement() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null) // null = đang tạo mới
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    subscriptionApi.adminListAllPlans()
      .then(r => setPlans(r.data?.data || []))
      .catch(() => toast.error('Không thể tải danh sách gói dịch vụ'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const startEdit = (plan) => {
    setEditingId(plan.id)
    setForm({
      planCode: plan.planCode, name: plan.name, price: plan.price,
      billingCycle: plan.billingCycle, maxBranches: plan.maxBranches,
      displayOrder: plan.displayOrder, description: plan.description || '', status: plan.status,
    })
  }
  const resetForm = () => { setEditingId(null); setForm(EMPTY_FORM) }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.price || !form.maxBranches) {
      toast.error('Vui lòng nhập đủ tên gói, giá và số chi nhánh tối đa'); return
    }
    if (!editingId && !form.planCode.trim()) {
      toast.error('Vui lòng nhập mã gói (planCode)'); return
    }
    setSaving(true)
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        maxBranches: Number(form.maxBranches),
        displayOrder: Number(form.displayOrder) || 0,
      }
      if (editingId) {
        // planCode/billingCycle không sửa được sau khi tạo (tránh sai lệch với các
        // subscription đã snapshot theo billingCycle lúc đăng ký) - chỉ gửi các field cho phép.
        const { planCode, billingCycle, ...updatePayload } = payload
        await subscriptionApi.adminUpdatePlan(editingId, updatePayload)
        toast.success('Đã cập nhật gói dịch vụ')
      } else {
        await subscriptionApi.adminCreatePlan(payload)
        toast.success('Đã tạo gói dịch vụ mới')
      }
      resetForm()
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Thao tác thất bại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout title="Gói dịch vụ nền tảng" subtitle="Cấu hình các gói thu phí theo số chi nhánh cho nhà hàng đối tác">
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>{editingId ? 'Sửa gói dịch vụ' : 'Thêm gói dịch vụ mới'}</h3>
        <form onSubmit={submit} className="grid-2" style={{ gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>
              Mã gói (planCode) {editingId && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>— không sửa được</span>}
            </label>
            <input value={form.planCode} disabled={!!editingId}
              onChange={e => setForm(f => ({ ...f, planCode: e.target.value.toUpperCase() }))}
              placeholder="VD: BASIC, STANDARD, PRO" />
          </div>
          <div>
            <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>Tên gói</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Gói Tiêu Chuẩn" />
          </div>
          <div>
            <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>Giá / kỳ (VNĐ)</label>
            <input type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>
              Chu kỳ thanh toán {editingId && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>— không sửa được</span>}
            </label>
            <select value={form.billingCycle} disabled={!!editingId}
              onChange={e => setForm(f => ({ ...f, billingCycle: e.target.value }))}>
              <option value="MONTHLY">Hàng tháng</option>
              <option value="QUARTERLY">Hàng quý</option>
              <option value="YEARLY">Hàng năm</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>Số chi nhánh tối đa</label>
            <input type="number" min="1" value={form.maxBranches} onChange={e => setForm(f => ({ ...f, maxBranches: e.target.value }))}
              placeholder="Dùng 999 để coi như không giới hạn" />
          </div>
          <div>
            <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>Thứ tự hiển thị</label>
            <input type="number" min="0" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: e.target.value }))} />
          </div>
          {editingId && (
            <div>
              <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>Trạng thái</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                <option value="ACTIVE">Đang mở bán</option>
                <option value="INACTIVE">Ngừng bán</option>
              </select>
            </div>
          )}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '.8rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>Mô tả</label>
            <textarea rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '.75rem' }}>
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : '+ Tạo gói mới'}
            </button>
            {editingId && <button type="button" className="btn-outline" onClick={resetForm}>Hủy</button>}
          </div>
        </form>
      </div>

      {loading ? <p style={{ color: 'var(--text-muted)' }}>Đang tải...</p> : (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '.6rem .5rem' }}>Mã gói</th>
                  <th style={{ padding: '.6rem .5rem' }}>Tên gói</th>
                  <th style={{ padding: '.6rem .5rem' }}>Giá</th>
                  <th style={{ padding: '.6rem .5rem' }}>Chu kỳ</th>
                  <th style={{ padding: '.6rem .5rem' }}>Số chi nhánh tối đa</th>
                  <th style={{ padding: '.6rem .5rem' }}>Trạng thái</th>
                  <th style={{ padding: '.6rem .5rem' }}></th>
                </tr>
              </thead>
              <tbody>
                {plans.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có gói dịch vụ nào.</td></tr>
                ) : plans.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '.6rem .5rem', fontFamily: 'monospace' }}>{p.planCode}</td>
                    <td style={{ padding: '.6rem .5rem', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '.6rem .5rem' }}>{fmtVnd(p.price)}</td>
                    <td style={{ padding: '.6rem .5rem' }}>{BILLING_CYCLE_LABEL[p.billingCycle] || p.billingCycle}</td>
                    <td style={{ padding: '.6rem .5rem' }}>{p.maxBranches >= 999 ? 'Không giới hạn' : p.maxBranches}</td>
                    <td style={{ padding: '.6rem .5rem' }}><span className={`badge ${STATUS_BADGE[p.status]}`}>{STATUS_LABEL[p.status] || p.status}</span></td>
                    <td style={{ padding: '.6rem .5rem' }}>
                      <button className="btn-outline btn-sm" onClick={() => startEdit(p)}>Sửa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}