import React, { useState } from 'react'
import { Ban, X, Clock } from 'lucide-react'

const EXCEPTION_TYPES = [
    { value: 'CLOSE_ALL_DAY', label: 'Đóng cửa cả ngày' },
    { value: 'SPECIFIC_HOURS', label: 'Thay đổi khung giờ hoạt động' },
    { value: 'CANCEL_SHIFT', label: 'Hủy ca cố định cụ thể' },
]

export default function ExceptionsPanel({
    exceptions, operatingHours, editing, onNew, onEdit, onCancelEdit, onSave, onDelete, formatTimeVN
}) {
    const [form, setForm] = useState(editing || {})

    React.useEffect(() => {
        setForm(editing || {})
    }, [editing])

    const isFormOpen = editing !== null

    const handleSubmit = (e) => {
        e.preventDefault()
        onSave(form)
    }

    return (
        <div className="card">
            <div className="flex items-center justify-between" style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontWeight: 700, fontSize: '.8rem', color: 'var(--brand)', textTransform: 'uppercase', margin: 0 }}>
                    Lịch ngoại lệ / Ngày nghỉ
                </h3>
                {!isFormOpen && (
                    <button type="button" onClick={onNew} className="btn-sm" style={{ background: 'var(--brand)', color: '#fff' }}>
                        + Thêm ngoại lệ
                    </button>
                )}
            </div>

            {/* Form Tạo/Sửa Ngoại Lệ */}
            {isFormOpen && (
                <form onSubmit={handleSubmit} style={{ background: 'var(--bg-subtle, #F9FAFB)', padding: '1rem', borderRadius: 8, marginBottom: '1.5rem', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                            <label style={{ fontSize: '.78rem', fontWeight: 600 }}>Từ ngày</label>
                            <input type="date" value={form.startDate || ''} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
                        </div>
                        <div>
                            <label style={{ fontSize: '.78rem', fontWeight: 600 }}>Đến ngày</label>
                            <input type="date" value={form.endDate || ''} onChange={e => setForm({ ...form, endDate: e.target.value })} required />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '.78rem', fontWeight: 600 }}>Loại ngoại lệ</label>
                        <select value={form.exceptionType || 'CLOSE_ALL_DAY'} onChange={e => setForm({ ...form, exceptionType: e.target.value })}>
                            {EXCEPTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>

                    {/* Chọn Ca Cụ Thể (Nếu chọn Hủy ca) */}
                    {form.exceptionType === 'CANCEL_SHIFT' && (
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ fontSize: '.78rem', fontWeight: 600 }}>Chọn ca cần hủy</label>
                            <select value={form.operatingHourId || ''} onChange={e => setForm({ ...form, operatingHourId: e.target.value })} required>
                                <option value="">-- Chọn ca hoạt động --</option>
                                {operatingHours.map(oh => (
                                    <option key={oh.id} value={oh.id}>
                                        {/* Định dạng giờ tiếng Việt trong Select Option */}
                                        {oh.dayOfWeek}: {oh.shiftName ? `${oh.shiftName} (` : ''}
                                        {formatTimeVN ? `${formatTimeVN(oh.openTime)} - ${formatTimeVN(oh.closeTime)}` : `${oh.openTime} - ${oh.closeTime}`}
                                        {oh.shiftName ? ')' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Nhập giờ mới (Nếu chọn Thay đổi giờ) */}
                    {/* Nhập giờ mới (Nếu chọn Thay đổi giờ) */}
                    {form.exceptionType === 'SPECIFIC_HOURS' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Giờ mở mới</label>
                                <TimeSelectVN
                                    value={form.openTime || '08:00'}
                                    onChange={(val) => setForm({ ...form, openTime: val })}
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '.78rem', fontWeight: 600, display: 'block', marginBottom: 4 }}>Giờ đóng mới</label>
                                <TimeSelectVN
                                    value={form.closeTime || '22:00'}
                                    onChange={(val) => setForm({ ...form, closeTime: val })}
                                />
                            </div>
                        </div>
                    )}

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '.78rem', fontWeight: 600 }}>Lý do / Mô tả</label>
                        <input type="text" placeholder="Ví dụ: Nghỉ Tết Âm Lịch, Sửa chữa điện..." value={form.reason || ''} onChange={e => setForm({ ...form, reason: e.target.value })} />
                    </div>

                    <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onCancelEdit} className="btn-sm" style={{ background: '#E5E7EB', color: '#374151' }}>Hủy</button>
                        <button type="submit" className="btn-sm" style={{ background: 'var(--brand)', color: '#fff' }}>Lưu ngoại lệ</button>
                    </div>
                </form>
            )}

            {/* Danh sách Ngoại lệ đã tạo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
                {exceptions.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '.85rem', textAlign: 'center', margin: '1rem 0' }}>Chưa có lịch ngoại lệ nào.</p>
                ) : (
                    exceptions.map(exc => (
                        <div key={exc.id} style={{ padding: '.85rem', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: '.88rem' }}>
                                    {exc.startDate === exc.endDate ? exc.startDate : `${exc.startDate} → ${exc.endDate}`}
                                </div>
                                <div style={{ fontSize: '.8rem', color: '#DC2626', marginTop: '.2rem' }}>
                                    {exc.exceptionType === 'CLOSE_ALL_DAY' && <><Ban size={14} style={{ verticalAlign: '-2px' }} /> Đóng cửa cả ngày</>}
                                    {exc.exceptionType === 'CANCEL_SHIFT' && <><X size={14} style={{ verticalAlign: '-2px' }} /> Hủy ca hoạt động</>}
                                    {/* Định dạng giờ tiếng Việt hiển thị trên Card */}
                                    {exc.exceptionType === 'SPECIFIC_HOURS' && (
                                        <><Clock size={14} style={{ verticalAlign: '-2px' }} /> {`Mở cửa: ${formatTimeVN ? `${formatTimeVN(exc.openTime)} - ${formatTimeVN(exc.closeTime)}` : `${exc.openTime} - ${exc.closeTime}`}`}</>
                                    )}
                                </div>
                                {exc.reason && <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.2rem' }}>Ghi chú: {exc.reason}</div>}
                            </div>

                            <div style={{ display: 'flex', gap: '.4rem' }}>
                                <button type="button" onClick={() => onEdit(exc)} className="btn-sm" style={{ background: '#F3F4F6', color: '#374151' }}>Sửa</button>
                                <button type="button" onClick={() => onDelete(exc.id)} className="btn-sm" style={{ background: '#FEE2E2', color: '#B91C1C' }}>Xóa</button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}