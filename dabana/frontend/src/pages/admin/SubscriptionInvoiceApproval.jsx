import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'
import { subscriptionApi } from '../../api'

const INVOICE_STATUS_LABEL = { PENDING: 'Chờ thanh toán', PAID: 'Đã thanh toán', OVERDUE: 'Quá hạn', CANCELLED: 'Đã hủy' }
const INVOICE_STATUS_BADGE = { PENDING: 'badge-yellow', PAID: 'badge-green', OVERDUE: 'badge-red', CANCELLED: 'badge-gray' }
const INVOICE_TYPE_LABEL = { INITIAL: 'Đăng ký lần đầu', RENEWAL: 'Gia hạn', UPGRADE: 'Nâng cấp' }
const SUB_STATUS_LABEL = {
  PENDING_PAYMENT: 'Chờ thanh toán lần đầu', ACTIVE: 'Đang hoạt động',
  PAST_DUE: 'Quá hạn - đang ân hạn', EXPIRED: 'Đã hết hạn', CANCELLED: 'Đã hủy',
}

function fmtVnd(n) {
  return Number(n || 0).toLocaleString('vi-VN') + ' đ'
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN')
}

// "Cần xử lý" mặc định lọc PENDING + OVERDUE ở tầng API để đỡ tải dữ liệu thừa;
// "Tất cả" gọi lại không kèm status để BE trả về toàn bộ lịch sử.
const FILTERS = [
  { id: 'PENDING_OVERDUE', label: 'Cần xử lý', statuses: ['PENDING', 'OVERDUE'] },
  { id: 'ALL', label: 'Tất cả', statuses: [] },
]

export default function SubscriptionInvoiceApproval() {
  const [filter, setFilter] = useState('PENDING_OVERDUE')
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirmingId, setConfirmingId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    const statuses = FILTERS.find(f => f.id === filter)?.statuses || []
    subscriptionApi.adminListInvoices(statuses)
      .then(r => setInvoices(r.data?.data || []))
      .catch(() => toast.error('Không thể tải danh sách hóa đơn'))
      .finally(() => setLoading(false))
  }, [filter])

  useEffect(() => { load() }, [load])

  const confirmPaid = async (invoice) => {
    if (!window.confirm(
      `Xác nhận ĐÃ NHẬN được ${fmtVnd(invoice.amount)} từ "${invoice.restaurantName}" cho hóa đơn ${INVOICE_TYPE_LABEL[invoice.invoiceType] || invoice.invoiceType} gói "${invoice.planSnapshotName}"?\n\n` +
      `Hành động này sẽ kích hoạt/gia hạn gói ngay lập tức và không thể hoàn tác.`
    )) return

    setConfirmingId(invoice.id)
    try {
      await subscriptionApi.adminMarkInvoicePaid(invoice.id)
      toast.success('Đã xác nhận thanh toán, gói dịch vụ đã được kích hoạt.')
      load()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xác nhận thanh toán')
    } finally {
      setConfirmingId(null)
    }
  }

  return (
    <AdminLayout
      title="Xác nhận thanh toán phí nền tảng"
      subtitle="Hóa đơn thường được tự động xác nhận qua webhook payOS. Dùng trang này để xác nhận thủ công khi webhook bị lỗi/chậm, hoặc khi nhà hàng chuyển khoản trực tiếp ngoài payOS."
    >
      <div className="flex gap-2" style={{ marginBottom: '1.5rem' }}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            className={filter === f.id ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? <p style={{ color: 'var(--text-muted)' }}>Đang tải...</p> : (
        <div className="card">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1.5px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '.6rem .5rem' }}>Nhà hàng</th>
                  <th style={{ padding: '.6rem .5rem' }}>Loại</th>
                  <th style={{ padding: '.6rem .5rem' }}>Gói</th>
                  <th style={{ padding: '.6rem .5rem' }}>Số tiền</th>
                  <th style={{ padding: '.6rem .5rem' }}>Kỳ áp dụng</th>
                  <th style={{ padding: '.6rem .5rem' }}>Hạn thanh toán</th>
                  <th style={{ padding: '.6rem .5rem' }}>Trạng thái gói</th>
                  <th style={{ padding: '.6rem .5rem' }}>Trạng thái HĐ</th>
                  <th style={{ padding: '.6rem .5rem' }}></th>
                </tr>
              </thead>
              <tbody>
                {invoices.length === 0 ? (
                  <tr><td colSpan={9} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {filter === 'PENDING_OVERDUE' ? 'Không có hóa đơn nào cần xử lý.' : 'Chưa có hóa đơn nào.'}
                  </td></tr>
                ) : invoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '.6rem .5rem', fontWeight: 600 }}>{inv.restaurantName}</td>
                    <td style={{ padding: '.6rem .5rem' }}>{INVOICE_TYPE_LABEL[inv.invoiceType] || inv.invoiceType}</td>
                    <td style={{ padding: '.6rem .5rem' }}>{inv.planSnapshotName}</td>
                    <td style={{ padding: '.6rem .5rem', fontWeight: 600 }}>{fmtVnd(inv.amount)}</td>
                    <td style={{ padding: '.6rem .5rem', color: 'var(--text-muted)' }}>{fmtDate(inv.periodStart)} → {fmtDate(inv.periodEnd)}</td>
                    <td style={{ padding: '.6rem .5rem', color: inv.status === 'OVERDUE' ? '#991B1B' : 'var(--text-muted)', fontWeight: inv.status === 'OVERDUE' ? 700 : 400 }}>
                      {fmtDate(inv.dueDate)}
                    </td>
                    <td style={{ padding: '.6rem .5rem', fontSize: '.78rem', color: 'var(--text-muted)' }}>
                      {SUB_STATUS_LABEL[inv.subscriptionStatus] || inv.subscriptionStatus}
                    </td>
                    <td style={{ padding: '.6rem .5rem' }}>
                      <span className={`badge ${INVOICE_STATUS_BADGE[inv.status]}`}>{INVOICE_STATUS_LABEL[inv.status] || inv.status}</span>
                    </td>
                    <td style={{ padding: '.6rem .5rem' }}>
                      {(inv.status === 'PENDING' || inv.status === 'OVERDUE') && (
                        <button
                          className="btn-primary btn-sm"
                          disabled={confirmingId === inv.id}
                          onClick={() => confirmPaid(inv)}
                        >
                          {confirmingId === inv.id ? 'Đang xử lý...' : '✓ Xác nhận đã thu tiền'}
                        </button>
                      )}
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
