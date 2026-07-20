import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BookingLockDetail({ booking, onTimeOut, onPay }) {
    // 1. Khởi tạo State bộ đếm từ số giây API trả về (remainSeconds)
    const [timeLeft, setTimeLeft] = useState(booking.remainSeconds || 0);
    const navigate = useNavigate();
    useEffect(() => {
        // Nếu ban đầu đổ về đã hết thời gian
        if (timeLeft <= 0) {
            onTimeOut();
            return;
        }
        // 2. Thiết lập bộ đếm chạy mỗi 1 giây
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    onTimeOut(); // Kích hoạt callback khi về 00:00 để chuyển trang
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Cleanup interval khi component bị unmount
        return () => clearInterval(timer);
    }, [booking.id]);


    const handlePaymentRedirect = () => {
        // Chuyển hướng sang route /booking/payment/35 tương ứng với ID đơn đặt bàn
        navigate(`/booking/payment/${booking.id}`);
    };
    // 3. Hàm convert số giây tổng sang định dạng MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Tính tổng tiền đặt trước (nếu có)
    const itemsTotal = booking.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <div className="card" style={{ width: '100%', maxWidth: 550, padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>

                {/* Khối cảnh báo giữ bàn tạm thời */}
                <div style={{ background: '#FFFDF5', border: '1px solid #FCD34D', padding: '1rem', borderRadius: 8, marginBottom: '1.5rem', textAlign: 'center' }}>
                    <span style={{ color: '#D97706', fontWeight: 600 }}>⚠️ Bàn của bạn đang được giữ tạm thời!</span>
                </div>

                {/* Khối hiển thị Đồng hồ đếm ngược */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <p style={{ fontSize: '.85rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>
                        THỜI GIAN CÒN LẠI ĐỂ THANH TOÁN
                    </p>
                    <h1 style={{ fontSize: '4rem', fontWeight: 800, color: '#F59E0B', margin: '.5rem 0', fontFamily: 'monospace' }}>
                        {formatTime(timeLeft)}
                    </h1>
                </div>

                {/* Khối thông tin hóa đơn chi tiết */}
                <div style={{ borderTop: '1px dashed var(--border)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1.1rem' }}>🧾 Chi tiết giữ bàn #{booking.id}</h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', fontSize: '.95rem' }}>
                        <div className="flex justify-between">
                            <span style={{ color: 'var(--text-muted)' }}>Nhà hàng:</span>
                            <span style={{ fontWeight: 600 }}>{booking.restaurantName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span style={{ color: 'var(--text-muted)' }}>Chi nhánh:</span>
                            <span style={{ fontWeight: 600 }}>{booking.branchName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span style={{ color: 'var(--text-muted)' }}>Vị trí bàn:</span>
                            <span style={{ fontWeight: 600, color: 'var(--brand)' }}>
                                {booking.tables?.map(t => t.tableName).join(', ') || 'Đang chờ xếp'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span style={{ color: 'var(--text-muted)' }}>Thời gian đến:</span>
                            <span style={{ fontWeight: 600 }}>{new Date(booking.reservationTime).toLocaleString('vi-VN')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span style={{ color: 'var(--text-muted)' }}>Khách hàng:</span>
                            <span style={{ fontWeight: 600 }}>{booking.name} - {booking.phone}</span>
                        </div>
                    </div>
                </div>

                {/* Khối hiển thị các món ăn đã gọi trước */}
                {booking.items && booking.items.length > 0 && (
                    <div style={{ background: 'var(--bg-light)', padding: '1rem', borderRadius: 8, marginBottom: '1.5rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: '.5rem', color: 'var(--text-main)' }}>🛒 Món ăn đặt trước:</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                            {booking.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between" style={{ fontSize: '.9rem' }}>
                                    <span><b style={{ color: 'var(--text-main)' }}>{item.name}</b> x{item.quantity}</span>
                                    <span style={{ fontWeight: 500 }}>{(item.price * item.quantity).toLocaleString('vi-VN')}₫</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Khối tính tổng chi phí đặt cọc */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginBottom: '2rem' }}>
                    <div className="flex justify-between items-center">
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Tiền cọc cần thanh toán:</span>
                        <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--danger)' }}>
                            {booking.depositAmount ? `${Number(booking.depositAmount).toLocaleString('vi-VN')}₫` : '0₫'}
                        </span>
                    </div>
                </div>

                {/* Khối Action Buttons */}
                <div className="flex gap-3">
                    <button
                        className="btn-outline"
                        style={{ flex: 1, padding: '.75rem' }}
                        onClick={() => window.confirm('Bạn có chắc chắn muốn hủy lượt đặt bàn này?') && onTimeOut()}
                    >
                        Hủy đơn
                    </button>
                    <button
                        className="btn-primary"
                        style={{ flex: 2, padding: '.75rem', fontWeight: 700, background: '#D97706', borderColor: '#D97706' }}
                        onClick={handlePaymentRedirect}
                        disabled={!booking.paymentAvailable || timeLeft <= 0}
                    >
                        💳 THANH TOÁN NGAY
                    </button>
                </div>

            </div>
        </div>
    );
}