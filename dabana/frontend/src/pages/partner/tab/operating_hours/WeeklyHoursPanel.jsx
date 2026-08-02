import React, { useState } from 'react'
import TimeSelectVN from './TimeSelectVN' // Component chọn giờ
import { Save, Plus } from 'lucide-react'
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

function uid() { return 'temp_' + Math.random().toString(36).slice(2, 9) }

export default function WeeklyHoursPanel({
  activeBranch,
  activeDays,
  weeklyHours,
  setActiveDays,
  setWeeklyHours,
  onSaveWeekly,
  onError // Nhận hàm xử lý lỗi từ component cha
}) {
  const [showAddMenu, setShowAddMenu] = useState(false)
  const [savingKey, setSavingKey] = useState(null)

  const missingDays = DOW_LABELS.filter(d => !activeDays.includes(d.key))
  const sortedActiveDays = DOW_LABELS.filter(d => activeDays.includes(d.key))

  const addDay = (dayKey) => {
    if (!activeDays.includes(dayKey)) {
      setActiveDays(prev => [...prev, dayKey])
      if (!weeklyHours[dayKey] || weeklyHours[dayKey].shifts.length === 0) {
        setWeeklyHours(prev => ({
          ...prev,
          [dayKey]: { shifts: [{ id: uid(), open: '08:00', close: '22:00', shiftName: 'Ca 1', isNew: true, dirty: true }] }
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
        shifts: prev[dayKey].shifts.map(s => {
          return s.id === shiftId
            ? {
                ...s,
                [field]: value,
                dirty: true
              }
            : s
        })
      }
    }))
  }

  // Thêm ca mới trên giao diện cho một ngày cụ thể
  const addShift = (dayKey) => {
    const currentShifts = weeklyHours[dayKey]?.shifts || []
    setWeeklyHours(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        shifts: [
          ...currentShifts,
          { id: uid(), open: '12:00', close: '16:00', shiftName: `Ca ${currentShifts.length + 1}`, isNew: true, dirty: true }
        ]
      }
    }))
  }

  // Xóa ca: Xóa state tạm hoặc gọi API xóa nếu đã lưu DB
  const removeShift = async (dayKey, shift) => {
    if (shift.isNew || String(shift.id).startsWith('temp_')) {
      setWeeklyHours(prev => ({
        ...prev,
        [dayKey]: {
          ...prev[dayKey],
          shifts: prev[dayKey].shifts.filter(s => s.id !== shift.id)
        }
      }))
      toast.success("Đã xóa ca tạm trên giao diện");
      return;
    }

    if (!window.confirm(`Bạn có chắc chắn muốn xóa ca "${shift.shiftName || 'Ca'}" này không?`)) return;

    try {
      if (operatingHourApi.deleteShift) {
        await operatingHourApi.deleteShift(activeBranch.id, shift.id);
      } else if (operatingHourApi.delete) {
        await operatingHourApi.delete(activeBranch.id, shift.id);
      }

      setWeeklyHours(prev => ({
        ...prev,
        [dayKey]: {
          ...prev[dayKey],
          shifts: prev[dayKey].shifts.filter(s => s.id !== shift.id)
        }
      }))
      toast.success("Xóa ca thành công!");
    } catch (error) {
      console.error("Lỗi khi xóa ca:", error);
      if (onError) onError(error);
      else toast.error("Không thể xóa ca này!");
    }
  }

  // XÓA CẢ NGÀY
  const removeDayCompletely = async (dayKey) => {
    const shifts = weeklyHours[dayKey]?.shifts || [];
    const savedShifts = shifts.filter(s => !s.isNew && !String(s.id).startsWith('temp_'));

    if (savedShifts.length > 0) {
      if (!window.confirm("Ngày này có chứa các ca đã lưu hệ thống. Bạn có muốn xóa toàn bộ các ca trong ngày này không?")) return;
    }

    try {
      for (const shift of savedShifts) {
        if (operatingHourApi.deleteShift) {
          await operatingHourApi.deleteShift(activeBranch.id, shift.id);
        } else if (operatingHourApi.delete) {
          await operatingHourApi.delete(activeBranch.id, shift.id);
        }
      }

      setActiveDays(prev => prev.filter(k => k !== dayKey))
      setWeeklyHours(prev => {
        const copy = { ...prev };
        delete copy[dayKey];
        return copy;
      });
      toast.success("Đã xóa ngày hoạt động!");
    } catch (error) {
      console.error("Lỗi xóa ngày:", error);
      if (onError) onError(error);
      else toast.error("Xóa ngày thất bại!");
    }
  }

  // LƯU THEO TỪNG NGÀY (Chỉ đẩy các ca mới hoặc có thay đổi dirty)
  const handleSaveDay = async (dayKey) => {
    if (!activeBranch?.id) {
      toast.error("Không tìm thấy thông tin chi nhánh!");
      return;
    }

    const shifts = weeklyHours[dayKey]?.shifts || []
    if (shifts.length === 0) {
      toast.error("Vui lòng thêm ít nhất một ca cho ngày này!");
      return;
    }

    setSavingKey(dayKey)
    try {
      for (let index = 0; index < shifts.length; index++) {
        const shift = shifts[index];
        const rawId = shift.id;
        const isNew = !rawId || String(rawId).startsWith('temp_');
        
        const shiftDto = {
          id: isNew ? null : Number(rawId),
          dayOfWeek: dayKey,
          openTime: shift.open.length === 5 ? `${shift.open}:00` : shift.open,
          closeTime: shift.close.length === 5 ? `${shift.close}:00` : shift.close,
          shiftName: shift.shiftName || `Ca ${index + 1}`
        };

        if (isNew) {
          await operatingHourApi.create(activeBranch.id, shiftDto);
        } else if (shift.dirty) {
          await operatingHourApi.update(shiftDto.id, shiftDto);
        }
      }

      // Reset trạng thái dirty và isNew sau khi lưu thành công
      setWeeklyHours(prev => ({
        ...prev,
        [dayKey]: {
          ...prev[dayKey],
          shifts: prev[dayKey].shifts.map(s => ({ ...s, dirty: false, isNew: false }))
        }
      }));

      toast.success(`Lưu khung giờ ${labelByCode(dayKey)} thành công!`);
      // if (onSaveWeekly) onSaveWeekly(shifts);
    } catch (error) {
      console.error("Lỗi khi lưu khung giờ ngày:", error);
      if (onError) {
        onError(error); // Bật ErrorDetailsModal chuẩn chỉnh
      } else {
        toast.error("Lưu khung giờ thất bại!");
      }
    } finally {
      setSavingKey(null)
    }
  }

  const labelByCode = (key) => {
    const found = DOW_LABELS.find(d => d.key === key);
    return found ? found.label : key;
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between" style={{ marginBottom: '1.25rem' }}>
        <h3 style={{ fontWeight: 700, fontSize: '.8rem', color: 'var(--brand)', textTransform: 'uppercase', margin: 0 }}>
          Khung giờ hoạt động theo tuần (Lưu theo từng ngày)
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
          const isSaving = savingKey === key;

          return (
            <div key={key} style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: 10, background: '#fff' }}>
              <div className="flex items-center justify-between" style={{ marginBottom: '.75rem', borderBottom: '1px solid #eee', paddingBottom: '.5rem' }}>
                <span style={{ fontWeight: 700, fontSize: '.9rem', color: '#333' }}>{label}</span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveDay(key)}
                    disabled={isSaving}
                    className="btn-sm"
                    style={{ background: 'var(--brand, #3b82f6)', color: '#fff', fontSize: '.75rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                  >
                    <Save size={13} /> {isSaving ? 'Đang lưu...' : `Lưu ${label}`}
                  </button>

                  <button
                    type="button"
                    onClick={() => removeDayCompletely(key)}
                    className="btn-sm"
                    style={{ background: '#FEE2E2', color: '#B91C1C', fontSize: '.72rem', cursor: 'pointer' }}
                  >
                    Xóa ngày
                  </button>
                </div>
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

                    <button
                      type="button"
                      onClick={() => removeShift(key, shift)}
                      style={{ color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '1.2rem', padding: '0 5px' }}
                      title="Xóa ca này"
                    >
                      ×
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => addShift(key)}
                  className="btn-sm"
                  style={{ alignSelf: 'flex-start', background: 'none', border: '1px dashed var(--border)', color: 'var(--brand)', fontSize: '.75rem', marginTop: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Plus size={13} /> Thêm ca mới
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}