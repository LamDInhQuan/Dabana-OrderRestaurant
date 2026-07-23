import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { paymentApi, bookingApi } from '../../api';

export default function BookingLockDetail({ booking, onTimeOut }) {
    const [timeLeft, setTimeLeft] = useState(booking.remainSeconds || 0);
    const [loadingPayment, setLoadingPayment] = useState(false);
    const [paymentInfo, setPaymentInfo] = useState(null);

    // State quản lý việc thanh toán thành công & Lưu trữ dữ liệu hóa đơn chi tiết
    const [isPaidSuccess, setIsPaidSuccess] = useState(false);
    const [confirmedBooking, setConfirmedBooking] = useState(null);

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
                res = await paymentApi.getDetail(booking.id);
            } catch {
                res = await paymentApi.createPaymentLink(booking.id);
            }

            const data = res.data?.data || res.data?.result || res.data || {};
            const rawQr = data.qrCode || data.qrImageUrl || data.qrCodeQuery || '';

            setPaymentInfo({
                qrCodeString: rawQr.startsWith('000201') ? rawQr : null,
                qrImageUrl: rawQr.startsWith('http') ? rawQr : null,
                bankName: data.accountName || data.bankName || 'MB Bank',
                accountNumber: data.accountNumber || '',
                accountHolder: data.accountHolder || '',
                transferContent: data.description || `BK${booking.id}`,
            });
        } catch (err) {
            console.error("Lỗi lấy thông tin QR:", err);
            toast.error(err.response?.data?.message || 'Không thể tải mã QR thanh toán!');
        } finally {
            setLoadingPayment(false);
        }
    };

    useEffect(() => {
        // 💡 Nếu đơn không yêu cầu tiền cọc (0đ) hoặc trạng thái đã CONFIRMED sẵn
        if (Number(booking?.estimatedTotal || 0) === 0 || booking?.status === 'CONFIRMED') {
            setIsPaidSuccess(true); // Nhảy thẳng sang màn hình Hóa đơn xác nhận
            setConfirmedBooking(booking);
            return;
        }

        // Nếu có tiền cọc (> 0đ) mới kích hoạt lấy QR PayOS và đếm ngược giữ bàn
        fetchOrCreateQRCode();
    }, [booking.id]);

    // 3. 🔄 POLLING: Tự động kiểm tra trạng thái thanh toán mỗi 3 giây
    useEffect(() => {
        if (!booking?.id || isPaidSuccess) return;

        const checkStatusTimer = setInterval(async () => {
            try {
                const res = await bookingApi.getById(booking.id);
                const currentBooking = res.data?.data || res.data?.result || res.data;

                if (currentBooking && (currentBooking.status === 'CONFIRMED' || currentBooking.status === 'PAID')) {
                    clearInterval(checkStatusTimer);
                    setConfirmedBooking(currentBooking);
                    setIsPaidSuccess(true);
                    toast.success("🎉 Thanh toán thành công! Đơn giữ bàn đã được xác nhận.");
                }
            } catch (err) {
                console.error("Lỗi kiểm tra trạng thái thanh toán:", err);
            }
        }, 3000);

        return () => clearInterval(checkStatusTimer);
    }, [booking.id, isPaidSuccess]);

    // Format MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // =========================================================
    // 📄 GIAO DIỆN HÓA ĐƠN KHI THANH TOÁN THÀNH CÔNG
    // =========================================================
    if (isPaidSuccess) {
        const detail = confirmedBooking || booking;
        const paidAt = detail.updatedAt || new Date().toISOString();

        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '1rem' }}>
                <div className="card" style={{ width: '100%', maxWidth: 550, padding: '2rem', borderRadius: 16, background: '#fff', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}>

                    {/* Header thông báo thành công */}
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ width: 64, height: 64, background: '#dcfce7', color: '#16a34a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: '2rem' }}>
                            ✓
                        </div>
                        <h2 style={{ color: '#15803d', fontWeight: 800, fontSize: '1.5rem', marginBottom: '.25rem' }}>
                            THANH TOÁN THÀNH CÔNG!
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '.9rem' }}>
                            Đơn đặt bàn của bạn đã được xác nhận trên hệ thống.
                        </p>
                    </div>

                    {/* Khối Hóa đơn (Invoice Card) */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
                        {/* Header đơn */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '.75rem', marginBottom: '.75rem' }}>
                            <div>
                                <span style={{ fontSize: '.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Mã đặt bàn</span>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>#{detail.id}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ fontSize: '.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Trạng thái</span>
                                <div><span style={{ background: '#dcfce7', color: '#15803d', padding: '.2rem .6rem', borderRadius: 20, fontSize: '.75rem', fontWeight: 700 }}>ĐÃ XÁC NHẬN</span></div>
                            </div>
                        </div>

                        {/* Thông tin cơ bản */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem', fontSize: '.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Nhà hàng:</span>
                                <span style={{ fontWeight: 600, color: '#0f172a' }}>{detail.restaurantName}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Chi nhánh:</span>
                                <span style={{ fontWeight: 600, color: '#0f172a' }}>{detail.branchName}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Bàn đã xếp:</span>
                                <span style={{ fontWeight: 700, color: '#0284c7' }}>
                                    {detail.tables?.map(t => `${t.tableName} (${t.zoneName})`).join(', ') || 'Đã phân bàn'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Số lượng khách:</span>
                                <span style={{ fontWeight: 600, color: '#0f172a' }}>{detail.guestCount} người</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Thời gian nhận bàn:</span>
                                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                                    {new Date(detail.reservationTime).toLocaleString('vi-VN')}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#64748b' }}>Khách hàng:</span>
                                <span style={{ fontWeight: 600, color: '#0f172a' }}>{detail.name} - {detail.phone}</span>
                            </div>
                        </div>

                        {/* 🍱 DANH SÁCH MÓN ĂN ĐẶT TRƯỚC (NẾU CÓ) */}
                        {detail.items && detail.items.length > 0 && (
                            <>
                                <hr style={{ border: 0, borderTop: '1px dashed #cbd5e1', margin: '1rem 0' }} />
                                <div style={{ marginBottom: '.5rem' }}>
                                    <span style={{ fontSize: '.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                                        🍲 Món ăn đặt trước ({detail.items.length})
                                    </span>
                                </div>

                                <div style={{ background: '#ffffff', borderRadius: 8, border: '1px solid #f1f5f9', padding: '.75rem', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
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
                                {detail.estimatedTotal ? `${Number(detail.estimatedTotal).toLocaleString('vi-VN')}₫` : '0₫'}
                            </span>
                        </div>
                    </div>

                    {/* Nút thao tác sau khi hoàn tất */}
                    <div style={{ display: 'flex', gap: '.75rem' }}>
                        <button
                            style={{ flex: 1, padding: '.75rem', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', fontWeight: 600, cursor: 'pointer', color: '#334155' }}
                            onClick={() => window.print()}
                        >
                            🖨️ In hóa đơn
                        </button>
                        <button
                            style={{ flex: 1.5, padding: '.75rem', borderRadius: 8, border: 'none', background: '#0284c7', color: '#fff', fontWeight: 700, cursor: 'pointer' }}
                            onClick={() => navigate('/my-bookings')}
                        >
                            📋 Danh sách đơn đặt
                        </button>
                    </div>

                </div>
            </div>
        );
    }

    // =========================================================
    // ⏳ GIAO DIỆN GIỮ BÀN & QUÉT MÃ QR THANH TOÁN
    // =========================================================
    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '1rem' }}>
            <div className="card" style={{ width: '100%', maxWidth: 520, padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderRadius: 16, background: '#fff' }}>

                {/* Cảnh báo giữ bàn */}
                <div style={{ background: '#FFFDF5', border: '1px solid #FCD34D', padding: '0.75rem', borderRadius: 8, marginBottom: '1.25rem', textAlign: 'center' }}>
                    <span style={{ color: '#D97706', fontWeight: 600, fontSize: '.9rem' }}>⚠️ Bàn của bạn đang được giữ tạm thời!</span>
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

                {/* KHỐI HIỂN THỊ MÃ QR */}
                <div style={{ textAlign: 'center', background: '#f8fafc', padding: '1.25rem', borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                    {loadingPayment ? (
                        <div style={{ padding: '2rem 0', color: '#64748b' }}>
                            <p>⏳ Đang tải mã QR thanh toán...</p>
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
                                🔄 Hệ thống sẽ tự chuyển sang hóa đơn khi nhận chuyển khoản
                            </p>
                        </div>
                    ) : (
                        <div>
                            <p style={{ color: '#ef4444', fontSize: '.9rem', marginBottom: '.5rem' }}>Chưa lấy được mã QR thanh toán.</p>
                            <button onClick={fetchOrCreateQRCode} style={{ padding: '.4rem .8rem', fontSize: '.85rem', background: '#e2e8f0', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
                                🔄 Thử lại
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

                {/* Nút hủy đơn */}
                <div style={{ display: 'flex', gap: '.75rem' }}>
                    <button
                        className="btn-outline"
                        style={{ flex: 1, padding: '.75rem', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
                        onClick={() => window.confirm('Bạn có chắc chắn muốn hủy lượt đặt bàn này?') && onTimeOut()}
                    >
                        Hủy đơn
                    </button>
                </div>

            </div>
        </div>
    );
}