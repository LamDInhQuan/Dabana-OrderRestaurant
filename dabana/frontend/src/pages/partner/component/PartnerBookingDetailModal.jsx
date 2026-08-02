import React, { useState, useEffect } from 'react'
import {
  X,
  Armchair,
  Users,
  Clock,
  Wallet,
  CalendarPlus,
  ShieldCheck,
  Utensils,
  Phone,
  User,
  Check,
  DoorOpen,
  Ban,
  Receipt,
  Info,
  CreditCard,
  UserCheck
} from 'lucide-react'
import { translateLabel } from '../../../utils/labelTranslator'
import { bookingApi } from '../../../api'

const STATUS_BADGES = {
  CONFIRMED: { label: 'Đã xác nhận', badge: 'badge-green' },
  CHECKED_IN: { label: 'Đang phục vụ', badge: 'badge-blue' },
  PENDING_NO_SHOW: { label: 'Chờ xác nhận đến', badge: 'badge-yellow' },
  COMPLETED: { label: 'Hoàn tất', badge: 'badge-gray' },
  NO_SHOW: { label: 'Không đến', badge: 'badge-red' },
  CANCELLED_BY_CUSTOMER: { label: 'Khách hàng hủy', badge: 'badge-red' },
  CANCELLED_BY_RESTAURANT: { label: 'Nhà hàng hủy', badge: 'badge-red' },
  HOLDING: { label: 'Đang giữ bàn', badge: 'badge-yellow' },
  AWAITING_PAYMENT: { label: 'Chờ thanh toán', badge: 'badge-yellow' },
  EXPIRED: { label: 'Hết hạn', badge: 'badge-gray' },
}

export const getBookingDeposit = (booking) => {
  if (!booking) return 0
  if (booking.depositAmount !== undefined && booking.depositAmount !== null && Number(booking.depositAmount) > 0) {
    return Number(booking.depositAmount)
  }
  if (booking.estimatedTotal !== undefined && booking.estimatedTotal !== null && Number(booking.estimatedTotal) > 0) {
    return Number(booking.estimatedTotal)
  }
  const refundTotal = (Number(booking.refundAmount) || 0) + (Number(booking.penaltyAmount) || 0)
  if (refundTotal > 0) return refundTotal

  const s = booking.policySnapshotDto || booking.policySnapshot
  if (s && s.depositValue !== undefined && s.depositValue !== null) {
    if (s.depositType === 'PER_PERSON') {
      return Number(s.depositValue) * (Number(booking.guestCount) || 1)
    }
    return Number(s.depositValue)
  }
  return 0
}

