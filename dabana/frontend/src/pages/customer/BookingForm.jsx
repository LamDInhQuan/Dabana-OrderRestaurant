import React, { useState } from 'react';
import { Sparkles, PartyPopper, ArrowLeft } from 'lucide-react';
import TableSelectionGrid from './component/TableSelectionGrid';
import DynamicMultiRestaurantBooking from './component/DynamicMultiRestaurantBooking';

export default function BookingForm() {
  const [step, setStep] = useState('SEARCH'); // 'SEARCH' hoặc 'BOOKING'
  const [selectedBranch, setSelectedBranch] = useState(null);

  // State form điền thông tin
  const [bName, setBName] = useState('');
  const [bPhone, setBPhone] = useState('');
  const [bEmail, setBEmail] = useState('');
  const [bDate, setBDate] = useState('');
  const [bTime, setBTime] = useState('');
  const [bGuests, setBGuests] = useState('2 người');
  const [bNote, setBNote] = useState('');

  // State chọn bàn và trạng thái thành công
  const [selectedTableIds, setSelectedTableIds] = useState([]);
  const [bookSuccess, setBookSuccess] = useState(false);

  // Dữ liệu mẫu danh sách bàn trống theo chi nhánh
  const [availableTables] = useState([
    { id: 101, name: 'Bàn T01', capacity: 2, zoneName: 'Khu vực Trong nhà', status: 'AVAILABLE' },
    { id: 102, name: 'Bàn T02 (VIP)', capacity: 4, zoneName: 'Phòng VIP', status: 'AVAILABLE' },
    { id: 103, name: 'Bàn T03', capacity: 6, zoneName: 'Khu vực Trong nhà', status: 'AVAILABLE' },
    { id: 104, name: 'Bàn S01', capacity: 4, zoneName: 'Khu vực Sân vườn', status: 'AVAILABLE' },
    { id: 105, name: 'Bàn S02', capacity: 2, zoneName: 'Khu vực Sân vườn', status: 'BOOKED' },
    { id: 106, name: 'Bàn V01', capacity: 10, zoneName: 'Phòng VIP lớn', status: 'AVAILABLE' }
  ]);

  const handleStartBooking = (branchInfo) => {
    setSelectedBranch(branchInfo);
    setStep('BOOKING');
  };

  const handleTableToggle = (tableId) => {
    setSelectedTableIds(prev => 
      prev.includes(tableId) ? prev.filter(id => id !== tableId) : [...prev, tableId]
    );
  };

  const handleBookSubmit = (e) => {
    e.preventDefault();
    if (selectedTableIds.length === 0) {
      alert('Vui lòng chọn ít nhất một bàn trên sơ đồ!');
      return;
    }
    
    console.log('Payload gửi lên Backend:', {
      contactName: bName,
      contactPhone: bPhone,
      contactEmail: bEmail,
      branchId: selectedBranch?.restaurantId,
      branchName: selectedBranch?.branchName,
      reservationTime: `${bDate}T${bTime}:00`,
      guestCount: parseInt(bGuests),
      tableIds: selectedTableIds,
      note: bNote
    });
    setBookSuccess(true);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '2rem 0' }} />
      
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: '1.8rem', fontWeight: 700, color: 'var(--brown)' }}>
          {step === 'SEARCH' ? 'Hệ Thống Đặt Bàn Nhà Hàng' : `Đặt Bàn: ${selectedBranch?.branchName}`}
        </h3>
        <p style={{ fontSize: '.85rem', color: '#666', marginTop: '.4rem' }}>
          {step === 'SEARCH' ? 'Tìm kiếm chi nhánh thuận tiện nhất cho bạn' : 'Vui lòng điền thông tin và chọn bàn bên dưới'}
        </p>
      </div>

      {step === 'SEARCH' && (
        <DynamicMultiRestaurantBooking onStartBooking={handleStartBooking} />
      )}

      {step === 'BOOKING' && (
        <div>
          <button 
            onClick={() => { setStep('SEARCH'); setBookSuccess(false); setSelectedTableIds([]); }} 
            style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '.5rem', color: 'var(--brown)', cursor: 'pointer', fontWeight: 600, marginBottom: '1.5rem', fontSize: '.9rem' }}
          >
            <ArrowLeft size={16} /> Quay lại danh sách chi nhánh
          </button>

          {!bookSuccess ? (
            <form onSubmit={handleBookSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                {[
                  { label: 'Họ và tên', value: bName, setter: setBName, placeholder: 'Nguyễn Văn A', type: 'text' },
                  { label: 'Số điện thoại', value: bPhone, setter: setBPhone, placeholder: '0901 234 567', type: 'text' },
                  { label: 'Email', value: bEmail, setter: setBEmail, placeholder: 'email@gmail.com', type: 'email' },
                ].map(f => (
                  <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                    <label style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--brown-mid)' }}>{f.label}</label>
                    <input type={f.type} value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder} required style={{ padding: '.75rem 1rem', border: '1px solid var(--border)', borderRadius: 2 }} />
                  </div>
                ))}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                  <label style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--brown-mid)' }}>Ngày đến</label>
                  <input type="date" value={bDate} onChange={e => setBDate(e.target.value)} min={new Date().toISOString().split('T')[0]} required style={{ padding: '.75rem 1rem', border: '1px solid var(--border)', borderRadius: 2 }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                  <label style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--brown-mid)' }}>Giờ đến</label>
                  <select value={bTime} onChange={e => setBTime(e.target.value)} required style={{ padding: '.75rem 1rem', border: '1px solid var(--border)', borderRadius: 2 }}>
                    <option value="">— Chọn giờ —</option>
                    {['17:00', '18:00', '19:00', '20:00'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                  <label style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--brown-mid)' }}>Số khách</label>
                  <select value={bGuests} onChange={e => setBGuests(e.target.value)} style={{ padding: '.75rem 1rem', border: '1px solid var(--border)', borderRadius: 2 }}>
                    {['1 người', '2 người', '4 người', '6 người', 'Trên 10 người'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                  <TableSelectionGrid 
                    tables={availableTables} 
                    selectedTableIds={selectedTableIds} 
                    onSelectTable={handleTableToggle} 
                    guestCount={bGuests}
                  />
                </div>

                <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                  <label style={{ fontSize: '.75rem', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--brown-mid)' }}>Yêu cầu đặc biệt</label>
                  <textarea value={bNote} onChange={e => setBNote(e.target.value)} rows={3} placeholder="Dị ứng thực phẩm, sinh nhật..." style={{ padding: '.75rem 1rem', border: '1px solid var(--border)', borderRadius: 2 }} />
                </div>

                <div style={{ gridColumn: '1/-1', textAlign: 'center', marginTop: '.5rem' }}>
                  <button type="submit" style={{ background: 'var(--gold)', color: 'var(--brown)', border: 'none', padding: '1rem 3.5rem', fontSize: '.9rem', fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: 2 }}>
                    <Sparkles size={16} style={{ verticalAlign: '-3px' }} /> Xác Nhận Đặt Bàn <Sparkles size={16} style={{ verticalAlign: '-3px' }} />
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div style={{ background: 'linear-gradient(135deg,#3d2b1f,#6b4226)', color: 'var(--gold-light)', padding: '3rem 2rem', textAlign: 'center', borderRadius: 4 }}>
              <div style={{ marginBottom: '1rem' }}><PartyPopper size={48} /></div>
              <h3 style={{ fontFamily: "'Cormorant Garamond',Georgia,serif", fontSize: '1.8rem', fontWeight: 700, marginBottom: '.75rem' }}>Đặt bàn thành công!</h3>
              <p style={{ color: 'rgba(232,201,122,.75)', fontSize: '.95rem', lineHeight: 1.7 }}>
                Chúng tôi sẽ liên hệ xác nhận qua điện thoại/email trong vài phút.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}