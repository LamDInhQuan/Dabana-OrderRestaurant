function ExceptionForm({ exception, operatingHours = [], onCancel, onSave }) {
  const [form, setForm] = useState(exception || {
    exceptionType: 'CLOSE_ALL_DAY',
    startDate: '',
    endDate: '',
    openTime: '',
    closeTime: '',
    operatingHourId: null,
    reason: ''
  })

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  // Khi đổi type thì reset lại field không liên quan
  const handleTypeChange = (type) => {
    setForm(prev => ({
      ...prev,
      exceptionType: type,
      operatingHourId: null,
      openTime: '',
      closeTime: '',
      // Tự động set endDate = startDate nếu là CLOSE_TIME_RANGE hoặc ADD_TIME_RANGE
      endDate: (type !== 'CLOSE_ALL_DAY' && prev.startDate) ? prev.startDate : prev.endDate
    }))
  }

  // Check client-side validation sơ bộ trước khi submit
  const isValid = () => {
    if (!form.startDate) return false
    if (form.exceptionType === 'CLOSE_ALL_DAY') {
      return !!form.endDate
    }
    // Hai loại này backend bắt buộc startDate == endDate và openTime < closeTime
    if (form.exceptionType === 'CLOSE_TIME_RANGE') {
      return form.operatingHourId && form.openTime && form.closeTime && (form.openTime < form.closeTime)
    }
    if (form.exceptionType === 'ADD_TIME_RANGE') {
      return form.openTime && form.closeTime && (form.openTime < form.closeTime)
    }
    return false
  }

  return (
    <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--brand-light)', borderRadius: 10 }}>
      <h4 style={{ fontWeight: 700, fontSize: '.85rem', marginBottom: '.9rem' }}>
        {form.id ? 'Sửa ngoại lệ' : 'Thêm ngoại lệ mới'}
      </h4>

      {/* Chọn loại ngoại lệ */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontSize: '.78rem', fontWeight: 600, display: 'block', marginBottom: '.4rem' }}>Loại ngoại lệ</label>
        <div className="flex gap-2 flex-wrap">
          <label style={radioBtnStyle(form.exceptionType === 'CLOSE_ALL_DAY')}>
            <input type="radio" hidden checked={form.exceptionType === 'CLOSE_ALL_DAY'} onChange={() => handleTypeChange('CLOSE_ALL_DAY')} />
            🚫 Đóng nguyên ngày
          </label>
          <label style={radioBtnStyle(form.exceptionType === 'CLOSE_TIME_RANGE')}>
            <input type="radio" hidden checked={form.exceptionType === 'CLOSE_TIME_RANGE'} onChange={() => handleTypeChange('CLOSE_TIME_RANGE')} />
            ⏳ Tạm đóng trong ca
          </label>
          <label style={radioBtnStyle(form.exceptionType === 'ADD_TIME_RANGE')}>
            <input type="radio" hidden checked={form.exceptionType === 'ADD_TIME_RANGE'} onChange={() => handleTypeChange('ADD_TIME_RANGE')} />
            ➕ Mở thêm ca
          </label>
        </div>
      </div>

      {/* Chọn Ngày */}
      <div className="grid-2" style={{ marginBottom: '.75rem' }}>
        <div>
          <label style={{ fontSize: '.78rem', fontWeight: 500, display: 'block', marginBottom: '.25rem' }}>Từ ngày</label>
          <input type="date" value={form.startDate} onChange={e => {
            const date = e.target.value
            setForm(prev => ({
              ...prev,
              startDate: date,
              // Nếu là CLOSE_TIME_RANGE hoặc ADD_TIME_RANGE thì endDate bắt buộc = startDate
              endDate: prev.exceptionType !== 'CLOSE_ALL_DAY' ? date : prev.endDate
            }))
          }} />
        </div>
        {form.exceptionType === 'CLOSE_ALL_DAY' && (
          <div>
            <label style={{ fontSize: '.78rem', fontWeight: 500, display: 'block', marginBottom: '.25rem' }}>Đến ngày</label>
            <input type="date" value={form.endDate} min={form.startDate} onChange={e => set('endDate', e.target.value)} />
          </div>
        )}
      </div>

      {/* Nếu chọn Tạm đóng trong ca -> bắt buộc chọn Ca làm việc (OperatingHour) */}
      {form.exceptionType === 'CLOSE_TIME_RANGE' && (
        <div style={{ marginBottom: '.75rem' }}>
          <label style={{ fontSize: '.78rem', fontWeight: 500, display: 'block', marginBottom: '.25rem' }}>Chọn ca hoạt động bị ảnh hưởng</label>
          <select value={form.operatingHourId || ''} onChange={e => set('operatingHourId', Number(e.target.value))}>
            <option value="">-- Chọn ca --</option>
            {operatingHours.map(oh => (
              <option key={oh.id} value={oh.id}>
                {oh.dayOfWeek} ({oh.openTime?.slice(0,5)} - {oh.closeTime?.slice(0,5)})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Thời gian nếu là CLOSE_TIME_RANGE hoặc ADD_TIME_RANGE */}
      {form.exceptionType !== 'CLOSE_ALL_DAY' && (
        <div className="grid-2" style={{ marginBottom: '.75rem' }}>
          <div>
            <label style={{ fontSize: '.78rem', fontWeight: 500, display: 'block', marginBottom: '.25rem' }}>Từ giờ</label>
            <input type="time" value={form.openTime} onChange={e => set('openTime', e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: '.78rem', fontWeight: 500, display: 'block', marginBottom: '.25rem' }}>Đến giờ</label>
            <input type="time" value={form.closeTime} onChange={e => set('closeTime', e.target.value)} />
          </div>
        </div>
      )}

      {/* Lý do */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ fontSize: '.78rem', fontWeight: 500, display: 'block', marginBottom: '.25rem' }}>Lý do</label>
        <input value={form.reason} onChange={e => set('reason', e.target.value)} placeholder="Vd: Họp nhân viên, Mất điện, Phục vụ sự kiện..." />
      </div>

      <div className="flex gap-2">
        <button className="btn-outline btn-sm" onClick={onCancel}>Huỷ</button>
        <button className="btn-primary btn-sm" disabled={!isValid()} onClick={() => onSave(form)} style={{ opacity: isValid() ? 1 : .5 }}>
          Lưu ngoại lệ
        </button>
      </div>
    </div>
  )
}

function radioBtnStyle(selected) {
  return {
    padding: '.4rem .8rem',
    borderRadius: 6,
    border: `1px solid ${selected ? 'var(--brand)' : 'var(--border)'}`,
    background: selected ? 'var(--brand)' : '#fff',
    color: selected ? '#fff' : 'var(--text-main)',
    cursor: 'pointer',
    fontSize: '.78rem',
    fontWeight: selected ? 600 : 400
  }
}