// ----------------------------------------------------------------------
// 2. MODAL HỦY ĐẶT BÀN & HOÀN TIỀN (CancelBookingModal)

import { useEffect, useState, useRef } from "react"
import { branchBankAccountApi, bookingApi, refundBankInfoApi } from "../../../api" // Đảm bảo import đúng api client của bạn
import toast from "react-hot-toast"
import { Clock, ScrollText, Landmark, ShieldCheck } from "lucide-react"
import BankSelect from "../../../components/BankSelect"


// ----------------------------------------------------------------------
export default function CancelBookingModal({ booking, onClose, onRefresh }) {
    const [submitting, setSubmitting] = useState(false)
    const [cancelReason, setCancelReason] = useState('Thay đổi kế hoạch cá nhân')
    const [agreed, setAgreed] = useState(false)

    // State cho phần ngân hàng
    const [banks, setBanks] = useState([])
    const [loadingBanks, setLoadingBanks] = useState(true)
    const [selectedBankId, setSelectedBankId] = useState('') // BankCatalog.id, KHÔNG phải BIN
    const [toAccountNumber, setToAccountNumber] = useState('')
    const [accountName, setAccountName] = useState('')

    // State quản lý trạng thái đang chờ hoàn tiền (Polling)
    const [isRefunding, setIsRefunding] = useState(false)
    const [statusMessage, setStatusMessage] = useState('')

    // Dùng useRef để lưu interval ID nhằm clear khi component unmount
    const pollIntervalRef = useRef(null)

    const depositAmount = Number(booking.depositAmount || booking.totalPreOrderAmount || 0)

    useEffect(() => {
        document.body.style.overflow = 'hidden'

        // Gọi API lấy danh sách ngân hàng nếu đơn có tiền cọc
        if (depositAmount > 0) {
            branchBankAccountApi.listBanks()
                .then(res => {
                    const resData = res.data?.data || res.data || []
                    setBanks(resData)
                    setLoadingBanks(false)
                })
                .catch(err => {
                    console.error("Lỗi lấy danh sách ngân hàng:", err);
                    setLoadingBanks(false)
                })
        } else {
            setLoadingBanks(false)
        }

        // Cleanup interval khi đóng modal
        return () => {
            document.body.style.overflow = 'unset'
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
        }
    }, [depositAmount])

    // Hàm bắt đầu Polling kiểm tra trạng thái đơn hàng liên tục
    const startStatusPolling = (bookingId) => {
        setIsRefunding(true)
        setStatusMessage('Đang xử lý yêu cầu hoàn tiền, vui lòng đợi hệ thống cổng thanh toán phản hồi...')

        let pollCount = 0
        const maxPolls = 8 // tối đa 12 giây (mỗi 1.5 giây check 1 lần)

        pollIntervalRef.current = setInterval(async () => {
            pollCount++
            try {
                // Gọi API lấy thông tin chi tiết booking mới nhất
                const res = await bookingApi.getById(bookingId)
                const updatedBooking = res.data?.data || res.data

                const currentStatus = updatedBooking?.status
                const refundStatus = updatedBooking?.refundStatus
                console.log('[CancelBookingModal] poll status =', currentStatus, 'refundStatus =', refundStatus)

                if (refundStatus === 'SUCCESS' || currentStatus === 'REFUNDED') {
                    clearInterval(pollIntervalRef.current)
                    setIsRefunding(false)
                    toast.success('Hủy bàn và hoàn tiền cọc thành công!')
                    if (onRefresh) onRefresh()
                    onClose()
                } else if (refundStatus === 'FAILED' || currentStatus === 'REFUND_FAILED') {
                    clearInterval(pollIntervalRef.current)
                    setIsRefunding(false)
                    setSubmitting(false)
                    toast.error('Giao dịch hoàn tiền chưa thành công. Vui lòng kiểm tra lại!')
                    if (onRefresh) onRefresh()
                    onClose()
                } else if (pollCount >= maxPolls) {
                    // Quá thời gian chờ trực tiếp (PayOS xử lý bất đồng bộ)
                    clearInterval(pollIntervalRef.current)
                    setIsRefunding(false)
                    toast.success('Đã hủy bàn thành công! Hệ thống đang chuyển tiền cọc về tài khoản của bạn.')
                    if (onRefresh) onRefresh()
                    onClose()
                }
            } catch (err) {
                console.error("[CancelBookingModal] Lỗi kiểm tra trạng thái booking (poll):", err)
                if (pollCount >= maxPolls) {
                    clearInterval(pollIntervalRef.current)
                    setIsRefunding(false)
                    if (onRefresh) onRefresh()
                    onClose()
                }
            }
        }, 1500) // Call lại mỗi 1.5 giây
    }

    const now = new Date()
    const reservationTime = new Date(booking.reservationTime)
    const createdAt = booking.createdAt ? new Date(booking.createdAt) : null
    const policy = booking.policySnapshotDto || {}

    const hoursDiff = (reservationTime.getTime() - now.getTime()) / (1000 * 60 * 60)
    const freeCancelLimitHours = policy.freeCancellationHours ?? 24

    const inGracePeriod = Boolean(booking.inGracePeriod)
    const remainingSeconds = Number(booking.gracePeriodRemainingSeconds || 0)
    const remainingMins = Math.max(1, Math.ceil(remainingSeconds / 60))

    let refundPercent = 0
    let conditionText = ''
    let badgeColor = '#EF4444'

    if (inGracePeriod) {
        refundPercent = 100
        conditionText = `Ân hạn Dabana (Còn ~${remainingMins}p)`
        badgeColor = '#059669'
    } else if (hoursDiff <= 0) {
        refundPercent = policy.noShowRefundPercent ?? 0
        conditionText = 'Đã quá giờ hẹn check-in'
    } else if (hoursDiff >= freeCancelLimitHours) {
        refundPercent = policy.freeRefundPercent ?? 100
        conditionText = `Hủy sớm (Trước >= ${freeCancelLimitHours}h check-in)`
        badgeColor = '#10B981'
    } else {
        refundPercent = policy.lateRefundPercent ?? 50
        const roundedHours = Math.max(0, Math.floor(hoursDiff))
        conditionText = `Hủy cận giờ (Còn ~${roundedHours}h tới giờ check-in)`
        badgeColor = '#F59E0B'
    }

    const refundAmount = (depositAmount * refundPercent) / 100
    const penaltyAmount = depositAmount - refundAmount

    const handleConfirmClick = async () => {
        if (!agreed) return

        // Validate thông tin ngân hàng nếu có tiền cọc
        if (depositAmount > 0 && refundPercent > 0 && (!selectedBankId || !toAccountNumber.trim() || !accountName.trim())) {
            toast.error('Vui lòng chọn ngân hàng, nhập số tài khoản và tên chủ tài khoản nhận tiền hoàn!')
            return
        }

        setSubmitting(true)
        let reachedPollingStep = false

        try {
            // 1. Nếu có cọc cần hoàn: lưu tài khoản nhận tiền TRƯỚC khi hủy đơn.
            // PayoutAutoCreateListener ở BE sẽ đọc lại thông tin này khi tự động
            // tạo lệnh chi, nên phải có sẵn trong DB trước khi booking chuyển
            // trạng thái CANCELLED_* (không đi qua nữa).
            if (depositAmount > 0 && refundPercent > 0) {
                console.log('[CancelBookingModal] Bước 1: lưu refund-bank-info...')
                await refundBankInfoApi.createOrUpdate({
                    reservationId: booking.id,
                    bankId: Number(selectedBankId), // BankCatalog.id, KHÔNG phải bin
                    accountNumber: toAccountNumber.trim(),
                    accountHolderName: accountName.trim(),
                })
                console.log('[CancelBookingModal] Bước 1 xong.')
            }

            // 2. Hủy đơn qua đúng luồng nghiệp vụ (BookingService.cancel) - BE tự
            // tính % hoàn theo policy và tự publish event tạo lệnh chi payOS,
            // KHÔNG gọi thẳng /api/payment/{id}/cancel-refund (endpoint test cũ).
            console.log('[CancelBookingModal] Bước 2: gọi bookingApi.cancel...')
            const cancelRes = await bookingApi.cancel(booking.id, {
                reason: cancelReason,
                cancelledByRestaurant: false,
            })
            console.log('[CancelBookingModal] Bước 2 xong, response:', cancelRes?.data)

            if (depositAmount > 0 && refundPercent > 0) {
                toast('Đã hủy đơn. Đang chờ hệ thống tự động hoàn cọc...')
                reachedPollingStep = true
                console.log('[CancelBookingModal] Bước 3: bắt đầu polling trạng thái...')
                // Nếu có cọc -> Bắt đầu bật chế độ Polling chờ kết quả Refund
                startStatusPolling(booking.id)
            } else {
                // Nếu không có cọc -> Hủy thành công ngay lập tức
                toast.success('Hủy bàn thành công!')
                if (onRefresh) onRefresh()
                onClose()
            }

        } catch (err) {
            // Nếu log KHÔNG in ra "Bước 3" ở trên nhưng vẫn rơi vào đây, nghĩa là
            // lỗi xảy ra TRƯỚC khi polling kịp bắt đầu - xem message/response bên
            // dưới trong console để biết chính xác nguyên nhân.
            console.error("[CancelBookingModal] Lỗi hủy đơn (reachedPollingStep=" + reachedPollingStep + "):", err)
            console.error("[CancelBookingModal] err.response?.data:", err?.response?.data)
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi hủy đơn!')
        } finally {
            // Luôn tắt trạng thái "đang gửi" nếu KHÔNG rơi vào nhánh polling (polling
            // tự tắt submitting/isRefunding riêng khi có kết quả cuối) - tránh nút bị
            // kẹt ở trạng thái disable mãi nếu có lỗi bất ngờ không được catch đúng chỗ.
            if (!reachedPollingStep) {
                setSubmitting(false)
            }
        }
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: 480, padding: '1.5rem', background: '#fff', borderRadius: 12, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>

                {/* Hiển thị màn hình chờ Overlay khi đang Polling Refund */}
                {isRefunding && (
                    <div style={{
                        position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.9)', zIndex: 10,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center'
                    }}>
                        <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #f3f3f3', borderTop: '4px solid #C9A24B', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '1rem' }}></div>
                        <div style={{ fontWeight: 600, color: '#1F2937', marginBottom: '.5rem', fontSize: '1rem' }}>Đang tiến hành hoàn tiền...</div>
                        <div style={{ fontSize: '.85rem', color: '#6B7280', lineHeight: '1.4' }}>{statusMessage}</div>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ fontWeight: 700, fontSize: '1.2rem', color: '#111827', margin: 0 }}>Xác nhận hủy đặt bàn</h2>
                    <span style={{ fontSize: '.75rem', padding: '4px 10px', borderRadius: 12, background: badgeColor, color: '#fff', fontWeight: 600 }}>
                        {conditionText}
                    </span>
                </div>

                <div style={{ background: '#F9FAFB', padding: '.75rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '.875rem', lineHeight: '1.6' }}>
                    <div><strong>Nhà hàng:</strong> {booking.branchName}</div>
                    {createdAt && (
                        <div><strong>Thời gian tạo đơn:</strong> {createdAt.toLocaleString('vi-VN')}</div>
                    )}
                    <div style={{ color: '#D97706' }}><strong><Clock size={14} style={{ verticalAlign: '-2px' }} /> Giờ check-in (Hẹn):</strong> {reservationTime.toLocaleString('vi-VN')}</div>
                </div>

                {inGracePeriod && (
                    <div style={{
                        background: '#ECFDF5',
                        border: '1.5px solid #86EFAC',
                        borderRadius: 8,
                        padding: '.75rem 1rem',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '.6rem'
                    }}>
                        <ShieldCheck size={22} color="#059669" style={{ flexShrink: 0 }} />
                        <div style={{ fontSize: '.82rem', color: '#065F46', lineHeight: 1.4 }}>
                            <strong>Chính sách ân hạn Dabana:</strong> Đơn đặt bàn vừa được xác nhận. Bạn được <strong>hoàn 100% tiền cọc</strong> nếu huỷ trong thời gian ân hạn (còn khoảng {remainingMins} phút).
                        </div>
                    </div>
                )}

                {depositAmount > 0 && (
                    <>
                        <div style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '.75rem 1rem', marginBottom: '1rem', fontSize: '.83rem' }}>
                            <div style={{ fontWeight: 700, marginBottom: '.4rem', color: '#374151' }}>
                                <ScrollText size={15} style={{ verticalAlign: '-2px' }} /> Chính sách hủy bàn: {policy.policyDepositName || 'Chuẩn'}
                            </div>
                            <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text-muted)' }}>
                                <li>Hủy trước từ {freeCancelLimitHours}h trở lên: Hoàn {policy.freeRefundPercent ?? 100}% cọc.</li>
                                <li>Hủy dưới {freeCancelLimitHours}h trước giờ hẹn: Hoàn {policy.lateRefundPercent ?? 50}% cọc.</li>
                            </ul>
                        </div>

                        <div style={{ background: '#FFFDF5', border: '1px solid #FCD34D', padding: '.875rem 1rem', borderRadius: 8, marginBottom: '1rem', fontSize: '.9rem' }}>
                            <div style={{ marginBottom: '.3rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Số tiền cọc đã trả:</span>
                                <span style={{ fontWeight: 600 }}>{depositAmount.toLocaleString('vi-VN')}₫</span>
                            </div>
                            <div style={{ marginBottom: '.3rem', color: '#DC2626', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Phí hủy giữ lại ({100 - refundPercent}%):</span>
                                <span>-{penaltyAmount.toLocaleString('vi-VN')}₫</span>
                            </div>
                            <div style={{ borderTop: '1px solid #FDE68A', paddingTop: '.4rem', fontWeight: 700, color: '#059669', fontSize: '1rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>Dự kiến hoàn lại ({refundPercent}%):</span>
                                <span>{refundAmount.toLocaleString('vi-VN')}₫</span>
                            </div>
                        </div>

                        {/* Khung điền thông tin tài khoản ngân hàng nhận hoàn tiền */}
                        {refundPercent > 0 && (
                            <div style={{ background: '#F9FAFB', border: '1px solid var(--border)', padding: '1rem', borderRadius: 8, marginBottom: '1rem' }}>
                                <div style={{ fontSize: '.85rem', fontWeight: 700, color: '#374151', marginBottom: '.5rem' }}>
                                    <Landmark size={15} style={{ verticalAlign: '-2px' }} /> Thông tin tài khoản nhận tiền hoàn
                                </div>

                                <div style={{ marginBottom: '.75rem' }}>
                                    <BankSelect
                                        banks={banks}
                                        value={selectedBankId}
                                        onChange={setSelectedBankId}
                                        disabled={loadingBanks}
                                        label="Chọn Ngân hàng:"
                                        searchPlaceholder="Nhập tìm nhanh (VCB, MB, ACB, TPB...)..."
                                        selectPlaceholder={loadingBanks ? "Đang tải danh sách ngân hàng..." : "-- Chọn ngân hàng thụ hưởng --"}
                                    />
                                </div>

                                <div style={{ marginBottom: '.75rem' }}>
                                    <label style={{ fontSize: '.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '.3rem' }}>Số tài khoản nhận:</label>
                                    <input
                                        type="text"
                                        placeholder="Nhập số tài khoản ngân hàng..."
                                        value={toAccountNumber}
                                        onChange={e => setToAccountNumber(e.target.value)}
                                        style={{ width: '100%', padding: '.5rem', borderRadius: 6, border: '1px solid var(--border)', fontSize: '.87rem' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ fontSize: '.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '.3rem' }}>Tên chủ tài khoản (Không dấu):</label>
                                    <input
                                        type="text"
                                        placeholder="NGUYEN VAN A"
                                        value={accountName}
                                        onChange={e => setAccountName(e.target.value.toUpperCase())}
                                        style={{ width: '100%', padding: '.5rem', borderRadius: 6, border: '1px solid var(--border)', fontSize: '.87rem', textTransform: 'uppercase' }}
                                    />
                                </div>
                            </div>
                        )}

                    </>
                )}

                <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '.85rem', fontWeight: 600, display: 'block', marginBottom: '.3rem' }}>Lý do hủy đơn:</label>
                    <input
                        type="text"
                        className="input"
                        value={cancelReason}
                        onChange={e => setCancelReason(e.target.value)}
                        placeholder="Nhập lý do hủy..."
                        style={{ width: '100%', padding: '.5rem .75rem', borderRadius: 6, border: '1px solid var(--border)' }}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '.5rem', marginBottom: '1.25rem', fontSize: '.83rem' }}>
                    <input
                        type="checkbox"
                        id="agreeCancel"
                        checked={agreed}
                        onChange={e => setAgreed(e.target.checked)}
                        style={{ marginTop: '2px', cursor: 'pointer' }}
                    />
                    <label htmlFor="agreeCancel" style={{ cursor: 'pointer', color: '#374151', lineHeight: '1.4' }}>
                        {depositAmount > 0
                            ? 'Tôi xác nhận thông tin tài khoản trên là chính xác và đồng ý với chính sách khấu trừ phí hủy bàn.'
                            : 'Tôi xác nhận muốn hủy lịch đặt bàn này.'}
                    </label>
                </div>

                <div className="flex gap-3" style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn-outline" style={{ flex: 1, padding: '.5rem', cursor: 'pointer' }} onClick={onClose} disabled={submitting}>
                        Đóng
                    </button>
                    <button
                        className="btn-danger"
                        style={{
                            flex: 1.5,
                            background: !agreed || submitting ? '#9CA3AF' : '#DC2626',
                            color: '#fff', fontWeight: 600, padding: '.5rem', border: 'none', borderRadius: 6,
                            cursor: !agreed || submitting ? 'not-allowed' : 'pointer'
                        }}
                        onClick={handleConfirmClick}
                        disabled={!agreed || submitting}
                    >
                        {submitting ? 'Đang xử lý...' : (depositAmount > 0 ? 'Xác nhận hủy & Hoàn cọc' : 'Xác nhận hủy')}
                    </button>
                </div>
            </div>
        </div>
    )
}