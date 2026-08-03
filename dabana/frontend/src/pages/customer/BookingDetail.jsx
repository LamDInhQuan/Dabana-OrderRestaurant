import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, TriangleAlert, Hourglass, RefreshCw, XCircle, AlertTriangle, FileText, ClipboardList } from 'lucide-react';

import toast from 'react-hot-toast';
import { paymentApi, bookingApi } from '../../api';
import { QRCodeSVG } from 'qrcode.react';

export default function BookingLockDetail({ booking, onTimeOut }) {
    const [timeLeft, setTimeLeft] = useState(booking.remainSeconds || 0);
    const [loadingPayment, setLoadingPayment] = useState(false);
    const [paymentInfo, setPaymentInfo] = useState(null);

    // State quản lý việc thanh toán thành công & Lưu trữ hóa đơn
    const [isPaidSuccess, setIsPaidSuccess] = useState(false);
    const [confirmedBooking, setConfirmedBooking] = useState(null);

    // State quản lý Modal xác nhận hủy đơn
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    const navigate = useNavigate();

    // 1. Đồng hồ đếm ngược giữ bàn
    useEffect(() => {
        if (timeLeft <= 0 || isPaidSuccess) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onTimeOut();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [booking.id, isPaidSuccess]);

    // 2. Tự động lấy thông tin/Mã QR PayOS
    const fetchOrCreateQRCode = async () => {
        if (!booking?.id) return;
        setLoadingPayment(true);

        try {
            let res;
            try {
                res = await paymentApi.getActiveDeposit(booking.id);
            } catch {
                res = await paymentApi.createDeposit(booking.id, booking.estimatedTotal);
            }

            const data = res.data?.data || res.data || {};
            const rawQr = data.qrCode || '';

            setPaymentInfo({
                qrCodeString: rawQr.startsWith('000201') ? rawQr : null,
                qrImageUrl: rawQr.startsWith('http') ? rawQr : null,
                bankName: data.accountName || 'MB Bank',
                accountNumber: data.accountNumber || '',
                accountHolder: data.accountName || '',
                transferContent: data.description || `Thanh toan BK${booking.id}`,
                checkoutUrl: data.checkoutUrl || '',
                status: data.status || 'PENDING',
            });
        } catch (err) {
            console.error("Lỗi lấy thông tin QR:", err);
            toast.error(err.response?.data?.message || 'Không thể tải mã QR thanh toán!');
        } finally {
            setLoadingPayment(false);
        }
    };

    useEffect(() => {
        if (Number(booking?.estimatedTotal || 0) === 0 || booking?.status === 'CONFIRMED') {
            setIsPaidSuccess(true);
            setConfirmedBooking(booking);
            return;
        }

        fetchOrCreateQRCode();
    }, [booking.id]);

    // 3. POLLING: Tự động kiểm tra trạng thái thanh toán mỗi 3 giây
    useEffect(() => {
        if (!booking?.id || isPaidSuccess) return;

        const checkStatusTimer = setInterval(async () => {
            try {
                const depositRes = await paymentApi.getLatestDeposit(booking.id);
                const deposit = depositRes.data?.data || depositRes.data;

                if (deposit?.status === 'PAID') {
                    clearInterval(checkStatusTimer);
                    try {
                        const updatedBookingRes = await bookingApi.getById(booking.id);
                        const updatedBooking = updatedBookingRes.data?.data || updatedBookingRes.data;
                        if (updatedBooking) setConfirmedBooking(updatedBooking);
                    } catch (e) {
                        console.error("Lỗi lấy thông tin booking mới:", e);
                    }
                    setIsPaidSuccess(true);
                    toast.success("Thanh toán thành công! Đơn giữ bàn đã được xác nhận.");
                }
            } catch (err) {
                console.error("Lỗi kiểm tra trạng thái thanh toán:", err);
            }
        }, 3000);

        return () => clearInterval(checkStatusTimer);
    }, [booking.id, isPaidSuccess]);

    // Xử lý khi người dùng xác nhận hủy đơn trong Modal
    const handleConfirmCancel = async () => {
        setIsCancelling(true);
        try {
            // Gọi api hủy đơn nếu cần, ví dụ: await bookingApi.cancelBooking(booking.id);
            onTimeOut(); // Gọi callback timeout/hủy đơn của cha để chuyển trạng thái màn hình
        } catch (err) {
            console.error("Lỗi hủy đơn:", err);
            toast.error("Không thể hủy đơn, vui lòng thử lại.");
        } finally {
            setIsCancelling(false);
            setIsCancelModalOpen(false);
        }
    };

    // Format MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // =========================================================
    // GIAO DIỆN HÓA ĐƠN KHI THANH TOÁN THÀNH CÔNG
    // =========================================================
    if (isPaidSuccess) {
        const detail = confirmedBooking || booking;
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '1rem' }}>
                <div className="card" style={{ width: '100%', maxWidth: 550, padding: '2rem', borderRadius: 16, background: '#fff', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                    
                    {/* Header thông báo thành công */}
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ width: 64, height: 64, background: '#dcfce7', color: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <Check size={32} />
                        </div>
                        <h2 style={{ color: '#15803d', fontWeight: 800, fontSize: '1.5rem', marginBottom: '.25rem' }}>
                            THANH TOÁN THÀNH CÔNG!
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '.9rem' }}>
                            Đơn đặt bàn của bạn đã được xác nhận trên hệ thống.
                        </p>
                    </div>

                    {/* Khối hóa đơn chi tiết */}
                    <div style={{ background: '#f8fafc', borderRadius: 12, padding: '1.25rem', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #cbd5e1', paddingBottom: '.75rem', marginBottom: '.75rem' }}>
                            <span style={{ color: '#64748b', fontSize: '.9rem' }}>Mã đặt bàn:</span>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>#{detail.id}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', fontSize: '.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Nhà hàng:</span>
                                <span style={{ fontWeight: 600 }}>{detail.restaurantName || 'Nhà hàng'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Chi nhánh:</span>
                                <span style={{ fontWeight: 600 }}>{detail.branchName || ''}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Vị trí bàn:</span>
                                <span style={{ fontWeight: 600, color: '#0284c7' }}>
                                    {detail.tables?.map(t => t.tableName || t.name).join(', ') || 'Đã giữ chỗ'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Thời gian dùng bữa:</span>
                                <span style={{ fontWeight: 600, color: '#d97706' }}>
                                    {detail.reservationTime ? new Date(detail.reservationTime).toLocaleString('vi-VN') : ''}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Khách hàng:</span>
                                <span style={{ fontWeight: 600 }}>{detail.name} ({detail.phone})</span>
                            </div>
                            {detail.guestCount && (
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#64748b' }}>Số lượng khách:</span>
                                    <span style={{ fontWeight: 600 }}>{detail.guestCount} khách</span>
                                </div>
                            )}
                        </div>

                        {/* Danh sách món ăn đặt trước nếu có */}
                        {detail.items && detail.items.length > 0 && (
                            <>
                                <hr style={{ border: 0, borderTop: '1px dashed #cbd5e1', margin: '.75rem 0' }} />
                                <div style={{ fontWeight: 700, fontSize: '.85rem', color: '#475569', marginBottom: '.5rem' }}>
                                    Món ăn đặt trước:
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                                    {detail.items.map((item, index) => (
                                        <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.875rem' }}>
                                            <div>
                                                <span style={{ fontWeight: 600, color: '#1e293b' }}>{item.name}</span>
                                                <span style={{ color: '#64748b', marginLeft: '.5rem', fontSize: '.8rem' }}>x{item.quantity}</span>
                                            </div>
                                            <span style={{ fontWeight: 600, color: '#334155', fontFamily: 'monospace' }}>
                                                {(item.price * item.quantity).toLocaleString('vi-VN')}₫
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        <hr style={{ border: 0, borderTop: '1px dashed #cbd5e1', margin: '1rem 0' }} />

                        {/* Tổng tiền cọc & Thanh toán */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, color: '#0f172a' }}>Tiền cọc đã thanh toán:</span>
                            <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#16a34a' }}>
                                {detail.depositAmount || detail.estimatedTotal ? `${Number(detail.depositAmount || detail.estimatedTotal).toLocaleString('vi-VN')}₫` : '0₫'}
                            </span>
                        </div>
                    </div>

                    {/* Nút thao tác sau khi hoàn tất */}
                    <div style={{ display: 'flex', gap: '.75rem', flexDirection: 'column' }}>
                        <button
                            type="button"
                            className="btn-primary"
                            style={{ width: '100%', padding: '.85rem', borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '.5rem', fontWeight: 700, cursor: 'pointer' }}
                            onClick={() => navigate(`/my-bookings/${detail.id}/invoice`)}
                        >
                            <FileText size={18} /> Xem hoá đơn chi tiết & Đánh giá
                        </button>
                        <button
                            type="button"
                            className="btn-outline"
                            style={{ width: '100%', padding: '.75rem', borderRadius: 8, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '.5rem', fontWeight: 600, cursor: 'pointer' }}
                            onClick={() => navigate('/my-bookings')}
                        >
                            <ClipboardList size={18} /> Danh sách đơn đặt bàn
                        </button>
                    </div>

                </div>
            </div>
        );
    }

    // =========================================================
    // GIAO DIỆN GIỮ BÀN & QUÉT MÃ QR THANH TOÁN
    // =========================================================
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: 520, padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderRadius: 16, background: '#fff' }}>

                {/* Cảnh báo giữ bàn */}
                <div style={{ background: '#FFFDF5', border: '1px solid #FCD34D', padding: '0.75rem', borderRadius: 8, marginBottom: '1.25rem', textAlign: 'center' }}>
                    <span style={{ color: '#D97706', fontWeight: 600, fontSize: '.9rem' }}>
                        <TriangleAlert size={15} style={{ verticalAlign: '-2px' }} /> Bàn của bạn đang được giữ tạm thời!
                    </span>
                </div>

                {/* Đồng hồ đếm ngược */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '.8rem', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>
                        THỜI GIAN CÒN LẠI ĐỂ THANH TOÁN
                    </p>
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 800, color: '#F59E0B', margin: '.25rem 0', fontFamily: 'monospace' }}>
                        {formatTime(timeLeft)}
                    </h1>
                </div>

                {/* KHỐI HIỂN THỊ MÃ QR & SỐ TIỀN CỌC */}
                <div style={{ textAlign: 'center', background: '#f8fafc', padding: '1.25rem', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                    <div style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px dashed #cbd5e1' }}>
                        <span style={{ fontSize: '.85rem', color: '#64748b', display: 'block', marginBottom: '0.2rem' }}>Số tiền cọc cần thanh toán:</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#16a34a' }}>
                            {booking.estimatedTotal ? `${Number(booking.estimatedTotal).toLocaleString('vi-VN')}₫` : '0₫'}
                        </span>
                    </div>

                    {loadingPayment ? (
                        <div style={{ padding: '2rem 0', color: '#64748b' }}>
                            <p><Hourglass size={15} style={{ verticalAlign: '-2px' }} /> Đang tải mã QR thanh toán...</p>
                        </div>
                    ) : paymentInfo?.qrCodeString ? (
                        <div>
                            <div style={{ background: '#ffffff', padding: '1rem', borderRadius: 12, display: 'inline-block', border: '1px solid #cbd5e1' }}>
                                <QRCodeSVG value={paymentInfo.qrCodeString} size={200} level="M" includeMargin={true} />
                            </div>
                            <p style={{ fontSize: '.8rem', color: '#64748b', marginTop: '.75rem', fontWeight: 500 }}>
                                Quét mã bằng app Ngân hàng (MB, VCB, Techcombank...)
                            </p>
                            <p style={{ fontSize: '.75rem', color: '#0284c7', marginTop: '.25rem' }}>
                                <RefreshCw size={13} style={{ verticalAlign: '-2px' }} /> Hệ thống sẽ tự chuyển sang hóa đơn khi nhận chuyển khoản
                            </p>
                        </div>
                    ) : (
                        <div>
                            <p style={{ color: '#ef4444', fontSize: '.9rem', marginBottom: '.5rem' }}>Chưa lấy được mã QR thanh toán.</p>
                            <button onClick={fetchOrCreateQRCode} style={{ padding: '.4rem .8rem', fontSize: '.85rem', background: '#e2e8f0', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                                <RefreshCw size={14} style={{ verticalAlign: '-3px' }} /> Thử lại
                            </button>
                        </div>
                    )}
                </div>

                {/* Thông tin chuyển khoản thủ công */}
                {paymentInfo && (
                    <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: 10, marginBottom: '1.5rem', fontSize: '.875rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.4rem' }}>
                            <span style={{ color: '#64748b' }}>Ngân hàng:</span>
                            <span style={{ fontWeight: 700 }}>{paymentInfo.bankName}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.4rem' }}>
                            <span style={{ color: '#64748b' }}>Số tài khoản:</span>
                            <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{paymentInfo.accountNumber}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.4rem' }}>
                            <span style={{ color: '#64748b' }}>Nội dung CK:</span>
                            <span style={{ fontWeight: 700, color: '#b91c1c' }}>{paymentInfo.transferContent}</span>
                        </div>
                    </div>
                )}

                {/* Nút mở Modal Hủy đơn */}
                <div style={{ display: 'flex', gap: '.75rem' }}>
                    <button
                        style={{
                            flex: 1,
                            padding: '.75rem',
                            borderRadius: 8,
                            border: '1px solid #fecaca',
                            background: '#fff5f5',
                            color: '#dc2626',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'background 0.2s'
                        }}
                        onClick={() => setIsCancelModalOpen(true)}
                    >
                        Hủy đơn đặt bàn
                    </button>
                </div>

                {/* ========================================================= */}
                {/* MODAL XÁC NHẬN HỦY ĐƠN */}
                {/* ========================================================= */}
                {isCancelModalOpen && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: 'rgba(0, 0, 0, 0.5)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 9999,
                        padding: '1rem'
                    }}>
                        <div style={{
                            background: '#fff',
                            width: '100%',
                            maxWidth: 400,
                            borderRadius: 16,
                            padding: '1.75rem',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                            animation: 'fadeIn 0.2s ease-out'
                        }}>
                            {/* Icon cảnh báo */}
                            <div style={{
                                width: 48,
                                height: 48,
                                background: '#fee2e2',
                                color: '#dc2626',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1rem'
                            }}>
                                <AlertTriangle size={24} />
                            </div>

                            <h3 style={{
                                textAlign: 'center',
                                fontSize: '1.25rem',
                                fontWeight: 700,
                                color: '#1e293b',
                                marginBottom: '.5rem'
                            }}>
                                Xác nhận hủy đơn?
                            </h3>

                            <p style={{
                                textAlign: 'center',
                                fontSize: '.9rem',
                                color: '#64748b',
                                marginBottom: '1.5rem',
                                lineHeight: '1.5'
                            }}>
                                Bạn có chắc chắn muốn hủy lượt giữ bàn này không? Thao tác này không thể hoàn tác.
                            </p>

                            {/* Nút hành động trong Modal */}
                            <div style={{ display: 'flex', gap: '.75rem' }}>
                                <button
                                    type="button"
                                    disabled={isCancelling}
                                    style={{
                                        flex: 1,
                                        padding: '.65rem',
                                        borderRadius: 8,
                                        border: '1px solid #cbd5e1',
                                        background: '#f8fafc',
                                        color: '#334155',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setIsCancelModalOpen(false)}
                                >
                                    Quay lại
                                </button>
                                <button
                                    type="button"
                                    disabled={isCancelling}
                                    style={{
                                        flex: 1,
                                        padding: '.65rem',
                                        borderRadius: 8,
                                        border: 'none',
                                        background: '#dc2626',
                                        color: '#fff',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        opacity: isCancelling ? 0.7 : 1
                                    }}
                                    onClick={handleConfirmCancel}
                                >
                                    {isCancelling ? 'Đang xử lý...' : 'Xác nhận hủy'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}