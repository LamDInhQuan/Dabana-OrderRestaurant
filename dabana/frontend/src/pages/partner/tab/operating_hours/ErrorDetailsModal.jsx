import React from 'react'

// Hàm quét toàn bộ chuỗi message và chuyển đổi các mốc giờ dạng "HH:mm" -> tiếng Việt
const formatMessageTimes = (msg) => {
  if (!msg) return ''
  
  return msg.replace(/\b([01]?\d|2[0-3]):[0-5]\d(:[0-5]\d)?\b/g, (match) => {
    const cleanTime = match.slice(0, 5)
    const [hStr, mStr] = cleanTime.split(':')
    let h = parseInt(hStr, 10)
    const m = mStr || '00'
    
    let session = 'sáng'
    if (h >= 12 && h < 18) session = 'chiều'
    else if (h >= 18 && h < 22) session = 'tối'
    else if (h >= 22 || h < 4) session = 'đêm'

    let h12 = h % 12
    if (h12 === 0) h12 = 12

    return `${h12}:${m} ${session}`
  })
}

export default function ErrorDetailsModal({ isOpen, title, errorDetails, onClose }) {
  if (!isOpen) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: '1.5rem', width: '90%', maxWidth: 580,
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ margin: 0, color: '#DC2626', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
            ⚠️ {formatMessageTimes(title)}
          </h3>
          <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#6B7280' }}>✕</button>
        </div>

        {/* Table Details */}
        <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '.85rem' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <th style={{ padding: '.6rem .8rem', color: '#374151', width: '25%' }}>Thứ</th>
                <th style={{ padding: '.6rem .8rem', color: '#374151' }}>Chi tiết xung đột / Lỗi</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(errorDetails) && errorDetails.length > 0 ? (
                errorDetails.map((err, idx) => (
                  <tr key={idx} style={{ borderBottom: idx !== errorDetails.length - 1 ? '1px solid #F3F4F6' : 'none' }}>
                    <td style={{ padding: '.6rem .8rem', fontWeight: 600, color: '#1F2937', whiteSpace: 'nowrap' }}>
                      {err.dayOfWeek || 'Chung'}
                    </td>
                    <td style={{ padding: '.6rem .8rem', color: '#DC2626', lineHeight: 1.4 }}>
                      {/* Tự động convert giờ trong câu message lỗi */}
                      {formatMessageTimes(err.message)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} style={{ padding: '1rem', textAlign: 'center', color: '#6B7280' }}>
                    Không có chi tiết lỗi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '1.25rem', textAlign: 'right' }}>
          <button 
            onClick={onClose}
            style={{
              padding: '.5rem 1.2rem', background: '#374151', color: '#fff',
              border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600
            }}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}