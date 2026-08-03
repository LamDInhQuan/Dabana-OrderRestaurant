import React from 'react';

export default function TableSelectionGrid({ tables = [], selectedTableIds = [], onSelectTable, guestCount }) {
    if (!tables || tables.length === 0) {
        return (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '1.5rem', background: '#fdfbf7', border: '1px dashed var(--border)', borderRadius: 4, color: '#777' }}>
                ⚠️ Vui lòng chọn đầy đủ Chi nhánh, Ngày và Giờ đến để hiển thị danh sách bàn trống.
            </div>
        );
    }
    return (
        <div style={{ gridColumn: '1/-1', background: '#fdfbf7', border: '1px dashed var(--border)', padding: '1.5rem', borderRadius: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '.9rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--brown)' }}>
                    🪑 Sơ đồ bàn trống phù hợp ({guestCount})
                </h4>
                <span style={{ fontSize: '.8rem', color: '#666' }}>💡 Click chọn bàn trên sơ đồ bên dưới</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '1rem' }}>
                {tables.map(table => {
                    const isSelected = selectedTableIds.includes(table.id);
                    const isBooked = table.status === 'BOOKED';
                    return (
                        <div
                            key={table.id}
                            onClick={() => !isBooked && onSelectTable(table.id)}
                            style={{
                                padding: '1rem',
                                borderRadius: 4,
                                border: `2px solid ${isSelected ? 'var(--gold)' : 'var(--border)'}`,
                                background: isBooked ? '#eee' : isSelected ? 'rgba(232,201,122,0.2)' : '#fff',
                                cursor: isBooked ? 'not-allowed' : 'pointer',
                                textAlign: 'center',
                                opacity: isBooked ? 0.5 : 1,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--brown)' }}>{table.name}</div>
                            <div style={{ fontSize: '.75rem', color: '#666', marginTop: '.2rem' }}>{table.zoneName || 'Khu vực chung'}</div>
                            <div style={{ fontSize: '.7rem', color: isBooked ? 'red' : 'green', marginTop: '.4rem', fontWeight: 600 }}>
                                {isBooked ? 'Đã có khách' : `Tối đa ${table.capacity} khách`}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
} 