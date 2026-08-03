import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookingApi, reviewApi } from '../../api';
import Navbar from '../../components/Navbar';
import toast from 'react-hot-toast';
import { Home, ChefHat, Utensils, ShoppingCart, Star, Sparkles, Rocket } from 'lucide-react';
import { translateLabel } from '../../utils/labelTranslator';

const RATING_CATEGORIES = [
    { key: 'spaceRating', label: 'Không gian', icon: Home },
    { key: 'serviceRating', label: 'Phục vụ', icon: ChefHat },
    { key: 'foodRating', label: 'Đồ ăn', icon: Utensils },
];

const getStatusBadgeClass = (status) => {
    switch (status) {
        case 'CONFIRMED':
            return 'badge-green';
        case 'CHECKED_IN':
            return 'badge-blue';
        case 'COMPLETED':
            return 'badge-gray';
        case 'CANCELLED_BY_CUSTOMER':
        case 'CANCELLED_BY_RESTAURANT':
        case 'CANCELLED':
        case 'NO_SHOW':
            return 'badge-red';
        case 'HOLDING':
        case 'AWAITING_PAYMENT':
        case 'PENDING_NO_SHOW':
            return 'badge-yellow';
        default:
            return 'badge-gray';
    }
};

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
            loadBooking(); // Tải lại dữ liệu, lúc này API sẽ trả về isReviewed = true
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
                <div style={{ position: 'relative', zIndex: 9999 }}>
                    <button
                        type="button"
                        className="btn-outline"
                        style={{
                            marginBottom: '1.5rem',
                            display: 'inline-block',
                            cursor: 'pointer !important',
                            pointerEvents: 'auto !important',
                            position: 'relative',
                            zIndex: 99999,
                        }}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
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
                        <span className={`badge ${getStatusBadgeClass(booking.status)}`} style={{ marginTop: '.5rem', display: 'inline-block' }}>
                            Trạng thái: {translateLabel(booking.status)}
                        </span>
                    </div>

                    {/* Chi tiết thông tin */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', borderBottom: '1px dashed var(--border)', paddingBottom: '1rem' }}>
                        <p><b>Nhà hàng:</b> {booking.restaurantName}</p>
                        <p><b>Chi nhánh:</b> {booking.branchName}</p>
                        <p><b>Vị trí bàn:</b> {booking.tables?.map(t => t.tableName || t.name).join(', ') || 'Chưa xếp'}</p>
                        <p><b>Thời gian:</b> {new Date(booking.reservationTime).toLocaleString('vi-VN')}</p>
                        <p><b>Khách hàng:</b> {booking.name} ({booking.phone})</p>
                    </div>

                    {/* Chi tiết món ăn */}
                    {booking.items && booking.items.length > 0 && (
                        <div style={{ marginTop: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border)' }}>
                            <p style={{ fontWeight: 700 }}><ShoppingCart size={16} style={{ verticalAlign: '-3px' }} /> Món đã đặt trước:</p>
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
                            {booking.depositAmount || booking.estimatedTotal ? `${Number(booking.depositAmount || booking.estimatedTotal).toLocaleString('vi-VN')}₫` : '0₫'}
                        </span>
                    </div>

                    {/* Phần Đánh giá - Sử dụng isReviewed để khớp với dữ liệu API */}
                    {booking.status === 'COMPLETED' && (
                        <div style={{ marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--border)' }}>
                            {booking.isReviewed ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '1.25rem',
                                    backgroundColor: '#f0fdf4',
                                    border: '1px solid #bbf7d0',
                                    borderRadius: '12px',
                                    color: '#166534',
                                    fontSize: '.95rem',
                                    fontWeight: 500
                                }}>
                                    <Star size={16} fill="currentColor" style={{ verticalAlign: '-2px' }} /> Bạn đã đánh giá cho đơn đặt bàn này. Cảm ơn sự đồng hành của bạn!
                                </div>
                            ) : (
                                <div style={{
                                    backgroundColor: '#fffdfa',
                                    border: '1px solid #fef3c7',
                                    borderRadius: '16px',
                                    padding: '1.5rem',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                                }}>
                                    <h3 style={{ fontWeight: 750, fontSize: '1.1rem', marginBottom: '1.25rem', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                                        <span style={{ display: 'inline-flex' }}><Sparkles size={18} /></span> Đánh giá trải nghiệm tại nhà hàng
                                    </h3>

                                    {/* Các tiêu chí đánh giá */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                                        {RATING_CATEGORIES.map(({ key, label, icon: Icon }) => (
                                            <div key={key} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: '.5rem .75rem',
                                                backgroundColor: '#ffffff',
                                                borderRadius: '10px',
                                                border: '1px solid var(--border)'
                                            }}>
                                                <span style={{ fontSize: '.9rem', fontWeight: 600, color: '#374151', display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}><Icon size={16} /> {label}</span>
                                                <div style={{ display: 'flex', gap: '.35rem' }}>
                                                    {[1, 2, 3, 4, 5].map(v => (
                                                        <button
                                                            key={v}
                                                            type="button"
                                                            onClick={() => setReviewForm(p => ({ ...p, [key]: v }))}
                                                            style={{
                                                                width: 32,
                                                                height: 32,
                                                                borderRadius: '8px',
                                                                fontWeight: 700,
                                                                fontSize: '1rem',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s ease',
                                                                background: reviewForm[key] >= v ? '#FEF3C7' : '#f3f4f6',
                                                                color: reviewForm[key] >= v ? '#D97706' : '#9ca3af',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                            title={`${v} sao`}
                                                        >
                                                            <Star size={18} fill="currentColor" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Ô nhập nhận xét */}
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <label style={{ fontSize: '.85rem', fontWeight: 600, display: 'block', marginBottom: '.4rem', color: '#4b5563' }}>
                                            Nhận xét chi tiết (Không bắt buộc)
                                        </label>
                                        <textarea
                                            rows={3}
                                            value={reviewForm.comment}
                                            onChange={e => setReviewForm(p => ({ ...p, comment: e.target.value }))}
                                            placeholder="Hãy chia sẻ thêm về món ăn, không gian hoặc thái độ phục vụ nhé..."
                                            style={{
                                                width: '100%',
                                                padding: '.75rem',
                                                borderRadius: '10px',
                                                border: '1px solid var(--border)',
                                                fontSize: '.9rem',
                                                outline: 'none',
                                                backgroundColor: '#fff',
                                                resize: 'vertical',
                                                fontFamily: 'inherit'
                                            }}
                                        />
                                    </div>

                                    {/* Nút gửi đánh giá */}
                                    <button
                                        className="btn-primary"
                                        style={{
                                            width: '100%',
                                            padding: '.875rem',
                                            borderRadius: '10px',
                                            fontWeight: 700,
                                            fontSize: '.95rem',
                                            cursor: submittingReview ? 'not-allowed' : 'pointer'
                                        }}
                                        disabled={submittingReview}
                                        onClick={handleSubmitReview}
                                    >
                                        {submittingReview ? 'Đang gửi đánh giá...' : <><Rocket size={16} style={{ verticalAlign: '-3px' }} /> Gửi đánh giá ngay</>}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}