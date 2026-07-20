import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../../components/Navbar';
import toast from 'react-hot-toast';
import PaymentHeader from './PaymentHeader';
import PaymentSummary from './PaymentSummary';
import PaymentQRCode from './PaymentQRCode'; 
import PaymentCountdown from './PaymentCountdown';
import PaymentStatus from './PaymentStatus';
import { bookingApi, paymentApi } from '../../../api';
import { QRCodeSVG } from 'qrcode.react'; 

export default function PaymentPage() {
  const { bookingId } = useParams();
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 1. 🚀 Load thông tin đơn hàng và đồng thời tạo Link QR từ PayOS
  useEffect(() => {
    bookingApi.getById(bookingId)
      .then(res => {
        const bookingData = res.data?.data || res.data;

        // Hãy kiểm tra hàm API này, đảm bảo truyền đúng cấu trúc { bookingId } hoặc param mà BE yêu cầu nhé Quân
        return paymentApi.createPaymentLink(bookingId)
          .then(payosRes => {
            const payosData = payosRes.data?.data || payosRes.data;

            setPayment({
              bookingId: bookingData.id,
              bookingCode: bookingData.code || `BK${bookingData.id}`,
              status: bookingData.status,
              depositAmount: payosData.amount || 2000, 
              restaurantName: "Nhà hàng Dabana",
              branchName: bookingData.branch?.name || "Chi nhánh hệ thống",
              reservationTime: bookingData.reservationTime,
              guestCount: bookingData.guestCount,
              expiresAt: bookingData.holdExpiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString(),

              bankName: "MB Bank",
              accountNumber: "240530066868",
              accountHolder: "NGO XUAN TUNG",
              transferContent: `${bookingId}`, 

              qrImageUrl: payosData.qrCode, 
              checkoutUrl: payosData.checkoutUrl 
            });
            setLoading(false);
          });
      })
      .catch(err => {
        console.error("Lỗi khởi tạo luồng thanh toán:", err);
        toast.error("Không thể tải thông tin cổng thanh toán PayOS");
        setLoading(false);
      });
  }, [bookingId]);

  // 2. 🔄 POLLING: Kiểm tra trạng thái đơn hàng
  useEffect(() => {
    if (!payment || payment.status === 'CONFIRMED' || payment.status === 'SUCCESS') return;

    const timer = setInterval(() => {
      bookingApi.getById(bookingId)
        .then(res => {
          const bookingData = res.data?.data || res.data;
          if (bookingData.status === 'CONFIRMED') {
            clearInterval(timer);
            setPayment(prev => ({ ...prev, status: 'CONFIRMED' }));
            toast.success("Thanh toán thành công! Đơn hàng đã được xác nhận.");
            setTimeout(() => {
              navigate(`/my-bookings/${bookingId}/invoice`); 
            }, 3000);
          }
        })
        .catch(err => console.error("Lỗi cập nhật trạng thái:", err));
    }, 2000);

    return () => clearInterval(timer);
  }, [payment, bookingId, navigate]);

  const handleMockSuccessApi = async () => {
    try {
      await paymentApi.mockSuccess(bookingId);
      toast.success("Đã kích hoạt giả lập thành công!");
    } catch (err) {
      console.error(err);
      toast.error("Không thể kích hoạt lệnh giả lập");
    }
  };

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Đang khởi tạo mã QR bảo mật từ PayOS...</div>;
  }

  // 🔥 ĐOẠN PHÒNG VỆ CỐT LÕI: Nếu API lỗi làm payment = null, hiển thị giao diện báo lỗi thay vì để crash ứng dụng
  if (!payment) {
    return (
      <>
        <Navbar />
        <div style={{ padding: '3rem', textAlign: 'center' }}>
          <h3 style={{ color: '#ef4444' }}>⚠️ Không thể khởi tạo dữ liệu thanh toán</h3>
          <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Vui lòng kiểm tra lại trạng thái đơn hàng hoặc kết nối mạng của Backend.</p>
          <button 
            onClick={() => navigate('/my-bookings')}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#0052cc', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            Quay lại đơn hàng của tôi
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={{ background: '#f8fafc', minHeight: 'calc(100vh - 70px)', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>

          <PaymentHeader onBack={() => navigate('/my-bookings')} />

          <div className="card" style={{ padding: '2rem', background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }}>

            <PaymentSummary payment={payment} />

            <hr style={{ border: 0, borderTop: '1px dashed #cbd5e1', margin: '1.5rem 0' }} />

            {/* Sử dụng dấu ? an toàn để phòng tránh lỗi undefined thuộc tính */}
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              {payment.qrImageUrl && payment.qrImageUrl.startsWith('000201') ? (
                <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 12, display: 'inline-block' }}>
                  <QRCodeSVG value={payment.qrImageUrl} size={220} includeMargin={true} />
                  <div style={{ fontSize: '.8rem', color: '#64748b', marginTop: '.5rem' }}>
                    Quét mã bằng ứng dụng Ngân hàng của bạn
                  </div>
                </div>
              ) : (
                <PaymentQRCode url={payment.qrImageUrl} />
              )}
            </div>


            <div style={{ background: '#f1f5f9', padding: '1rem', borderRadius: 8, margin: '1.5rem 0', fontSize: '.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                <span style={{ color: '#64748b' }}>Ngân hàng:</span>
                <span style={{ fontWeight: 700 }}>{payment.bankName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                <span style={{ color: '#64748b' }}>Số tài khoản:</span>
                <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{payment.accountNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                <span style={{ color: '#64748b' }}>Chủ tài khoản:</span>
                <span style={{ fontWeight: 700 }}>{payment.accountHolder}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Nội dung chuyển khoản:</span>
                <span style={{ fontWeight: 700, color: '#b91c1c' }}>{payment.transferContent}</span>
              </div>
            </div>

            <hr style={{ border: 0, borderTop: '1px solid #e2e8f0', margin: '1.5rem 0' }} />

            <PaymentCountdown
              expiresAt={payment.expiresAt}
              onTimeout={() => {
                toast.error("Đơn hàng đã hết hạn thanh toán!");
                navigate('/my-bookings');
              }}
            />

            <PaymentStatus status={payment.status} />

          </div>
        </div>
      </div>
    </>
  );
}