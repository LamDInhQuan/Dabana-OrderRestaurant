import React, { useState } from 'react'
import TimeSelectVN from './TimeSelectVN' // 👈 Import component chọn giờ

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
  activeDays, weeklyHours, setActiveDays, setWeeklyHours, onSaveWeekly
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
          [dayKey]: { shifts: [{ id: uid(), open: '08:00', close: '22:00', shiftName: '' }] }
        }))
      }
    }
  }

  const updateShiftTime = (dayKey, shiftId, field, value) => {
    setWeeklyHours(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        shifts: prev[dayKey].shifts.map(s => s.id === shiftId ? { ...s, [field]: value } : s)
      }
    }))
  }

  const addShift = (dayKey) => {
    setWeeklyHours(prev => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], shifts: [...prev[dayKey].shifts, { id: uid(), open: '12:00', close: '16:00', shiftName: '' }] }
    }))
  }

  const removeShift = (dayKey, shiftId) => {
    setWeeklyHours(prev => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], shifts: prev[dayKey].shifts.filter(s => s.id !== shiftId) }
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = activeDays.flatMap(dayKey => {
        const shifts = weeklyHours[dayKey]?.shifts || []
        return shifts.map((shift, index) => ({
          id: typeof shift.id === 'number' ? shift.id : null,
          dayOfWeek: dayKey,
          openTime: shift.open.length === 5 ? `${shift.open}:00` : shift.open,
          closeTime: shift.close.length === 5 ? `${shift.close}:00` : shift.close,
          shiftName: shift.shiftName || `Ca ${index + 1}`
        }))
      })
      await onSaveWeekly(payload)
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
                  <div key={shift.id} className="flex items-center gap-2" style={{ background: '#F9FAFB', padding: '.5rem', borderRadius: 6 }}>
                    <input
                      type="text"
                      placeholder={`Ca ${idx + 1}`}
                      value={shift.shiftName || ''}
                      onChange={e => updateShiftTime(key, shift.id, 'shiftName', e.target.value)}
                      style={{ width: 100, fontSize: '.78rem' }}
                    />

                    {/* 👇 Đã thay bằng Dropdown chọn giờ Tiếng Việt */}
                    <div style={{ flex: 1 }}>
                      <TimeSelectVN
                        value={shift.open}
                        onChange={(val) => updateShiftTime(key, shift.id, 'open', val)}
                      />
                    </div>

                    <span style={{ color: 'var(--text-muted)' }}>–</span>

                    {/* 👇 Đã thay bằng Dropdown chọn giờ Tiếng Việt */}
                    <div style={{ flex: 1 }}>
                      <TimeSelectVN
                        value={shift.close}
                        onChange={(val) => updateShiftTime(key, shift.id, 'close', val)}
                      />
                    </div>

                    {day.shifts.length > 1 && (
                      <button type="button" onClick={() => removeShift(key, shift.id)} style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1.2rem' }}>×</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => addShift(key)} className="btn-sm" style={{ alignSelf: 'flex-start', background: 'none', border: '1px dashed var(--border)', color: 'var(--brand)', fontSize: '.75rem' }}>
                  + Thêm ca
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '.75rem 1.8rem' }}>
          {saving ? 'Đang lưu...' : '💾 LƯU KHUNG GIỜ HOẠT ĐỘNG'}
        </button>
      </div>
    </div>
  )
}