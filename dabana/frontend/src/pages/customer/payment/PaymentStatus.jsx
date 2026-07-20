export default function PaymentStatus({ status }) {
  const isSuccess = status === 'SUCCESS';

  return (
    <div style={{ 
      textAlign: 'center', 
      padding: '.75rem', 
      borderRadius: 8, 
      fontWeight: 700,
      background: isSuccess ? '#dcfce7' : '#eff6ff', 
      color: isSuccess ? '#15803d' : '#1d4ed8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '.5rem'
    }}>
      {!isSuccess && <span className="spinner" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #1d4ed8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>}
      <span>{isSuccess ? '🎉 Thanh toán thành công!' : '🔄 Đang chờ thanh toán qua ngân hàng...'}</span>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}