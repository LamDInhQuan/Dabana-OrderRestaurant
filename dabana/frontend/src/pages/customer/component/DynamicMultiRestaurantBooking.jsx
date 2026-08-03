import React, { useState, useEffect } from 'react';
import { MapPin, Users, Calendar, CheckCircle2, Sparkles, Loader2, SearchX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { branchApi, restaurantApi } from '../../../api';

export default function DynamicMultiRestaurantBooking() {
  const navigate = useNavigate();

  // Các state tương ứng với params của backend: LocalDate date, String city, Integer guests
  const [city, setCity] = useState('');
  const [provinces, setProvinces] = useState([]);
  const [guests, setGuests] = useState(2);

  // Lấy ngày hiện tại format YYYY-MM-DD làm mặc định
  const getTodayString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const [date, setDate] = useState(getTodayString());

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedSlots, setSelectedSlots] = useState({});
  const [selectedTables, setSelectedTables] = useState({});

  useEffect(() => {
    restaurantApi.getSystemOptions()
      .then(res => {
        setProvinces(res.data.data.provinces || []);
      })
      .catch(err => console.error("Lỗi tải danh sách tỉnh thành:", err));
  }, []);

  const fetchAvailableBranches = async () => {
    try {
      setLoading(true);
      // Gọi API đúng với 3 tham số backend cung cấp (không còn times)
      const params = {
        city: city === 'Tất cả thành phố' ? '' : city,
        date: date,
        guests: guests
      };

      const response = await branchApi.searchAvailable(params);
      const data = response.data || [];
      setRestaurants(data);

      const initialSlots = {};
      data.forEach(item => {
        if (item.availableSlots && item.availableSlots.length > 0) {
          initialSlots[item.id] = item.availableSlots[0];
        }
      });
      setSelectedSlots(initialSlots);

    } catch (error) {
      console.error('Lỗi khi tải dữ liệu chi nhánh:', error);
    } finally {
      setLoading(false);
    }
  };

  // Tự động gọi API khi thay đổi thành phố, ngày hoặc số lượng khách
  useEffect(() => {
    fetchAvailableBranches();
  }, [city, date, guests]);

  const handleSelectSlot = (branchId, slot) => {
    setSelectedSlots(prev => ({ ...prev, [branchId]: slot }));
    setSelectedTables(prev => ({ ...prev, [branchId]: [] }));
  };

  const handleToggleTable = (branchId, tableId) => {
    setSelectedTables(prev => {
      const currentList = prev[branchId] || [];
      const exists = currentList.includes(tableId);
      const updated = exists ? currentList.filter(id => id !== tableId) : [...currentList, tableId];
      return { ...prev, [branchId]: updated };
    });
  };

  const handleProceedBooking = (branchId, currentSlot, currentSelectedTables) => {
    const queryParams = new URLSearchParams({
      guests: guests,
      date: date,
      time: currentSlot,
      tableIds: currentSelectedTables.join(',')
    });
    navigate(`/booking/${branchId}?${queryParams.toString()}`);
  };

  const guestOptions = [1, 2, 4, 6, 8, 10];

  return (
    <div style={{ background: '#f1f5f9', minHeight: '100vh', fontFamily: 'inherit', paddingBottom: '3rem' }}>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* THANH TÌM KIẾM (Đã bỏ hoàn toàn khung giờ, chỉ còn Tỉnh/Thành và Ngày) */}
      <div style={{ background: '#111', padding: '1.25rem 1.5rem', color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
                <span style={{ background: '#d97706', color: '#fff', padding: '.15rem .4rem', borderRadius: '4px', marginRight: '.4rem' }}>Đặt Bàn</span>
                Hệ Thống Nhà Hàng
              </h2>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', background: '#222', padding: '.5rem', borderRadius: '6px' }}>

            {/* CHỌN TỈNH THÀNH */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', color: '#333', padding: '.4rem .6rem', borderRadius: '4px', gap: '.4rem' }}>
              <MapPin size={16} color="#d97706" style={{ flexShrink: 0 }} />
              <select
                value={city}
                onChange={e => setCity(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '.85rem', fontWeight: 500, cursor: 'pointer' }}
              >
                <option value="">Tất cả Tỉnh/Thành</option>
                {provinces.map((p, idx) => (
                  <option key={idx} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* CHỌN NGÀY */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#fff', color: '#333', padding: '.4rem .6rem', borderRadius: '4px', gap: '.4rem' }}>
              <Calendar size={16} color="#d97706" style={{ flexShrink: 0 }} />
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '.85rem', fontWeight: 500, cursor: 'pointer' }}
              />
            </div>

          </div>

          {/* CHỌN SỐ LƯỢNG KHÁCH */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem', marginTop: '.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '.8rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '.3rem', marginRight: '.2rem' }}>
              <Users size={14} color="#d97706" /> Số khách:
            </span>
            {guestOptions.map(num => (
              <button
                key={num}
                onClick={() => setGuests(num)}
                style={{
                  background: guests === num ? '#d97706' : '#27272a',
                  color: guests === num ? '#fff' : '#d4d4d8',
                  border: '1px solid',
                  borderColor: guests === num ? '#b45309' : '#3f3f46',
                  padding: '.2rem .6rem',
                  borderRadius: '4px',
                  fontSize: '.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {num} {num === 10 ? 'khách+' : 'khách'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* DANH SÁCH KẾT QUẢ */}
      <div style={{ maxWidth: '900px', margin: '1.5rem auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', margin: 0 }}>
            Kết quả tìm kiếm: <span style={{ color: '#d97706' }}>{restaurants.length}</span> chi nhánh
          </h3>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem', color: '#d97706', gap: '.5rem', alignItems: 'center', fontSize: '.9rem' }}>
            <Loader2 className="animate-spin" size={20} /> Đang tìm kiếm bàn trống...
          </div>
        ) : restaurants.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '2.5rem 1.5rem', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <SearchX size={40} color="#cbd5e1" style={{ marginBottom: '.75rem' }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 .3rem 0' }}>Không tìm thấy chi nhánh phù hợp</h4>
            <p style={{ fontSize: '.85rem', color: '#64748b', margin: 0 }}>Hãy thử thay đổi ngày hoặc khu vực tìm kiếm khác bạn nhé!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {restaurants.map(item => {
              const currentSlot = selectedSlots[item.id] || (item.availableSlots && item.availableSlots[0]);
              const currentZones = (item.zonesBySlot && item.zonesBySlot[currentSlot]) || [];
              const currentSelectedTables = selectedTables[item.id] || [];

              const branchImage = item.branchImageDtos?.find(img => img.isCover === 1)?.imageUrl
                || item.branchImageDtos?.[0]?.imageUrl
                || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=60';

              return (
                <div
                  key={item.id}
                  style={{
                    background: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    overflow: 'hidden',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', padding: '1rem', gap: '1rem' }}>
                    <img
                      src={branchImage}
                      alt={item.name}
                      style={{ width: '120px', height: '85px', objectFit: 'cover', borderRadius: '8px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>{item.name}</h4>
                        <span style={{ fontSize: '.65rem', background: '#fef3c7', color: '#b45309', padding: '.15rem .5rem', borderRadius: '4px', fontWeight: 600 }}>{item.brandName || 'Nhà hàng'}</span>
                      </div>
                      {/* ĐỊA CHỈ VÀ TỈNH/THÀNH */}
                      <p style={{ fontSize: '.8rem', color: '#64748b', margin: '.3rem 0', display: 'flex', gap: '.3rem', alignItems: 'center' }}>
                        <MapPin size={13} color="#d97706" style={{ flexShrink: 0 }} />
                        <span>{item.address} {item.province ? `- ${item.province}` : ''}</span>
                      </p>
                      <p style={{ fontSize: '.75rem', color: '#0284c7', fontWeight: 600, margin: 0 }}>📞 {item.phone || 'Đang cập nhật'}</p>
                    </div>
                  </div>

                  <div
                    className="hide-scrollbar"
                    style={{ padding: '.5rem 1rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '.5rem', overflowX: 'auto' }}
                  >
                    <span style={{ fontSize: '.75rem', fontWeight: 600, color: '#475569', whiteSpace: 'nowrap', flexShrink: 0 }}>Chọn khung giờ:</span>
                    <div style={{ display: 'flex', gap: '.4rem' }}>
                      {item.availableSlots && item.availableSlots.length > 0 ? (
                        item.availableSlots.map(slot => {
                          const isSelectedSlot = currentSlot === slot;
                          return (
                            <button
                              key={slot}
                              onClick={() => handleSelectSlot(item.id, slot)}
                              style={{
                                background: isSelectedSlot ? '#1e293b' : '#ffffff',
                                color: isSelectedSlot ? '#ffffff' : '#334155',
                                border: isSelectedSlot ? 'none' : '1px solid #cbd5e1',
                                padding: '.3rem .6rem',
                                borderRadius: '6px',
                                fontSize: '.75rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                flexShrink: 0
                              }}
                            >
                              {slot} {isSelectedSlot && '✓'}
                            </button>
                          );
                        })
                      ) : (
                        <span style={{ fontSize: '.75rem', color: '#ef4444' }}>Hết giờ trống</span>
                      )}
                    </div>
                  </div>

                  <div style={{ background: '#fffcf7', padding: '.85rem 1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.6rem', fontSize: '.75rem' }}>
                      <span style={{ fontWeight: 700, color: '#92400e', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                        <Sparkles size={13} color="#d97706" /> Bàn trống lúc <strong style={{ color: '#d97706' }}>{currentSlot || '--:--'}</strong>:
                      </span>
                      <span style={{ color: '#78716c', background: '#fff', padding: '.15rem .5rem', borderRadius: '4px', border: '1px solid #fef3c7' }}>
                        🕒 {item.operatingHours}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                      {currentZones.length === 0 ? (
                        <div style={{ fontSize: '.75rem', color: '#999', fontStyle: 'italic', textAlign: 'center', padding: '.3rem 0' }}>Không có bàn trống ở khung giờ này.</div>
                      ) : (
                        currentZones.map(zone => (
                          <div key={zone.zoneId || zone.zoneName} style={{ background: '#fff', border: '1px solid #e7e5e4', borderRadius: '6px', padding: '.6rem' }}>
                            <div style={{ fontSize: '.75rem', fontWeight: 700, color: '#57534e', marginBottom: '.4rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                              <span style={{ width: 5, height: 5, background: '#d97706', borderRadius: '50%' }}></span>
                              {zone.zoneName}
                            </div>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
                              {zone.tables.map(table => {
                                const isChecked = currentSelectedTables.includes(table.id);
                                return (
                                  <div
                                    key={table.id}
                                    onClick={() => handleToggleTable(item.id, table.id)}
                                    style={{
                                      background: isChecked ? '#fffbeb' : '#fafaf9',
                                      border: `1px solid ${isChecked ? '#d97706' : '#d7d3d0'}`,
                                      borderRadius: '6px',
                                      padding: '.3rem .6rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '.5rem',
                                      cursor: 'pointer',
                                      minWidth: '100px',
                                      justifyContent: 'space-between'
                                    }}
                                  >
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                      <span style={{ fontSize: '.75rem', fontWeight: 700, color: isChecked ? '#92400e' : '#1c1917', lineHeight: 1.2 }}>
                                        {table.name}
                                      </span>
                                      <span style={{ fontSize: '.65rem', color: '#78716c' }}>
                                        {table.capacity} chỗ
                                      </span>
                                    </div>

                                    <div style={{
                                      width: 14, height: 14, borderRadius: '50%',
                                      border: `1.2px solid ${isChecked ? '#d97706' : '#a8a29e'}`,
                                      background: isChecked ? '#d97706' : '#fff',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                      {isChecked && <CheckCircle2 size={9} color="#fff" />}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {currentSelectedTables.length > 0 && (
                      <div style={{ marginTop: '.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fef3c7', padding: '.5rem .75rem', borderRadius: '6px', border: '1px solid #fde68a' }}>
                        <span style={{ fontSize: '.75rem', color: '#92400e', fontWeight: 500 }}>
                          Đã chọn <strong>{currentSelectedTables.length}</strong> bàn lúc <strong>{currentSlot}</strong>
                        </span>
                        <button
                          onClick={() => handleProceedBooking(item.id, currentSlot, currentSelectedTables)}
                          style={{ background: '#d97706', color: '#fff', border: 'none', padding: '.35rem 1rem', fontSize: '.75rem', fontWeight: 700, borderRadius: '4px', cursor: 'pointer' }}
                        >
                          Tiếp tục đặt bàn ➔
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}