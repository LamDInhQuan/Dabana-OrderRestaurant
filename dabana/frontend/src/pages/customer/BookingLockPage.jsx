import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingApi } from '../../api';
import BookingLockDetail from './BookingDetail';
import toast from 'react-hot-toast';

export default function BookingLockPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchBookingDetail = async () => {
        try {
            setLoading(true);
            const res = await bookingApi.getById(id);
            const data = res.data?.data || res.data;

            if (!data) {
                toast.error("Không tìm thấy dữ liệu đơn đặt bàn.");
                navigate('/my-bookings');
                return;
            }

            // BẢO VỆ TUYẾN ĐƯỜNG: Nếu trạng thái KHÔNG PHẢI đang chờ thanh toán/giữ bàn nữa
            if (data.status !== 'HOLDING' && data.status !== 'AWAITING_PAYMENT') {
                // Tự động đẩy thẳng sang trang xem hóa đơn chi tiết của đơn hàng đó!
                navigate(`/my-bookings/${id}/invoice`);
                return;
            }

            setBooking(data);
        } catch (err) {
            console.error("Lỗi lấy chi tiết đặt bàn:", err);
            toast.error(err.response?.data?.message || "Không thể tải thông tin");
            navigate('/my-bookings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            fetchBookingDetail();
        }
    }, [id]);

    // Xử lý khi bộ đếm ngược chạy về 0 (đang ở trong trang và hết giờ)
    const handleTimeOut = () => {
        toast.error("Đơn đặt bàn của bạn đã hết hạn giữ!");
        // Đẩy ngay lập tức sang trang hóa đơn để xem trạng thái EXPIRED
        navigate(`/my-bookings/${id}/invoice`);
    };

    const handlePay = async () => {
        try {
            // Logic gọi link thanh toán VNPay/Momo tại đây
            toast.success("Đang chuyển hướng sang cổng thanh toán...");
        } catch (err) {
            toast.error("Thanh toán thất bại, vui lòng thử lại.");
        }
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', marginTop: '5rem' }}>
                <p style={{ color: 'var(--text-muted)' }}>Đang tải thông tin đơn đặt bàn...</p>
            </div>
        );
    }

    return (
        <div className="page-container" style={{ padding: '2rem 1rem' }}>
            {/* Nút Back phải nằm độc lập ở đây */}
            <button
                type="button"
                className="btn-outline"
                onClick={() => navigate('/my-bookings')}
            >
                ← Quay lại lịch sử đặt bàn
            </button>

            {booking && (
                <BookingLockDetail
                    booking={booking}
                    onTimeOut={handleTimeOut}
                    onPay={handlePay}
                />
            )}
        </div>
    );
}