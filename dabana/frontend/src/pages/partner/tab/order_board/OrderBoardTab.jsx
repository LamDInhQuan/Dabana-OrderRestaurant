import { useState, useMemo, useEffect, useRef } from 'react'
import TableCard from './components/TableCard'
import TableDetailDrawer from './components/TableDetailDrawer'
import { TABLE_STATUS_META } from './components/statusMeta'
import { availableSlotApi } from '../../../../api'

const SUMMARY_ITEMS = [
  { key: 'empty', status: 1, label: 'Trống' },
  { key: 'reserved', status: 2, label: 'Đã đặt' },
  { key: 'occupied', status: 3, label: 'Đang dùng' },
  { key: 'cleaning', status: 4, label: 'Dọn dẹp' },
  { key: 'maintenance', status: 5, label: 'Bảo trì' },
]

export default function OrderBoardTab({ orderBoard, onSelectTable }) {
  const {
    zones = [], visibleZones = [], loading, refreshing, lastUpdatedAt,
    activeZoneId, setActiveZoneId, summary = {}, reload, branchId, wsConnected,
  } = orderBoard || {}

  const [selectedTableId, setSelectedTableId] = useState(null)

  const [groupedShifts, setGroupedShifts] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [isClosedToday, setIsClosedToday] = useState(false)

  const [activeShiftId, setActiveShiftId] = useState('NOW')
  const [activeSubSlots, setActiveSubSlots] = useState([])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('NOW')

  // Xác định rõ có đang ở chế độ Realtime hay không
  const isRealtime = activeShiftId === 'NOW' && selectedTimeSlot === 'NOW';

  // Dùng useRef để giữ giá trị thật hiện tại, tránh closure stale và gọi API trùng lặp
  const activeShiftRef = useRef(activeShiftId);
  activeShiftRef.current = activeShiftId;

  const selectedTimeSlotRef = useRef(selectedTimeSlot);
  selectedTimeSlotRef.current = selectedTimeSlot;

  const reloadRef = useRef(reload);
  reloadRef.current = reload;

  const activeZoneIdRef = useRef(activeZoneId);
  activeZoneIdRef.current = activeZoneId;

  useEffect(() => {
    if (!branchId) return

    setSlotsLoading(true)
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;

    availableSlotApi.getShifts(branchId, formattedDate)
      .then(res => {
        const rawData = typeof unwrap === 'function' ? unwrap(res) : (res?.data?.data || res?.data || res);
        const slotsList = Array.isArray(rawData) ? rawData : [];

        if (slotsList.length === 0) {
          setIsClosedToday(true);
          setGroupedShifts([]);
        } else {
          setIsClosedToday(false);

          const map = {};
          slotsList.forEach(item => {
            const groupKey = item.operatingHourId || item.description || 'Ca hoạt động';
            if (!map[groupKey]) {
              map[groupKey] = {
                id: groupKey,
                name: item.description || `Ca #${item.operatingHourId}`,
                slots: []
              };
            }
            map[groupKey].slots.push({
              startTime: item.startTime.substring(0, 5),
              endTime: item.endTime.substring(0, 5),
              raw: item
          });
        });

          const result = Object.values(map).map(shift => {
            shift.slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
            return shift;
        });

          setGroupedShifts(result);
      }
    })
    .catch(err => {
      console.error("Lỗi gọi API lấy ca/slot:", err);
      setIsClosedToday(false);
      setGroupedShifts([]);
    })
    .finally(() => {
      setSlotsLoading(false);
    });
  }, [branchId]);

  const triggerReloadWithTime = (timeSlot) => {
    let targetTimeParam = null;
    if (timeSlot && timeSlot !== 'NOW') {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      targetTimeParam = `${year}-${month}-${day}T${timeSlot}:00`;
    }

    const currentZoneId = activeZoneIdRef.current;
    const zoneParam = currentZoneId && currentZoneId !== 'ALL' ? currentZoneId : null;
    
    reloadRef.current?.(zoneParam, targetTimeParam);
  }

  const handleSelectShift = (shift) => {
    if (shift === 'NOW') {
      if (activeShiftRef.current === 'NOW') return;
      setActiveShiftId('NOW');
      setActiveSubSlots([]);
      setSelectedTimeSlot('NOW');
      triggerReloadWithTime('NOW');
    } else {
      if (activeShiftRef.current === shift.id) return;
      setActiveShiftId(shift.id);
      setActiveSubSlots(shift.slots);
      if (shift.slots.length > 0) {
        const timeVal = shift.slots[0].startTime;
        setSelectedTimeSlot(timeVal);
        triggerReloadWithTime(timeVal);
      }
    }
  }

  const handleSelectTimeSlot = (timeVal) => {
    if (selectedTimeSlotRef.current === timeVal) return;
    setSelectedTimeSlot(timeVal);
    triggerReloadWithTime(timeVal);
  }

  const selectedTable = useMemo(
    () => zones.flatMap((z) => z.tables || []).find((t) => t.tableId === selectedTableId) || null,
    [zones, selectedTableId]
  )

  const handleSelectTable = (table) => {
    setSelectedTableId(table.tableId)
    onSelectTable?.(table)
  }

  return (
    <div className="page-container" style={{ padding: '1.5rem 1rem' }}>

      {/* THANH CHỌN CA VÀ SLOT CON */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '.75rem 1rem', background: '#FDFBF7', border: '1px solid #E8DECE' }}>
        <div style={{ fontSize: '.78rem', fontWeight: 700, marginBottom: '.5rem', color: '#8A6E57', textTransform: 'uppercase' }}>
          📅 Chọn chế độ hiển thị & Ca hoạt động:
        </div>

        {slotsLoading ? (
          <div style={{ fontSize: '.82rem', color: '#8A6E57' }}>Đang tải khung giờ hoạt động...</div>
        ) : isClosedToday ? (
          <div style={{ fontSize: '.85rem', color: 'var(--accent, #D97706)', fontWeight: 600, padding: '.3rem 0' }}>
            ⚠️ Chi nhánh không có lịch hoạt động trong ngày hôm nay.
          </div>
        ) : (
          <div>
            <div className="flex gap-2" style={{ flexWrap: 'wrap', marginBottom: activeShiftId !== 'NOW' && activeSubSlots.length > 0 ? '.75rem' : 0 }}>
              <button
                onClick={() => handleSelectShift('NOW')}
                className={activeShiftId === 'NOW' ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
                style={{ fontSize: '.8rem', fontWeight: activeShiftId === 'NOW' ? 'bold' : 'normal' }}
              >
                ⚡ Hiện tại (Real-time phục vụ & tính tiền)
              </button>

              {groupedShifts.map((shift) => {
                const isSelected = activeShiftId === shift.id;
                const firstTime = shift.slots[0]?.startTime || '';
                const lastTime = shift.slots[shift.slots.length - 1]?.endTime || '';

                return (
                  <button
                    key={shift.id}
                    onClick={() => handleSelectShift(shift)}
                    className={isSelected ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
                    style={{ fontSize: '.8rem' }}
                  >
                    {shift.name} ({firstTime} ➔ {lastTime})
                  </button>
                );
              })}
            </div>

            {activeShiftId !== 'NOW' && activeSubSlots.length > 0 && (
              <div style={{
                marginTop: '.5rem',
                paddingTop: '.5rem',
                borderTop: '1px dashed #E8DECE',
                display: 'flex',
                alignItems: 'center',
                gap: '.5rem',
                flexWrap: 'wrap'
              }}>
                <span style={{ fontSize: '.75rem', fontWeight: 600, color: '#8A6E57', marginRight: '.25rem' }}>
                  ⏰ Xem trước lịch đặt theo giờ:
                </span>
                {activeSubSlots.map((slotItem) => {
                  const timeVal = slotItem.startTime;
                  const isSlotSelected = selectedTimeSlot === timeVal;
                  return (
                    <button
                      key={slotItem.startTime + slotItem.endTime}
                      onClick={() => handleSelectTimeSlot(timeVal)}
                      style={{
                        fontSize: '.75rem',
                        padding: '.2rem .5rem',
                        borderRadius: '4px',
                        border: isSlotSelected ? '1px solid var(--primary, #3b82f6)' : '1px solid #d1d5db',
                        background: isSlotSelected ? 'var(--primary, #3b82f6)' : '#fff',
                        color: isSlotSelected ? '#fff' : '#374151',
                        cursor: 'pointer',
                        fontWeight: isSlotSelected ? 600 : 400
                      }}
                    >
                      {slotItem.startTime} - {slotItem.endTime}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* BANNER CẢNH BÁO KHI ĐANG Ở CHẾ ĐỘ XEM TRƯỚC (XEM LỊCH) */}
      {!isRealtime && (
        <div style={{
          background: '#FEF3C7',
          border: '1px solid #F59E0B',
          color: '#92400E',
          padding: '.75rem 1rem',
          borderRadius: '6px',
          marginBottom: '1.25rem',
          fontSize: '.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <strong>⚠️ BẠN ĐANG Ở CHẾ ĐỘ XEM TRƯỚC LỊCH ĐẶT ({selectedTimeSlot}):</strong> Màn hình này dùng để kiểm tra bàn đặt trước. Không thực hiện thanh toán hay gọi món trực tiếp ở chế độ này để tránh nhầm lẫn ca.
          </div>
          <button 
            onClick={() => handleSelectShift('NOW')}
            style={{
              background: '#D97706',
              color: '#fff',
              border: 'none',
              padding: '.3rem .6rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '.75rem'
            }}
          >
            Về Real-time ngay
          </button>
        </div>
      )}

      {/* Tổng quan trạng thái */}
      <div className="card" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ fontSize: '.72rem', color: 'var(--text-muted, #8A6E57)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Tổng số bàn</div>
          <div style={{ fontWeight: 800, fontSize: '1.4rem' }}>{summary.total || 0}</div>
        </div>
        {SUMMARY_ITEMS.map((item) => {
          const meta = TABLE_STATUS_META[item.status]
          return (
            <div key={item.key}>
              <div style={{ fontSize: '.72rem', color: meta.color, fontWeight: 700 }}>{meta.icon} {item.label}</div>
              <div style={{ fontWeight: 800, fontSize: '1.4rem', color: meta.color }}>{summary[item.key] || 0}</div>
            </div>
          )
        })}
      </div>

      {/* Filter theo Zone */}
      {zones.length > 0 && (
        <div className="flex gap-2" style={{ marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveZoneId?.('ALL')}
            className={activeZoneId === 'ALL' ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
          >
            Tất cả khu vực
          </button>
          {zones.map((z) => (
            <button
              key={z.zoneId}
              onClick={() => setActiveZoneId?.(z.zoneId)}
              className={activeZoneId === z.zoneId ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
            >
              {z.zoneName} ({(z.tables || []).length})
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && <p style={{ color: 'var(--text-muted, #8A6E57)' }}>Đang tải sơ đồ bàn...</p>}

      {/* Empty state */}
      {!loading && zones.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted, #8A6E57)' }}>
          Chi nhánh chưa có khu vực/bàn nào. Vui lòng thiết lập ở tab "Sơ đồ bàn".
        </div>
      )}

      {/* Danh sach ban theo tung Zone */}
      {!loading && visibleZones.map((zone) => (
        <div key={zone.zoneId} style={{ marginBottom: '2rem' }}>
          <div style={{ marginBottom: '.75rem' }}>
            <h2 style={{ fontWeight: 700, fontSize: '1.05rem' }}>{zone.zoneName}</h2>
            {zone.description && (
              <p style={{ fontSize: '.78rem', color: 'var(--text-muted, #8A6E57)' }}>{zone.description}</p>
            )}
          </div>

          {(zone.tables || []).length === 0 ? (
            <div className="card" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted, #8A6E57)', fontSize: '.85rem' }}>
              Khu vực này chưa có bàn nào.
            </div>
          ) : (
            <div style={{
              display: 'grid', gap: '.9rem',
              gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
            }}>
              {zone.tables.map((table) => (
                <TableCard
                  key={table.tableId}
                  table={table}
                  selectedTimeSlot={selectedTimeSlot}
                  onClick={handleSelectTable}
                />
              ))}
            </div>
          )}
        </div>
      ))}

      <TableDetailDrawer
        table={selectedTable}
        branchId={branchId}
        isRealtime={isRealtime} // Truyền cờ hiệu xuống drawer nếu cần khóa tính năng thanh toán/gọi món khi đang xem lịch
        onClose={() => setSelectedTableId(null)}
        onChanged={() => reload?.()}
      />
    </div>
  )
}