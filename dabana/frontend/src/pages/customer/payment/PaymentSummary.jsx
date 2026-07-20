export default function PaymentSummary({ payment }) {
  return (
    <div>
      <div style={{ marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{payment.restaurantName}</h3>
        <p style={{ margin: '.25rem 0 0 0', color: '#64748b', fontSize: '.85rem' }}>{payment.branchName}</p>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem', fontSize: '.9rem', color: '#334155', marginBottom: '1rem' }}>
        <span>🕒 {new Date(payment.reservationTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
        <span>👥 {payment.guestCount} khách</span>
        <span>🆔 #{payment.bookingCode}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '1rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
        <span style={{ fontWeight: 600, color: '#475569' }}>Tổng tiền cọc:</span>
        <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#b91c1c' }}>
          {Number(payment.depositAmount).toLocaleString('vi-VN')}₫
        </span>
      </div>
    </div>
  );
}