export default function PaymentQRCode({ url }) {
  return (
    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
      <div style={{ display: 'inline-block', padding: '1rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 2px 4px rgb(0 0 0 / 0.02)' }}>
        <img src={url} alt="Payment QR Code" style={{ width: 200, height: 200, display: 'block' }} />
      </div>
      <p style={{ margin: '.75rem 0 0 0', fontSize: '.85rem', color: '#64748b', fontWeight: 500 }}>
        Quét QR bằng ứng dụng ngân hàng hoặc ví điện tử
      </p>
    </div>
  );
}