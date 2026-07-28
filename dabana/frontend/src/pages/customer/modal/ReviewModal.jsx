import { useState } from 'react';

const RATING_CATEGORIES = [
    { key: 'spaceRating', label: '🏠 Không gian' },
    { key: 'serviceRating', label: '👨‍🍳 Phục vụ' },
    { key: 'foodRating', label: '🍴 Đồ ăn' },
];

export default function ReviewModal({ booking, onClose, onSubmit }) {
    const [reviewForm, setReviewForm] = useState({ 
        spaceRating: 5, 
        serviceRating: 5, 
        foodRating: 5, 
        comment: '' 
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onSubmit({
                ...reviewForm,
                bookingId: booking.id
            });
        } catch (err) {
            // Lỗi đã được xử lý ở component cha hoặc toast
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
        }}>
            <div style={{
                backgroundColor: '#fff',
                borderRadius: '16px',
                width: '100%',
                maxWidth: '500px',
                padding: '1.75rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                position: 'relative'
            }}>
                {/* Nút đóng */}
                <button 
                    type="button"
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1.25rem',
                        right: '1.25rem',
                        background: 'none',
                        border: 'none',
                        fontSize: '1.25rem',
                        cursor: 'pointer',
                        color: '#9ca3af',
                        fontWeight: 700
                    }}
                >
                    ✕
                </button>

                <h3 style={{ fontWeight: 750, fontSize: '1.2rem', marginBottom: '.25rem', color: '#1f2937' }}>
                    ✨ Đánh giá trải nghiệm
                </h3>
                <p style={{ fontSize: '.85rem', color: 'var(--text-muted, #6b7280)', marginBottom: '1.25rem' }}>
                    Nhà hàng: <b>{booking.branchName}</b> (Mã đơn: #{booking.id})
                </p>

                <form onSubmit={handleSubmit}>
                    {/* Các tiêu chí đánh giá dạng hàng ngang */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.875rem', marginBottom: '1.25rem' }}>
                        {RATING_CATEGORIES.map(({ key, label }) => (
                            <div key={key} style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                padding: '.5rem .75rem',
                                backgroundColor: '#f9fafb',
                                borderRadius: '10px',
                                border: '1px solid var(--border, #e5e7eb)'
                            }}>
                                <span style={{ fontSize: '.9rem', fontWeight: 600, color: '#374151' }}>{label}</span>
                                <div style={{ display: 'flex', gap: '.3rem' }}>
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
                                                background: reviewForm[key] >= v ? '#FEF3C7' : '#e5e7eb',
                                                color: reviewForm[key] >= v ? '#D97706' : '#9ca3af',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            title={`${v} sao`}
                                        >
                                            ★
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
                                border: '1px solid var(--border, #e5e7eb)',
                                fontSize: '.9rem',
                                outline: 'none',
                                backgroundColor: '#fff',
                                resize: 'vertical',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>

                    {/* Nút thao tác */}
                    <div style={{ display: 'flex', gap: '.75rem' }}>
                        <button 
                            type="button"
                            className="btn-outline" 
                            style={{ flex: 1, padding: '.75rem', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}
                            onClick={onClose}
                        >
                            Huỷ bỏ
                        </button>
                        <button 
                            type="submit"
                            className="btn-primary" 
                            style={{ flex: 1, padding: '.75rem', borderRadius: '10px', fontWeight: 700, cursor: submitting ? 'not-allowed' : 'pointer' }}
                            disabled={submitting}
                        >
                            {submitting ? 'Đang gửi...' : '🚀 Gửi đánh giá'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}