export default function PartnerBookingDetailModal({
  booking: initialBooking,
  isOpen,
  onClose,
  onAction,
  onOpenCancelModal,
  isNewIncoming = false
}) {
  const [booking, setBooking] = useState(initialBooking)
  const [invoiceData, setInvoiceData] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Fetch dữ liệu chi tiết booking và invoice mới nhất khi mở modal
  useEffect(() => {
    if (!isOpen || !initialBooking?.id) return
    setBooking(initialBooking)
    setInvoiceData(null)

    let isMounted = true
    setLoadingDetail(true)

    // 1. Tải chi tiết booking
    bookingApi.getById(initialBooking.id)
      .then(res => {
        if (isMounted && (res.data?.data || res.data)) {
          setBooking(res.data?.data || res.data)
        }
      })
      .catch(err => {
        console.error('Lỗi tải chi tiết đơn đặt bàn:', err)
      })

    // 2. Tải chi tiết hoá đơn / bảng kê món ăn (bao gồm cả món gọi tại bàn nếu đã check-in / check-out)
    bookingApi.previewInvoice(initialBooking.id)
      .then(res => {
        if (isMounted && (res.data?.data || res.data)) {
          setInvoiceData(res.data?.data || res.data)
        }
      })
      .catch(err => {
        console.log('Không lấy được preview hoá đơn:', err)
      })
      .finally(() => {
        if (isMounted) setLoadingDetail(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, initialBooking?.id])

  if (!isOpen || !booking) return null

  const meta = STATUS_BADGES[booking.status] || {
    label: translateLabel(booking.status),
    badge: 'badge-gray'
  }

  const s = booking.policySnapshotDto || booking.policySnapshot || {}
  const hasPolicy = s && (
    (s.freeCancellationHours !== null && s.freeCancellationHours !== undefined) ||
    (s.freeRefundPercent !== null && s.freeRefundPercent !== undefined)
  )
  const depositAmount = getBookingDeposit(booking)

  // Kiểm tra xem đơn đã checkout hoặc đang phục vụ có invoice data hay không
  const isCompleted = booking.status === 'COMPLETED' || invoiceData?.isPaid
  const isCheckedIn = booking.status === 'CHECKED_IN'
  const hasInvoice = invoiceData && (isCompleted || isCheckedIn)

  // Danh sách các món ăn
  const allInvoiceItems = hasInvoice ? [
    ...(invoiceData.preorderItems || []).map(it => ({ ...it, type: 'PREORDER', label: 'Đặt trước' })),
    ...(invoiceData.extraOrderItems || []).map(it => ({ ...it, type: 'EXTRA', label: 'Gọi tại bàn' }))
  ] : []

  const preOrderItems = booking.items || []
  const totalFoodAmount = preOrderItems.reduce((sum, item) => sum + (Number(item.price || item.snapshotPrice || 0)) * (item.quantity || 1), 0)

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050,
        padding: '1rem'
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 720,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          padding: 0,
          border: '1px solid #e2e8f0',
          animation: 'fadeIn 0.2s ease-out'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER MODAL */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #f8fafc, #ffffff)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', flexWrap: 'wrap' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: '10px',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1rem'
            }}>
              #{booking.id}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                Chi tiết đơn đặt bàn
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginTop: '.2rem' }}>
                <span className={`badge ${meta.badge}`} style={{ fontSize: '.75rem' }}>
                  {meta.label}
                </span>
                {isNewIncoming && (
                  <span style={{ background: '#10b981', color: '#fff', fontSize: '.7rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px' }}>
                    ✨ MỚI TẠO
                  </span>
                )}
                {booking.inGracePeriod && (
                  <span style={{ background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', fontSize: '.7rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <ShieldCheck size={12} /> Ân hạn ({Math.max(1, Math.ceil((booking.gracePeriodRemainingSeconds || 0) / 60))}p)
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: '#f1f5f9',
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              transition: 'background 0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY (SCROLLABLE) */}
        <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* KHỐI 1: THÔNG TIN KHÁCH HÀNG & BÀN ĐẶT */}
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1rem 1.25rem'
          }}>
            <h4 style={{ margin: '0 0 .75rem 0', fontSize: '.9rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '.4rem', textTransform: 'uppercase', letterSpacing: '.03em' }}>
              <User size={16} /> Thông tin khách hàng & Bàn đặt
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '.75rem', fontSize: '.88rem' }}>
              <div>
                <span style={{ color: '#64748b', fontSize: '.8rem', display: 'block' }}>Họ và tên:</span>
                <strong style={{ color: '#0f172a', fontSize: '.95rem' }}>{booking.name || 'Khách hàng'}</strong>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '.8rem', display: 'block' }}>Số điện thoại:</span>
                {booking.contactPhone || booking.phone ? (
                  <a
                    href={`tel:${booking.contactPhone || booking.phone}`}
                    style={{ color: '#0284c7', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Phone size={14} /> {booking.contactPhone || booking.phone}
                  </a>
                ) : (
                  <span style={{ color: '#94a3b8' }}>Chưa cung cấp</span>
                )}
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '.8rem', display: 'block' }}>Thời gian nhận bàn:</span>
                <strong style={{ color: '#b45309', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={14} /> {new Date(booking.reservationTime).toLocaleString('vi-VN')}
                </strong>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '.8rem', display: 'block' }}>Số lượng khách:</span>
                <strong style={{ color: '#0f172a', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={14} /> {booking.guestCount} người
                </strong>
              </div>

              <div>
                <span style={{ color: '#64748b', fontSize: '.8rem', display: 'block' }}>Bàn đã xếp:</span>
                <strong style={{ color: '#166534', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Armchair size={14} /> {
                    booking.tables && booking.tables.length > 0
                      ? booking.tables.map(t => t.tableName || t.name).join(', ')
                      : 'Chưa phân bàn'
                  }
                </strong>
              </div>

              {booking.createdAt && (
                <div>
                  <span style={{ color: '#64748b', fontSize: '.8rem', display: 'block' }}>Ngày tạo đơn:</span>
                  <span style={{ color: '#475569', fontSize: '.85rem' }}>
                    {new Date(booking.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
              )}
            </div>

            {booking.note && (
              <div style={{ marginTop: '.75rem', paddingTop: '.65rem', borderTop: '1px dashed #cbd5e1', fontSize: '.85rem' }}>
                <span style={{ color: '#64748b', fontWeight: 600 }}>Ghi chú từ khách:</span>
                <p style={{ margin: '.2rem 0 0 0', color: '#334155', fontStyle: 'italic', background: '#fff', padding: '.4rem .6rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                  "{booking.note}"
                </p>
              </div>
            )}
          </div>

          {/* KHỐI 2: HOÁ ĐƠN THANH TOÁN (NẾU ĐÃ CHECK-OUT HOẶC ĐANG PHỤC VỤ) HOẶC MÓN ĐẶT TRƯỚC */}
          {hasInvoice ? (
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.85rem', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '.65rem' }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: '.95rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '.45rem', textTransform: 'uppercase', letterSpacing: '.03em' }}>
                    <Receipt size={18} color="#2563eb" /> {isCompleted ? 'Hoá đơn thanh toán (Đã Check-out)' : 'Bảng kê hoá đơn tạm tính'}
                  </h4>
                  {isCompleted && invoiceData.invoiceId && (
                    <span style={{ fontSize: '.8rem', color: '#64748b' }}>
                      Mã hoá đơn: <strong>#{invoiceData.invoiceId}</strong>
                    </span>
                  )}
                </div>
                <span style={{
                  fontSize: '.78rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  background: isCompleted ? '#dcfce7' : '#e0f2fe',
                  color: isCompleted ? '#166534' : '#0369a1'
                }}>
                  {isCompleted ? '✓ ĐÃ THANH TOÁN' : '⚡ ĐANG PHỤC VỤ'}
                </span>
              </div>

              {/* Bảng danh sách món ăn */}
              {allInvoiceItems.length > 0 ? (
                <div style={{ overflowX: 'auto', marginBottom: '1rem' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1.5px solid #e2e8f0', color: '#64748b', textAlign: 'left', fontSize: '.78rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '.5rem 0' }}>Món ăn</th>
                        <th style={{ padding: '.5rem', textAlign: 'center' }}>Loại</th>
                        <th style={{ padding: '.5rem', textAlign: 'right' }}>Đơn giá</th>
                        <th style={{ padding: '.5rem', textAlign: 'center' }}>SL</th>
                        <th style={{ padding: '.5rem 0', textAlign: 'right' }}>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allInvoiceItems.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '.6rem 0', fontWeight: 600, color: '#1e293b' }}>
                            {item.name}
                          </td>
                          <td style={{ padding: '.6rem .5rem', textAlign: 'center' }}>
                            <span style={{
                              fontSize: '.7rem',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: item.type === 'EXTRA' ? '#fef3c7' : '#eff6ff',
                              color: item.type === 'EXTRA' ? '#92400e' : '#1d4ed8'
                            }}>
                              {item.label}
                            </span>
                          </td>
                          <td style={{ padding: '.6rem .5rem', textAlign: 'right', color: '#64748b' }}>
                            {Number(item.unitPrice || 0).toLocaleString('vi-VN')}₫
                          </td>
                          <td style={{ padding: '.6rem .5rem', textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>
                            x{item.quantity || 1}
                          </td>
                          <td style={{ padding: '.6rem 0', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                            {Number(item.lineTotal || 0).toLocaleString('vi-VN')}₫
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '.75rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px', fontSize: '.85rem', marginBottom: '1rem' }}>
                  Không có dữ liệu món ăn trong hoá đơn.
                </div>
              )}

              {/* Tóm tắt tính tiền hoá đơn */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '10px',
                padding: '.85rem 1rem',
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: '.45rem',
                fontSize: '.88rem'
              }}>
                {Number(invoiceData.preorderSubtotal) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Tiền món đặt trước:</span>
                    <span>{Number(invoiceData.preorderSubtotal).toLocaleString('vi-VN')}₫</span>
                  </div>
                )}

                {Number(invoiceData.extraOrderSubtotal) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                    <span>Tiền món gọi tại bàn:</span>
                    <span>{Number(invoiceData.extraOrderSubtotal).toLocaleString('vi-VN')}₫</span>
                  </div>
                )}

                {Number(invoiceData.surcharge) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#b45309' }}>
                    <span>Phụ thu:</span>
                    <span>+{Number(invoiceData.surcharge).toLocaleString('vi-VN')}₫</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#0f172a', borderTop: '1px dashed #cbd5e1', paddingTop: '.4rem' }}>
                  <span>Tổng tiền hoá đơn:</span>
                  <span style={{ fontSize: '.95rem' }}>
                    {Number(invoiceData.grandTotal ?? invoiceData.subtotalBeforeSurcharge ?? 0).toLocaleString('vi-VN')}₫
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#15803d', fontWeight: 600 }}>
                  <span>Đã trừ tiền cọc bàn:</span>
                  <span>-{Number(invoiceData.depositPaid ?? depositAmount).toLocaleString('vi-VN')}₫</span>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1.5px solid #cbd5e1',
                  paddingTop: '.5rem',
                  marginTop: '.2rem'
                }}>
                  <strong style={{ fontSize: '.95rem', color: '#0f172a' }}>
                    {isCompleted ? 'Thực thu tại quầy:' : 'Tạm tính cần thanh toán:'}
                  </strong>
                  <strong style={{ fontSize: '1.2rem', color: isCompleted ? '#2563eb' : '#b45309', fontWeight: 800 }}>
                    {Number(invoiceData.amountCollected ?? invoiceData.amountDueBeforeSurcharge ?? 0).toLocaleString('vi-VN')}₫
                  </strong>
                </div>

                {/* Thông tin phương thức thanh toán & Thu ngân nếu đã thanh toán */}
                {isCompleted && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '.5rem', marginTop: '.5rem', paddingTop: '.5rem', borderTop: '1px solid #e2e8f0', fontSize: '.82rem', color: '#64748b' }}>
                    {invoiceData.paymentMethod && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CreditCard size={14} color="#0284c7" />
                        <span>Phương thức: <strong>{invoiceData.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản QR'}</strong></span>
                      </div>
                    )}
                    {invoiceData.paidAt && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={14} color="#0284c7" />
                        <span>Thanh toán lúc: <strong>{new Date(invoiceData.paidAt).toLocaleString('vi-VN')}</strong></span>
                      </div>
                    )}
                    {invoiceData.collectedByName && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <UserCheck size={14} color="#0284c7" />
                        <span>Thu ngân: <strong>{invoiceData.collectedByName}</strong></span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* KHỐI 2 (DÀNH CHO ĐƠN CHƯA PHỤC VỤ HOẶC ĐÃ HUỶ): MÓN ĂN ĐẶT TRƯỚC */
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1rem 1.25rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.75rem' }}>
                <h4 style={{ margin: 0, fontSize: '.9rem', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '.4rem', textTransform: 'uppercase', letterSpacing: '.03em' }}>
                  <Receipt size={16} /> Món ăn đặt trước (Pre-order)
                </h4>
                {preOrderItems.length > 0 && (
                  <span style={{ fontSize: '.8rem', color: '#64748b' }}>
                    Tổng cộng: <strong>{preOrderItems.length} món</strong>
                  </span>
                )}
              </div>

              {preOrderItems.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '.88rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1.5px solid #e2e8f0', color: '#64748b', textAlign: 'left', fontSize: '.78rem', textTransform: 'uppercase' }}>
                        <th style={{ padding: '.5rem 0' }}>Tên món</th>
                        <th style={{ padding: '.5rem', textAlign: 'right' }}>Đơn giá</th>
                        <th style={{ padding: '.5rem', textAlign: 'center' }}>SL</th>
                        <th style={{ padding: '.5rem 0', textAlign: 'right' }}>Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preOrderItems.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '.6rem 0', fontWeight: 600, color: '#1e293b' }}>
                            {item.name || item.snapshotName}
                          </td>
                          <td style={{ padding: '.6rem .5rem', textAlign: 'right', color: '#64748b' }}>
                            {Number(item.price || item.snapshotPrice || 0).toLocaleString('vi-VN')}₫
                          </td>
                          <td style={{ padding: '.6rem .5rem', textAlign: 'center', fontWeight: 700, color: '#0f172a' }}>
                            x{item.quantity || 1}
                          </td>
                          <td style={{ padding: '.6rem 0', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                            {Number((item.price || item.snapshotPrice || 0) * (item.quantity || 1)).toLocaleString('vi-VN')}₫
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ borderTop: '2px solid #e2e8f0' }}>
                        <td colSpan={3} style={{ padding: '.75rem 0', fontWeight: 700, color: '#334155' }}>
                          Tổng tiền món đặt trước:
                        </td>
                        <td style={{ padding: '.75rem 0', textAlign: 'right', fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
                          {Number(totalFoodAmount).toLocaleString('vi-VN')}₫
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px', fontSize: '.88rem' }}>
                  <Utensils size={20} style={{ display: 'block', margin: '0 auto .35rem auto', color: '#94a3b8' }} />
                  Khách hàng không đặt món trước (Chỉ đặt giữ bàn).
                </div>
              )}
            </div>
          )}

          {/* KHỐI 3: TIỀN CỌC & CHÍNH SÁCH HỦY CỌC */}
          <div style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fef3c7',
            borderRadius: '12px',
            padding: '1rem 1.25rem'
          }}>
            <h4 style={{ margin: '0 0 .75rem 0', fontSize: '.9rem', fontWeight: 700, color: '#92400e', display: 'flex', alignItems: 'center', gap: '.4rem', textTransform: 'uppercase', letterSpacing: '.03em' }}>
              <Wallet size={16} /> Tiền cọc & Chính sách hủy áp dụng
            </h4>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.65rem' }}>
              <span style={{ fontSize: '.9rem', color: '#78350f', fontWeight: 600 }}>Tiền cọc giữ bàn:</span>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#b45309' }}>
                {Number(depositAmount).toLocaleString('vi-VN')}₫
              </span>
            </div>

            {hasPolicy ? (
              <div style={{ fontSize: '.84rem', color: '#92400e', background: '#fef3c7', padding: '.6rem .75rem', borderRadius: '8px', border: '1px solid #fde68a', lineHeight: '1.45' }}>
                <p style={{ margin: '0 0 .25rem 0', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Info size={14} /> Chính sách hủy của chi nhánh:
                </p>
                <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                  <li>Miễn phí hủy trước: <strong>{s.freeCancellationHours} giờ</strong> (Hoàn cọc {s.freeRefundPercent}%)</li>
                  {s.lateRefundPercent !== null && s.lateRefundPercent !== undefined && (
                    <li>Hủy sát giờ hẹn (dưới {s.freeCancellationHours}h): Hoàn cọc {s.lateRefundPercent}%</li>
                  )}
                  {s.noShowRefundPercent !== null && s.noShowRefundPercent !== undefined && (
                    <li>Khách không đến (No-show): Hoàn cọc {s.noShowRefundPercent}%</li>
                  )}
                </ul>
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: '.84rem', color: '#92400e', fontStyle: 'italic' }}>
                Đơn đặt bàn này không áp dụng cấu hình chính sách hủy cọc.
              </p>
            )}

            {/* Thông tin hủy nếu đơn đã ở trạng thái hủy */}
            {(booking.status === 'CANCELLED_BY_CUSTOMER' || booking.status === 'CANCELLED_BY_RESTAURANT' || booking.status === 'NO_SHOW') && (
              <div style={{ marginTop: '.75rem', paddingTop: '.75rem', borderTop: '1px dashed #fcd34d', fontSize: '.85rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                  {booking.refundAmount !== null && booking.refundAmount !== undefined && (
                    <div>
                      <span style={{ color: '#78350f' }}>Tiền hoàn khách: </span>
                      <strong style={{ color: '#166534' }}>{Number(booking.refundAmount).toLocaleString('vi-VN')}₫</strong>
                    </div>
                  )}
                  {booking.penaltyAmount !== null && booking.penaltyAmount !== undefined && (
                    <div>
                      <span style={{ color: '#78350f' }}>Tiền phạt giữ lại: </span>
                      <strong style={{ color: '#991b1b' }}>{Number(booking.penaltyAmount).toLocaleString('vi-VN')}₫</strong>
                    </div>
                  )}
                  {booking.refundStatus && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: '#78350f' }}>Trạng thái hoàn tiền: </span>
                      <strong style={{ color: booking.refundStatus === 'SUCCESS' ? '#166534' : '#d97706' }}>
                        {translateLabel(booking.refundStatus)}
                      </strong>
                    </div>
                  )}
                  {booking.cancelReason && (
                    <div style={{ gridColumn: 'span 2' }}>
                      <span style={{ color: '#78350f' }}>Lý do hủy: </span>
                      <span style={{ color: '#451a03', fontStyle: 'italic' }}>{booking.cancelReason}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* FOOTER ACTIONS */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #f1f5f9',
            backgroundColor: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '.75rem',
            flexWrap: 'wrap'
          }}
        >
          <button
            type="button"
            className="btn-outline btn-sm"
            onClick={onClose}
          >
            Đóng
          </button>

          <div className="flex gap-2">
            {(booking.status === 'CONFIRMED' || booking.status === 'PENDING_NO_SHOW') && (
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={() => {
                  onAction(booking.id, 'check-in')
                  onClose()
                }}
              >
                <Check size={15} style={{ verticalAlign: '-2px' }} /> Check-in
              </button>
            )}

            {booking.status === 'CHECKED_IN' && (
              <button
                type="button"
                className="btn-primary btn-sm"
                onClick={() => {
                  onAction(booking.id, 'check-out')
                  onClose()
                }}
              >
                <DoorOpen size={15} style={{ verticalAlign: '-2px' }} /> Check-out & Hoàn tất
              </button>
            )}

            {booking.status === 'PENDING_NO_SHOW' && (
              <button
                type="button"
                className="btn-danger btn-sm"
                onClick={() => {
                  onAction(booking.id, 'no-show')
                  onClose()
                }}
              >
                <X size={15} style={{ verticalAlign: '-2px' }} /> Chốt No-show
              </button>
            )}

            {booking.status === 'CONFIRMED' && (
              <button
                type="button"
                className="btn-outline btn-sm"
                onClick={() => {
                  onClose()
                  onOpenCancelModal(booking)
                }}
              >
                <Ban size={15} style={{ verticalAlign: '-2px' }} /> Nhà hàng huỷ
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
