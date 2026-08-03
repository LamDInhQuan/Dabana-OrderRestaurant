import React, { useState } from 'react'
import TimeSelectVN from './TimeSelectVN'
import { Save, Plus, Trash2, Copy, Clock, Calendar, Check, AlertCircle } from 'lucide-react'
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

function uid() {
  return 'temp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9)
}

export default function WeeklyHoursPanel({
  activeBranch,
  activeDays,
  weeklyHours,
  setActiveDays,
  setWeeklyHours,
  onSaveWeekly,
  onError
}) {
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [saving, setSaving] = useState(false)

  const missingDays = DOW_LABELS.filter(d => !activeDays.includes(d.key))
  const sortedActiveDays = DOW_LABELS.filter(d => activeDays.includes(d.key))

  const labelByCode = (key) => {
    const found = DOW_LABELS.find(d => d.key === key)
    return found ? found.label : key
  }

  // Thêm ngày hoạt động
  const addDay = (dayKey) => {
    if (!activeDays.includes(dayKey)) {
      setActiveDays(prev => [...prev, dayKey])
      if (!weeklyHours[dayKey] || (weeklyHours[dayKey].shifts && weeklyHours[dayKey].shifts.length === 0)) {
        setWeeklyHours(prev => ({
          ...prev,
          [dayKey]: {
            shifts: [{ id: uid(), open: '08:00', close: '22:00', shiftName: 'Ca 1' }]
          }
        }))
      }
    }
  }

  // Cập nhật giờ hoặc tên ca trong state
  const updateShiftTime = (dayKey, shiftId, field, value) => {
    setWeeklyHours(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        shifts: (prev[dayKey]?.shifts || []).map(s => {
          return s.id === shiftId
            ? { ...s, [field]: value }
            : s
        })
      }
    }))
  }

  // Thêm ca mới vào một ngày
  const addShift = (dayKey) => {
    const currentShifts = weeklyHours[dayKey]?.shifts || []

    // Tự động gợi ý giờ tiếp theo nếu có ca trước đó
    let nextOpen = '12:00'
    let nextClose = '16:00'
    if (currentShifts.length > 0) {
      const lastShift = currentShifts[currentShifts.length - 1]
      if (lastShift.close && lastShift.close < '23:00') {
        const [h, m] = lastShift.close.split(':').map(Number)
        const newH = Math.min(h + 1, 23)
        const closeH = Math.min(newH + 4, 23)
        nextOpen = `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
        nextClose = `${String(closeH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      }
    }

    setWeeklyHours(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        shifts: [
          ...currentShifts,
          {
            id: uid(),
            open: nextOpen,
            close: nextClose,
            shiftName: `Ca ${currentShifts.length + 1}`
          }
        ]
      }
    }))
  }

  // Xóa ca khỏi danh sách (Không gọi API riêng lẻ, đồng bộ trong state)
  const removeShift = (dayKey, shiftId) => {
    setWeeklyHours(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        shifts: (prev[dayKey]?.shifts || []).filter(s => s.id !== shiftId)
      }
    }))
    toast.success("Đã xóa ca khỏi danh sách");
  }

  // Xóa ngày hoạt động
  const removeDay = (dayKey) => {
    setActiveDays(prev => prev.filter(k => k !== dayKey))
    setWeeklyHours(prev => {
      const copy = { ...prev }
      delete copy[dayKey]
      return copy
    })
    toast.success(`Đã xóa ${labelByCode(dayKey)} khỏi lịch hoạt động`)
  }

  // Sao chép khung giờ của 1 ngày sang tất cả các ngày khác đang bật
  const copyToAllDays = (sourceDayKey) => {
    const sourceShifts = weeklyHours[sourceDayKey]?.shifts || []
    if (sourceShifts.length === 0) {
      toast.error("Ngày này chưa có ca nào để sao chép!");
      return
    }

    setWeeklyHours(prev => {
      const updated = { ...prev }
      activeDays.forEach(dayKey => {
        if (dayKey !== sourceDayKey) {
          updated[dayKey] = {
            shifts: sourceShifts.map((s, idx) => ({
              id: uid(),
              open: s.open,
              close: s.close,
              shiftName: s.shiftName || `Ca ${idx + 1}`
            }))
          }
        }
      })
      return updated
    })

    toast.success(`Đã sao chép khung giờ của ${labelByCode(sourceDayKey)} sang tất cả các ngày!`)
  }

  // LƯU TẤT CẢ KHUNG GIỜ CỦA TẤT CẢ CÁC NGÀY VÀ CÁC CA (1 Nút lưu duy nhất)
  const handleSaveAll = async () => {
    if (!activeBranch?.id) {
      toast.error("Không tìm thấy thông tin chi nhánh!");
      return
    }

    if (activeDays.length === 0) {
      if (!window.confirm("Bạn chưa chọn ngày hoạt động nào. Điều này sẽ xóa toàn bộ lịch mở cửa của chi nhánh. Bạn có chắc chắn muốn lưu không?")) {
        return
      }
    }

    // Validation các ngày & các ca
    for (const dayKey of activeDays) {
      const dayLabel = labelByCode(dayKey)
      const shifts = weeklyHours[dayKey]?.shifts || []

      if (shifts.length === 0) {
        toast.error(`Vui lòng thêm ít nhất một ca cho ${dayLabel} hoặc xóa ngày này khỏi danh sách!`)
        return
      }

      for (let i = 0; i < shifts.length; i++) {
        const s = shifts[i]
        const shiftTitle = s.shiftName?.trim() || `Ca ${i + 1}`

        if (!s.open || !s.close) {
          toast.error(`${dayLabel} - ${shiftTitle}: Vui lòng chọn đầy đủ giờ mở và giờ đóng!`)
          return
        }

        if (s.open >= s.close) {
          toast.error(`${dayLabel} - ${shiftTitle}: Giờ kết thúc (${s.close}) phải sau giờ bắt đầu (${s.open})!`)
          return
        }
      }

      // Kiểm tra trùng lặp/chồng lấn giờ giữa các ca trong cùng 1 ngày
      const sortedShifts = [...shifts].sort((a, b) => a.open.localeCompare(b.open))
      for (let i = 0; i < sortedShifts.length - 1; i++) {
        const curr = sortedShifts[i]
        const next = sortedShifts[i + 1]
        if (next.open < curr.close) {
          toast.error(`${dayLabel}: Ca "${curr.shiftName || 'Ca ' + (i + 1)}" (${curr.open} - ${curr.close}) bị chồng lấn thời gian với ca "${next.shiftName || 'Ca ' + (i + 2)}" (${next.open} - ${next.close})!`)
          return
        }
      }
    }

    // Xây dựng payload DTO hoàn chỉnh
    const payload = []
    for (const dayKey of activeDays) {
      const shifts = weeklyHours[dayKey]?.shifts || []
      shifts.forEach((shift, idx) => {
        payload.push({
          dayOfWeek: dayKey,
          openTime: shift.open.length === 5 ? `${shift.open}:00` : shift.open,
          closeTime: shift.close.length === 5 ? `${shift.close}:00` : shift.close,
          shiftName: shift.shiftName?.trim() || `Ca ${idx + 1}`
        })
      })
    }

    try {
      setSaving(true)
      if (onSaveWeekly) {
        await onSaveWeekly(payload)
      } else {
        await operatingHourApi.save(activeBranch.id, payload)
        toast.success("Đã cập nhật toàn bộ khung giờ hoạt động thành công!")
      }
    } catch (err) {
      console.error("Lỗi khi lưu toàn bộ khung giờ:", err)
      if (onError) {
        onError(err)
      } else {
        const msg = err?.response?.data?.message || err?.message || "Lưu khung giờ thất bại!"
        toast.error(msg)
      }
    } finally {
      setSaving(false)
    }
  }

  // Đếm tổng số ca
  const totalShiftsCount = activeDays.reduce((acc, dayKey) => {
    return acc + (weeklyHours[dayKey]?.shifts?.length || 0)
  }, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Bar */}
      <div className="card" style={{ padding: '1.25rem', background: '#fff', borderRadius: 12, border: '1px solid var(--border)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <Clock size={20} style={{ color: 'var(--brand, #3b82f6)' }} />
              <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#1E293B', margin: 0 }}>
                Khung giờ hoạt động theo tuần
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>
              Cấu hình các ca mở cửa trong tuần ({activeDays.length} ngày hoạt động, {totalShiftsCount} ca).
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Nút Thêm ngày */}
            {missingDays.length > 0 && (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  style={{
                    background: '#F1F5F9',
                    color: '#334155',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    padding: '0.5rem 0.9rem',
                    cursor: 'pointer',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    transition: 'all 0.15s'
                  }}
                >
                  <Plus size={15} /> Thêm ngày
                </button>

                {showAddMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '115%',
                      background: '#fff',
                      border: '1px solid var(--border)',
                      borderRadius: 10,
                      boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                      zIndex: 30,
                      minWidth: 160,
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{ padding: '0.4rem 0.75rem', fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                      Chọn ngày thêm
                    </div>
                    {missingDays.map(d => (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => { addDay(d.key); setShowAddMenu(false); }}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: '0.6rem 0.9rem',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.82rem',
                          color: '#1E293B',
                          borderBottom: '1px solid #F1F5F9',
                          transition: 'background 0.15s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#F8FAFC'}
                        onMouseLeave={(e) => e.target.style.background = 'none'}
                      >
                        + {d.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Danh sách các ngày */}
      {sortedActiveDays.length === 0 ? (
        <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px dashed #CBD5E1' }}>
          <AlertCircle size={36} style={{ color: '#94A3B8', margin: '0 auto 0.75rem' }} />
          <h4 style={{ margin: '0 0 0.5rem', color: '#475569', fontSize: '0.95rem' }}>Chưa cấu hình ngày hoạt động nào</h4>
          <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.82rem' }}>
            Nhấn vào nút "+ Thêm ngày" phía trên để bắt đầu thêm khung giờ hoạt động cho chi nhánh.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sortedActiveDays.map(({ key, label }) => {
            const day = weeklyHours[key] || { shifts: [] }
            const shifts = day.shifts || []

            return (
              <div
                key={key}
                style={{
                  padding: '1.1rem',
                  border: '1px solid #E2E8F0',
                  borderRadius: 12,
                  background: '#fff',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}
              >
                {/* Header của từng ngày */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.85rem',
                    borderBottom: '1px solid #F1F5F9',
                    paddingBottom: '0.6rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1E293B' }}>{label}</span>
                    <span
                      style={{
                        background: shifts.length > 0 ? '#EFF6FF' : '#FEF2F2',
                        color: shifts.length > 0 ? '#1D4ED8' : '#DC2626',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 12
                      }}
                    >
                      {shifts.length} ca
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    {/* Nút sao chép sang các ngày khác */}
                    {shifts.length > 0 && activeDays.length > 1 && (
                      <button
                        type="button"
                        onClick={() => copyToAllDays(key)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748B',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.3rem 0.5rem',
                          borderRadius: 6,
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#2563EB'; e.currentTarget.style.background = '#EFF6FF'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B'; e.currentTarget.style.background = 'none'; }}
                        title="Sao chép khung giờ này cho các ngày còn lại"
                      >
                        <Copy size={13} /> Áp dụng cho các ngày khác
                      </button>
                    )}

                    {/* Nút Xóa ngày */}
                    <button
                      type="button"
                      onClick={() => removeDay(key)}
                      style={{
                        background: '#FEF2F2',
                        color: '#DC2626',
                        border: '1px solid #FEE2E2',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '0.3rem 0.6rem',
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      title="Xóa ngày này khỏi danh sách hoạt động"
                    >
                      <Trash2 size={12} /> Xóa ngày
                    </button>
                  </div>
                </div>

                {/* Danh sách các ca trong ngày */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {shifts.length === 0 ? (
                    <div style={{ padding: '0.75rem', background: '#F8FAFC', borderRadius: 8, fontSize: '0.8rem', color: '#94A3B8', textAlign: 'center' }}>
                      Chưa có ca nào. Vui lòng bấm "+ Thêm ca mới" bên dưới.
                    </div>
                  ) : (
                    shifts.map((shift, idx) => (
                      <div
                        key={shift.id}
                        style={{
                          background: '#F8FAFC',
                          padding: '0.65rem 0.75rem',
                          borderRadius: 8,
                          border: '1px solid #E2E8F0',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          flexWrap: 'wrap'
                        }}
                      >
                        {/* Tên ca */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>Tên:</span>
                          <input
                            type="text"
                            placeholder={`Ca ${idx + 1}`}
                            value={shift.shiftName || ''}
                            onChange={e => updateShiftTime(key, shift.id, 'shiftName', e.target.value)}
                            style={{
                              width: 110,
                              fontSize: '0.8rem',
                              padding: '0.35rem 0.5rem',
                              borderRadius: 6,
                              border: '1px solid #CBD5E1',
                              background: '#fff'
                            }}
                          />
                        </div>

                        {/* Giờ mở */}
                        <div style={{ flex: 1, minWidth: 120 }}>
                          <TimeSelectVN
                            value={shift.open}
                            onChange={(val) => updateShiftTime(key, shift.id, 'open', val)}
                          />
                        </div>

                        <span style={{ color: '#94A3B8', fontWeight: 700 }}>–</span>

                        {/* Giờ đóng */}
                        <div style={{ flex: 1, minWidth: 120 }}>
                          <TimeSelectVN
                            value={shift.close}
                            onChange={(val) => updateShiftTime(key, shift.id, 'close', val)}
                          />
                        </div>

                        {/* Nút Xóa ca: Xóa ngay lập tức khỏi state */}
                        <button
                          type="button"
                          onClick={() => removeShift(key, shift.id)}
                          style={{
                            color: '#EF4444',
                            background: '#FEE2E2',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.4rem 0.55rem',
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.15s'
                          }}
                          title="Xóa ca này"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  )}

                  {/* Nút thêm ca mới */}
                  <button
                    type="button"
                    onClick={() => addShift(key)}
                    style={{
                      alignSelf: 'flex-start',
                      background: 'none',
                      border: '1px dashed #93C5FD',
                      color: 'var(--brand, #2563EB)',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      marginTop: '0.25rem',
                      padding: '0.4rem 0.75rem',
                      borderRadius: 6,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#EFF6FF'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                  >
                    <Plus size={14} /> Thêm ca mới
                  </button>
                </div>
              </div>
            )
          })}

          {/* Thanh lưu ở cuối trang */}
          <div
            style={{
              padding: '1rem',
              background: '#F8FAFC',
              borderRadius: 12,
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '0.5rem'
            }}
          >
            <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
              Hãy kiểm tra kỹ các ca trước khi nhấn lưu để hệ thống cập nhật lịch đặt bàn chính xác.
            </div>

            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving}
              style={{
                background: saving ? '#94A3B8' : 'var(--brand, #2563EB)',
                color: '#fff',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
                padding: '0.6rem 1.5rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
              }}
            >
              <Save size={16} />
              {saving ? 'Đang lưu cấu hình...' : 'Lưu tất cả khung giờ'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}