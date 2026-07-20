import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingApi } from '../../api';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';

export default function BookingInvoicePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        bookingApi.getById(id)
            .then(res => {
                setBooking(res.data?.data || res.data);
                setLoading(false);
            })
            .catch(err => {
                toast.error("Không thể tải chi tiết hóa đơn");
                navigate('/my-bookings');
            });
    }, [id]);

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải hóa đơn...</div>;
    if (!booking) return <div style={{ padding: '2rem', textAlign: 'center' }}>Không tìm thấy dữ liệu đơn hàng.</div>;

    return (
        <>
            <Navbar />
            <div className="page-container" style={{ padding: '2rem 1rem', maxWidth: 600, margin: '0 auto' }}>
                <div style={{ position: 'relative', zIndex: 9999 }}> {/* Bọc thêm một lớp để cô lập */}
                    <button
                        type="button"
                        className="btn-outline"
                        style={{
                            marginBottom: '1.5rem',
                            display: 'inline-block',
                            // 🔥 ÉP CON TRỎ CHUỘT PHẢI HIỆN BÀN TAY BẰNG !important
                            cursor: 'pointer !important',
                            // 🔥 ÉP NHẬN SỰ KIỆN CLICK BẤT CHẤP THẺ CHA CÓ BỊ KHÓA HAY KHÔNG
                            pointerEvents: 'auto !important',
                            // 🔥 ĐẨY LÊN LAYER CAO NHẤT TRÊN MÀN HÌNH
                            position: 'relative',
                            zIndex: 99999,
                        }}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log("Đã click nút Back thành công!");
                            navigate('/my-bookings');
                        }}
                    >
                        ← Quay lại lịch sử đặt bàn
                    </button>
                </div>

                <div className="card" style={{ padding: '2rem', border: '1px solid var(--border)' }}>
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontWeight: 800, margin: 0 }}>HOÁ ĐƠN ĐẶT BÀN</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '.85rem' }}>Mã đơn: #{booking.id}</p>
                        <span className="badge badge-green" style={{ marginTop: '.5rem', display: 'inline-block' }}>
                            Trạng thái: {booking.status}
                        </span>
                    </div>

                    {/* Chi tiết thông tin */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', borderBottom: '1px dashed var(--border)', paddingBottom: '1rem' }}>
                        <p><b>Nhà hàng:</b> {booking.restaurantName}</p>
                        <p><b>Chi nhánh:</b> {booking.branchName}</p>
                        <p><b>Vị trí bàn:</b> {booking.tables?.map(t => t.tableName).join(', ') || 'Chưa xếp'}</p>
                        <p><b>Thời gian:</b> {new Date(booking.reservationTime).toLocaleString('vi-VN')}</p>
                        <p><b>Khách hàng:</b> {booking.name} ({booking.phone})</p>
                    </div>

                    {/* Chi tiết món ăn */}
                    {booking.items && booking.items.length > 0 && (
                        <div style={{ marginTop: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                            <p style={{ fontWeight: 700 }}>🛒 Món đã đặt trước:</p>
                            {booking.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between" style={{ fontSize: '.9rem', margin: '.25rem 0' }}>
                                    <span>{item.name} x{item.quantity}</span>
                                    <span>{(item.price * item.quantity).toLocaleString('vi-VN')}₫</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-between items-center" style={{ marginTop: '1rem' }}>
                        <span style={{ fontWeight: 700 }}>Tiền cọc đã trả:</span>
                        <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--brand)' }}>
                            {booking.depositAmount ? `${Number(booking.depositAmount).toLocaleString('vi-VN')}₫` : '0₫'}
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}