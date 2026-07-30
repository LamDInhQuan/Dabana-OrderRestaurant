import { useState, useEffect, useRef, useCallback } from 'react'
import { notificationApi } from '../api'
import toast from 'react-hot-toast'

// B09: nhan/hien thi thong bao in-app (chuong o Navbar) - danh sach, dem chua
// doc, danh dau da doc tung cai/tat ca. Poll unread-count dinh ky vi he thong
// chua co WebSocket rieng cho kenh nay.

const TYPE_LABEL = {
  BOOKING_CONFIRMED: 'Đặt bàn thành công',
  BOOKING_REMINDER: 'Nhắc lịch hẹn',
  BOOKING_CANCELLED: 'Hủy đặt bàn',
  NO_SHOW_WARNING: 'Không đến (no-show)',
  WAITLIST_INVITED: 'Mời từ hàng chờ',
  REVIEW_INVITATION: 'Mời đánh giá',
  PARTNER_APPROVED: 'Hồ sơ được duyệt',
  PARTNER_REJECTED: 'Hồ sơ bị từ chối',
  SUB_REGISTERED: 'Đăng ký dịch vụ',
  SUB_RENEWAL_DUE: 'Đến hạn gia hạn nền tảng',
  SUB_PAST_DUE: 'Quá hạn thanh toán nền tảng',
  SUB_EXPIRED_SUSPEND: 'Tạm ngưng chi nhánh (hết hạn)',
  SUB_PAY_CONFIRMED: 'Thanh toán dịch vụ thành công',
  SUB_DOWN_SUSPEND: 'Tạm ngưng chi nhánh (hạ cấp)',
  PAYMENT_SUCCESS: 'Thanh toán thành công',
  PAYMENT_FAILED: 'Thanh toán thất bại',
}

const TYPE_DOT = {
  BOOKING_CONFIRMED: '#166534',
  BOOKING_REMINDER: 'var(--gold-dark)',
  BOOKING_CANCELLED: 'var(--accent)',
  NO_SHOW_WARNING: 'var(--accent)',
  WAITLIST_INVITED: 'var(--gold-dark)',
  REVIEW_INVITATION: '#1E40AF',
  PARTNER_APPROVED: '#166534',
  PARTNER_REJECTED: 'var(--accent)',
  SUB_REGISTERED: '#1E40AF',
  SUB_RENEWAL_DUE: 'var(--gold-dark)',
  SUB_PAST_DUE: 'var(--accent)',
  SUB_EXPIRED_SUSPEND: 'var(--accent)',
  SUB_PAY_CONFIRMED: '#166534',
  SUB_DOWN_SUSPEND: 'var(--accent)',
  PAYMENT_SUCCESS: '#166534',
  PAYMENT_FAILED: 'var(--accent)',
}

function formatRelativeTime(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'Vừa xong'
  if (diffMin < 60) return `${diffMin} phút trước`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} giờ trước`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `${diffDay} ngày trước`
  return date.toLocaleDateString('vi-VN')
}

export default function NotificationBell({ color = 'var(--brown)' }) {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const wrapperRef = useRef(null)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationApi.getUnreadCount()
      const data = res.data?.data || res.data || {}
      setUnreadCount(data.count || 0)
    } catch {
      // im lang neu loi - khong lam phien nguoi dung voi toast cho polling ngam
    }
  }, [])

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    try {
      const res = await notificationApi.getHistory({ page: 0, size: 15 })
      const data = res.data?.data || res.data || {}
      setItems(data.content || [])
    } catch {
      toast.error('Không tải được danh sách thông báo')
    } finally {
      setLoading(false)
    }
  }, [])

  // Poll so luong chua doc moi 30 giay, ke ca khi dropdown dang dong
  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30_000)
    return () => clearInterval(interval)
  }, [fetchUnreadCount])

  // Dong dropdown khi bam ra ngoai
  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleToggle = () => {
    const next = !open
    setOpen(next)
    if (next) fetchHistory()
  }

  const handleItemClick = async (notif) => {
    if (notif.readByUser) return
    // Cap nhat lac quan truoc, roi goi API - tra nghiem muot hon
    setItems((prev) => prev.map((n) => (n.id === notif.id ? { ...n, readByUser: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
    try {
      await notificationApi.markAsRead(notif.id)
    } catch {
      toast.error('Không đánh dấu được thông báo là đã đọc')
    }
  }

  const handleMarkAllRead = async () => {
    const hadUnread = items.some((n) => !n.readByUser)
    if (!hadUnread) return
    setItems((prev) => prev.map((n) => ({ ...n, readByUser: true })))
    setUnreadCount(0)
    try {
      await notificationApi.markAllAsRead()
    } catch {
      toast.error('Không đánh dấu được tất cả là đã đọc')
    }
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <button
        onClick={handleToggle}
        aria-label="Thông báo"
        style={{
          position: 'relative',
          background: 'transparent',
          border: 'none',
          padding: '.5rem',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'background .2s',
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(201,168,76,.14)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
      >
        <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: 2, right: 2,
            minWidth: 16, height: 16, padding: '0 3px',
            background: 'var(--accent)', color: '#fff',
            borderRadius: 8, fontSize: '.62rem', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 10px)', right: 0,
          width: 360, maxWidth: '90vw',
          background: 'var(--white)', borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)', border: '1px solid var(--border)',
          overflow: 'hidden', zIndex: 1000,
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '.9rem 1.1rem', borderBottom: '1px solid var(--border)',
          }}>
            <span style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '1.15rem', fontWeight: 700, color: 'var(--brown)',
            }}>
              Thông báo
            </span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                style={{
                  background: 'transparent', border: 'none', padding: 0,
                  color: 'var(--gold-dark)', fontSize: '.76rem', fontWeight: 600,
                  letterSpacing: '.02em', cursor: 'pointer',
                }}
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* Body */}
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.85rem' }}>
                Đang tải...
              </div>
            ) : items.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--muted)', fontSize: '.85rem' }}>
                Chưa có thông báo nào.
              </div>
            ) : (
              items.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  style={{
                    display: 'flex', width: '100%', textAlign: 'left',
                    gap: '.7rem', padding: '.85rem 1.1rem',
                    background: notif.readByUser ? 'transparent' : 'var(--gold-subtle)',
                    border: 'none', borderBottom: '1px solid var(--border)',
                    cursor: notif.readByUser ? 'default' : 'pointer',
                    transition: 'background .15s',
                  }}
                >
                  <span style={{
                    marginTop: 6, width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: notif.readByUser ? 'transparent' : (TYPE_DOT[notif.type] || 'var(--gold-dark)'),
                    border: notif.readByUser ? '1.5px solid var(--border)' : 'none',
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: '.72rem', fontWeight: 700, letterSpacing: '.03em',
                      textTransform: 'uppercase', color: 'var(--gold-dark)', marginBottom: '.2rem',
                    }}>
                      {TYPE_LABEL[notif.type] || notif.type}
                    </div>
                    <div style={{
                      fontSize: '.85rem', color: 'var(--text)', lineHeight: 1.45,
                      fontWeight: notif.readByUser ? 400 : 500,
                    }}>
                      {notif.content}
                    </div>
                    <div style={{ fontSize: '.72rem', color: 'var(--muted)', marginTop: '.3rem' }}>
                      {formatRelativeTime(notif.createdAt)}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}