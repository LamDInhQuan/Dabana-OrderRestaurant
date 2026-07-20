export default function PaymentHeader({ onBack }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
      <button 
        onClick={onBack} 
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 600, color: '#475569', display: 'flex', alignItems: 'center', gap: '.5rem' }}
      >
        ← Quay lại
      </button>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginLeft: '2rem', margin: 0 }}>Thanh toán tiền cọc</h2>
    </div>
  );
}