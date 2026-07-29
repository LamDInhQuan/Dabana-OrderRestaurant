import React, { useMemo } from 'react';

function ReservationPolicyBanner({ policyLoading, policy, guestCount, timeSlot, formatVND }) {
  // 1. Logic xác định Rule phù hợp & lọc Schedule theo timeSlot (Đồng bộ tuyệt đối với Backend)
  const { activeRule, isFallback, appliedSchedule } = useMemo(() => {
    if (!policy?.depositRules?.length || !guestCount) {
      return { activeRule: null, isFallback: false, appliedSchedule: null };
    }

    // Lọc schedule khớp với timeSlot hiện tại để hiển thị đúng khung giờ thực tế
    let validSchedule = policy.schedules?.[0];
    if (timeSlot && policy.schedules) {
      const matched = policy.schedules.find(sch => {
        if (!sch.timeFrom || !sch.timeTo) return true;
        const from = sch.timeFrom.slice(0, 5);
        const to = sch.timeTo.slice(0, 5);
        return timeSlot >= from && timeSlot <= to;
      });
      if (matched) validSchedule = matched;
    }

    const sortedRules = [...policy.depositRules].sort((a, b) => a.minGuest - b.minGuest);

    // Kiểm tra trường hợp match chuẩn xác (min <= guestCount <= max, max có thể là null = vô tận)
    let exactMatch = sortedRules.find(
      (r) => guestCount >= r.minGuest && (r.maxGuest === null || guestCount <= r.maxGuest)
    );

    if (exactMatch) {
      return { activeRule: exactMatch, isFallback: false, appliedSchedule: validSchedule };
    }

    // Fallback khi vượt quá mốc lớn nhất hoặc lọt khe
    let fallbackRule = sortedRules
      .filter((r) => r.minGuest <= guestCount)
      .sort((a, b) => b.minGuest - a.minGuest)[0];

    // Nếu guestCount vượt quá tất cả các mốc cấu hình, tự động gán về rule lớn nhất
    if (!fallbackRule && sortedRules.length > 0) {
      fallbackRule = sortedRules[sortedRules.length - 1];
    }

    return {
      activeRule: fallbackRule,
      isFallback: true,
      appliedSchedule: validSchedule,
    };
  }, [policy, guestCount, timeSlot]);

  // 2. Tính toán nhãn hiển thị số tiền cọc (Hỗ trợ Fixed, Per Person)
  const depositLabel = useMemo(() => {
    if (!activeRule) return '';
    let baseDeposit = 0;
    if (activeRule.depositType === 'PER_PERSON') {
      baseDeposit = Number(activeRule.depositValue || 0) * guestCount;
      return `${formatVND(baseDeposit)} (${formatVND(activeRule.depositValue)}/người)`;
    } else {
      baseDeposit = Number(activeRule.depositValue || 0);
      return formatVND(baseDeposit);
    }
  }, [activeRule, guestCount, formatVND]);

  if (policyLoading) {
    return (
      <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '.85rem' }}>
        Đang tải chính sách cọc...
      </p>
    );
  }

  if (!policy) return null;

  return (
    <div
      style={{
        padding: '1rem 1.1rem',
        borderRadius: 12,
        marginBottom: '1.25rem',
        background: activeRule
          ? 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)'
          : '#F0FDF4',
        border: `1.5px solid ${activeRule ? '#FDBA74' : '#86EFAC'}`,
      }}
    >
      {/* Header Thông báo Cọc */}
      <div className="flex items-center gap-2" style={{ marginBottom: '.5rem' }}>
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '.95rem',
            background: activeRule ? '#F59E0B' : '#22C55E',
            flexShrink: 0,
            color: '#fff',
          }}
        >
          {activeRule ? '💰' : '✓'}
        </span>
        <div>
          <strong style={{ fontSize: '.92rem', color: '#1F2937' }}>
            {activeRule
              ? `Cần đặt cọc ${depositLabel} cho ${guestCount} khách`
              : 'Không yêu cầu đặt cọc cho số khách này'}
          </strong>
        </div>
      </div>

      {/* Cảnh báo khi Fallback Quy Tắc */}
      {isFallback && activeRule && (
        <div
          style={{
            background: '#FEF3C7',
            border: '1px solid #FCD34D',
            borderRadius: 8,
            padding: '.4rem .65rem',
            marginBottom: '.65rem',
            fontSize: '.75rem',
            color: '#92400E',
            display: 'flex',
            alignItems: 'center',
            gap: '.4rem',
          }}
        >
          <span>⚠️</span>
          <span>
            Số lượng <strong>{guestCount} khách</strong> nằm ngoài định mức chuẩn. Hệ thống tự động áp dụng quy tắc đặt cọc của mốc{' '}
            <strong>
              {activeRule.minGuest}–{activeRule.maxGuest ? activeRule.maxGuest : 'trở lên'} khách
            </strong>.
          </span>
        </div>
      )}

      {/* Danh sách các Thẻ Quy Tắc Cọc */}
      {policy.depositRules?.length > 0 && (
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.65rem' }}>
          {policy.depositRules
            .slice()
            .sort((a, b) => a.minGuest - b.minGuest)
            .map((rule) => {
              const isActive = rule.id === activeRule?.id;
              const rangeLabel =
                rule.minGuest === rule.maxGuest
                  ? `${rule.minGuest} khách`
                  : rule.maxGuest 
                    ? `${rule.minGuest}–${rule.maxGuest} khách`
                    : `Từ ${rule.minGuest} khách`;

              const amountLabel =
                rule.depositType === 'PER_PERSON'
                  ? `${formatVND(rule.depositValue)}/người`
                  : formatVND(rule.depositValue);

              return (
                <div
                  key={rule.id}
                  style={{
                    padding: '.45rem .65rem',
                    borderRadius: 8,
                    minWidth: 110,
                    textAlign: 'center',
                    background: isActive ? '#F59E0B' : '#fff',
                    border: `1.5px solid ${isActive ? '#F59E0B' : '#F1D9BE'}`,
                    boxShadow: isActive ? '0 3px 10px rgba(245,158,11,.35)' : 'none',
                    transition: 'all .2s',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div
                    style={{
                      fontSize: '.68rem',
                      fontWeight: 600,
                      color: isActive ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {rangeLabel}
                  </div>
                  <div
                    style={{
                      fontSize: '.82rem',
                      fontWeight: 700,
                      color: isActive ? '#fff' : '#B45309',
                      margin: '2px 0',
                    }}
                  >
                    {amountLabel}
                  </div>

                  {/* Chi tiết phụ: Bàn & Đặt món */}
                  <div
                    style={{
                      fontSize: '.65rem',
                      color: isActive ? 'rgba(255,255,255,0.9)' : '#6B7280',
                      borderTop: `1px dashed ${isActive ? 'rgba(255,255,255,0.4)' : '#E5E7EB'}`,
                      paddingTop: 3,
                      marginTop: 3,
                    }}
                  >
                    {rule.maxTables && <div>🪑 Tối đa {rule.maxTables} bàn</div>}
                    {rule.preorderDepositPercent ? (
                      <div style={{ fontWeight: 600 }}>🍽️ Cọc {rule.preorderDepositPercent}% món</div>
                    ) : null}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Khối thông tin chi tiết điều kiện Backend áp dụng cho Rule hiện tại */}
      {activeRule && (activeRule.minPreorderAmount || activeRule.maxTables) && (
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.65)',
            borderRadius: 8,
            padding: '.5rem .75rem',
            marginBottom: '.65rem',
            fontSize: '.75rem',
            color: '#4B5563',
            border: '1px solid #FED7AA',
          }}
        >
          <div style={{ fontWeight: 600, color: '#C2410C', marginBottom: '.25rem' }}>
            📌 Quy định áp dụng cho đoàn của bạn:
          </div>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.5 }}>
            {activeRule.maxTables && (
              <li>
                Sắp xếp tối đa <strong>{activeRule.maxTables} bàn</strong>
                {activeRule.maxCapacitySlop ? ` (dung sai dư tối đa ${activeRule.maxCapacitySlop} ghế)` : ''}.
              </li>
            )}
            {activeRule.minPreorderAmount && (
              <li>
                Yêu cầu chọn món trước tối thiểu <strong>{formatVND(activeRule.minPreorderAmount)}</strong> (đặt cọc trước <strong>{activeRule.preorderDepositPercent}%</strong> tiền món).
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Footer chính sách & Khung giờ đúng theo timeSlot đang chọn */}
      <p style={{ fontSize: '.76rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
        Áp dụng theo chính sách <strong>{policy.policy?.name}</strong>
        {appliedSchedule && appliedSchedule.timeFrom && (
          <>
            {' '}trong khung giờ{' '}
            <strong>
              {appliedSchedule.timeFrom.slice(0, 5)}–{appliedSchedule.timeTo.slice(0, 5)}
            </strong>
          </>
        )}. Hủy trước 2 giờ được hoàn 100% cọc; hủy trong vòng 2 giờ hoặc không đến sẽ không hoàn cọc.
      </p>
    </div>
  );
}

export default ReservationPolicyBanner;