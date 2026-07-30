import React, { useState } from 'react'
import TimeSelectVN from './TimeSelectVN' // Component chọn giờ
// Giả định project dùng react-hot-toast hoặc thay bằng hàm thông báo của bạn
import { toast } from 'react-hot-toast' 
import { operatingHourApi } from '../../../../api'



const DOW_LABELS = [
  { key: 'MONDAY', label: 'Thứ 2' },
  { key: 'TUESDAY', label: 'Thứ 3' },
  { key: 'WEDNESDAY', label: 'Thứ 4' },
  { key: 'THURSDAY', label: 'Thứ 5' },
  { key: 'FRIDAY', label: 'Thứ 6' },
  { key: 'SATURDAY', label: 'Thứ 7' },
  { key: 'SUNDAY', label: 'Chủ nhật' },
]

function uid() { return Math.random().toString(36).slice(2, 9) }

export default function WeeklyHoursPanel({
  activeBranch, 
  activeDays, 
  weeklyHours, 
  setActiveDays, 
  setWeeklyHours, 
  onSaveWeekly // Hoặc hàm lưu truyền từ component cha vào
}) {
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [saving, setSaving] = useState(false)

  const missingDays = DOW_LABELS.filter(d => !activeDays.includes(d.key))
  const sortedActiveDays = DOW_LABELS.filter(d => activeDays.includes(d.key))

  const removeDay = (dayKey) => {
    setActiveDays(prev => prev.filter(k => k !== dayKey))
  }

  const addDay = (dayKey) => {
    if (!activeDays.includes(dayKey)) {
      setActiveDays(prev => [...prev, dayKey])
      if (!weeklyHours[dayKey] || weeklyHours[dayKey].shifts.length === 0) {
        setWeeklyHours(prev => ({
          ...prev,
          [dayKey]: { shifts: [{ id: uid(), open: '08:00', close: '22:00', shiftName: 'Ca 1' }] }
        }))
      }
    }
  }

  // Cập nhật state local khi người dùng gõ thay đổi giờ hoặc tên ca
  const updateShiftTime = (dayKey, shiftId, field, value) => {
    setWeeklyHours(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        shifts: prev[dayKey].shifts.map(s => s.id === shiftId ? { ...s, [field]: value } : s)
      }
    }))
  }

  // THÊM CA MỚI TRÊN GIAO DIỆN (Không gọi API)
  const addShift = (dayKey) => {
    const currentShifts = weeklyHours[dayKey]?.shifts || []
    setWeeklyHours(prev => ({
      ...prev,
      [dayKey]: { 
        ...prev[dayKey], 
        shifts: [
          ...currentShifts, 
          { id: uid(), open: '12:00', close: '16:00', shiftName: `Ca ${currentShifts.length + 1}` }
        ] 
      }
    }))
  }

  // XÓA CA TRÊN GIAO DIỆN
  const removeShift = (dayKey, shiftId) => {
    setWeeklyHours(prev => ({
      ...prev,
      [dayKey]: { 
        ...prev[dayKey], 
        shifts: prev[dayKey].shifts.filter(s => s.id !== shiftId) 
      }
    }))
  }

  // GỘP VÀ GỬI TOÀN BỘ LÊN SERVER KHI BẤM NÚT LƯU Ở CUỐI TRANG
  const handleSaveAll = async () => {
    if (!activeBranch?.id) {
      toast.error("Không tìm thấy thông tin chi nhánh!");
      return;
    }

    setSaving(true)
    try {
      const payload = activeDays.flatMap(dayKey => {
        const shifts = weeklyHours[dayKey]?.shifts || []
        return shifts.map((shift, index) => ({
          // Nếu id là chuỗi ngẫu nhiên do frontend sinh ra, gửi lên là null để backend hiểu là tạo mới
          id: typeof shift.id === 'string' ? null : shift.id,
          dayOfWeek: dayKey,
          openTime: shift.open.length === 5 ? `${shift.open}:00` : shift.open,
          closeTime: shift.close.length === 5 ? `${shift.close}:00` : shift.close,
          shiftName: shift.shiftName || `Ca ${index + 1}`
        }))
      })

      // Gọi API lưu toàn bộ danh sách
      await operatingHourApi.save(activeBranch.id, payload)
      toast.success("Lưu khung giờ hoạt động thành công!")
      
      if (onSaveWeekly) onSaveWeekly(payload)
    } catch (error) {
      console.error("Lỗi khi lưu khung giờ:", error)
      toast.error("Lưu khung giờ thất bại!")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: '.8rem', color: 'var(--brand)', textTransform: 'uppercase', margin: 0 }}>
          Khung giờ hoạt động theo tuần
        </h3>

        {missingDays.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn-sm"
              onClick={() => setShowAddMenu(!showAddMenu)}
              style={{ background: 'var(--brand)', color: '#fff', fontSize: '.75rem', padding: '.4rem .8rem', cursor: 'pointer', borderRadius: 6 }}
            >
              + Thêm ngày hoạt động
            </button>

            {showAddMenu && (
              <div style={{
                position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1px solid var(--border)',
                borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10, minWidth: 150, overflow: 'hidden'
              }}>
                {missingDays.map(d => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => { addDay(d.key); setShowAddMenu(false); }}
                    style={{
                      display: 'block', width: '100%', padding: '.6rem .9rem', textAlign: 'left',
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: '.8rem',
                      borderBottom: '1px solid var(--border)'
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sortedActiveDays.map(({ key, label }) => {
          const day = weeklyHours[key] || { shifts: [] }
          return (
            <div key={key} style={{ padding: '.9rem', border: '1px solid var(--border)', borderRadius: 10 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '.75rem' }}>
                <span style={{ fontWeight: 700, fontSize: '.9rem', minWidth: 90 }}>{label}</span>
                <button type="button" onClick={() => removeDay(key)} className="btn-sm" style={{ background: '#FEE2E2', color: '#B91C1C', fontSize: '.72rem' }}>
                  Xóa ngày
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                {day.shifts.map((shift, idx) => (
                  <div key={shift.id} className="flex items-center gap-2" style={{ background: '#F9FAFB', padding: '.5rem', borderRadius: 6, flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder={`Ca ${idx + 1}`}
                      value={shift.shiftName || ''}
                      onChange={e => updateShiftTime(key, shift.id, 'shiftName', e.target.value)}
                      style={{ width: 100, fontSize: '.78rem', padding: '4px' }}
                    />

                    <div style={{ flex: 1, minWidth: 120 }}>
                      <TimeSelectVN
                        value={shift.open}
                        onChange={(val) => updateShiftTime(key, shift.id, 'open', val)}
                      />
                    </div>

                    <span style={{ color: 'var(--text-muted)' }}>–</span>

                    <div style={{ flex: 1, minWidth: 120 }}>
                      <TimeSelectVN
                        value={shift.close}
                        onChange={(val) => updateShiftTime(key, shift.id, 'close', val)}
                      />
                    </div>

                    {/* Nút xóa ca trên giao diện */}
                    {day.shifts.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeShift(key, shift.id)} 
                        style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1.2rem', padding: '0 5px' }}
                        title="Xóa ca này"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                
                <button F
                  type="button" 
                  onClick={() => addShift(key)} 
                  className="btn-sm" 
                  style={{ alignSelf: 'flex-start', background: 'none', border: '1px dashed var(--border)', color: 'var(--brand)', fontSize: '.75rem', marginTop: '4px', cursor: 'pointer' }}
                >
                  + Thêm ca
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Nút lưu tổng thể ở cuối trang */}
      <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          className="btn-primary" 
          onClick={handleSaveAll} 
          disabled={saving} 
          style={{ padding: '.75rem 1.8rem', cursor: 'pointer' }}
        >
          {saving ? 'Đang lưu...' : '💾 LƯU KHUNG GIỜ HOẠT ĐỘNG'}
        </button>
      </div>
    </div>
  )
}