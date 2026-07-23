import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingApi, reviewApi } from '../../api';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';

const RATING_CATEGORIES = [
    { key: 'spaceRating', label: '🏠 Không gian' },
    { key: 'serviceRating', label: '👨‍🍳 Phục vụ' },
    { key: 'foodRating', label: '🍴 Đồ ăn' },
];

export default function BookingInvoicePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reviewForm, setReviewForm] = useState({ spaceRating: 5, serviceRating: 5, foodRating: 5, comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);

    const loadBooking = () => {
        bookingApi.getById(id)
            .then(res => {
                setBooking(res.data?.data || res.data);
                setLoading(false);
            })
            .catch(err => {
                toast.error("Không thể tải chi tiết hóa đơn");
                navigate('/my-bookings');
            });
    };

    useEffect(() => { loadBooking(); }, [id]);

    const handleSubmitReview = async () => {
        setSubmittingReview(true);
        try {
            await reviewApi.create({ ...reviewForm, bookingId: booking.id });
            toast.success('Cảm ơn đánh giá của bạn!');
            loadBooking();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Lỗi gửi đánh giá');
        } finally {
            setSubmittingReview(false);
        }
    };

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
                            {booking.estimatedTotal ? `${Number(booking.estimatedTotal).toLocaleString('vi-VN')}₫` : '0₫'}
                        </span>
                    </div>

                    {/* B13: Đánh giá - chỉ hiển thị khi hóa đơn (đơn đặt bàn) đã hoàn tất */}
                    {booking.status === 'COMPLETED' && (
                        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px dashed var(--border)' }}>
                            {booking.reviewed ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '.9rem' }}>
                                    ⭐ Bạn đã đánh giá đơn này. Cảm ơn bạn!
                                </p>
                            ) : (
                                <>
                                    <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>⭐ Đánh giá trải nghiệm của bạn</h3>
                                    {RATING_CATEGORIES.map(({ key, label }) => (
                                        <div key={key} style={{ marginBottom: '.875rem' }}>
                                            <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.4rem' }}>{label}</label>
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map(v => (
                                                    <button key={v} type="button"
                                                        onClick={() => setReviewForm(p => ({ ...p, [key]: v }))}
                                                        style={{
                                                            width: 36, height: 36, borderRadius: '50%', fontWeight: 700, fontSize: '.9rem',
                                                            background: reviewForm[key] >= v ? '#FBBF24' : 'var(--border)',
                                                            color: reviewForm[key] >= v ? '#fff' : 'var(--text-muted)'
                                                        }}>
                                                        ★
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    <div style={{ marginBottom: '1rem' }}>
                                        <label style={{ fontSize: '.85rem', fontWeight: 500, display: 'block', marginBottom: '.3rem' }}>Nhận xét</label>
                                        <textarea rows={3} value={reviewForm.comment}
                                            onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                                            placeholder="Chia sẻ trải nghiệm của bạn..." />
                                    </div>
                                    <button className="btn-primary" style={{ width: '100%', padding: '.875rem' }}
                                        disabled={submittingReview} onClick={handleSubmitReview}>
                                        {submittingReview ? 'Đang gửi...' : 'Gửi đánh giá'}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}