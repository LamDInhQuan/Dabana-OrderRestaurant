import React from 'react'

// Hàm tạo danh sách mốc giờ từ 00:00 đến 23:30
const generateTimeOptions = () => {
  const options = []
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hStr = String(h).padStart(2, '0')
      const mStr = String(m).padStart(2, '0')
      const value = `${hStr}:${mStr}` // Giá trị lưu vào state: "08:00", "18:30"
      
      // Xử lý nhãn hiển thị tiếng Việt
      let session = 'sáng'
      if (h >= 12 && h < 18) session = 'chiều'
      else if (h >= 18 && h < 22) session = 'tối'
      else if (h >= 22 || h < 4) session = 'đêm'

      let h12 = h % 12
      if (h12 === 0) h12 = 12

      const label = `${h12}:${mStr} ${session}` // "8:00 sáng", "6:30 tối"
      options.push({ value, label })
    }
  }
  return options
}

const TIME_OPTIONS = generateTimeOptions()

export default function TimeSelectVN({ value, onChange, style }) {
  // Chuẩn hóa value chỉ lấy HH:mm (bỏ :00 giây nếu có)
  const cleanValue = value ? value.slice(0, 5) : '08:00'

  return (
    <select
      value={cleanValue}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: '.45rem .6rem',
        borderRadius: 6,
        border: '1px solid var(--border, #D1D5DB)',
        fontSize: '.82rem',
        fontWeight: 500,
        backgroundColor: '#fff',
        cursor: 'pointer',
        width: '100%',
        ...style
      }}
    >
      {TIME_OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}