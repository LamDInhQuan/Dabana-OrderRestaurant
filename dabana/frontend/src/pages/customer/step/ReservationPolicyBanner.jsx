import React, { useMemo, useState, useEffect } from 'react';
import { Wallet, Check, TriangleAlert, Armchair, Utensils, Pin, ShieldCheck } from 'lucide-react';
import { systemPolicyApi } from '../../../api';

function ReservationPolicyBanner({ policyLoading, policy, guestCount, formatVND }) {
  const [systemPolicy, setSystemPolicy] = useState(null);

  useEffect(() => {
    systemPolicyApi.getCancellationGracePeriod()
      .then(res => {
        const data = res.data?.data || res.data;
        if (data) setSystemPolicy(data);
      })
      .catch(() => { });
  }, []);
  // 1. Logic xác định Rule phù hợp (bao gồm logic Fallback)
  const { activeRule, isFallback, maxSupportedGuest } = useMemo(() => {
    if (!policy?.depositRules?.length || !guestCount) {
      return { activeRule: null, isFallback: false, maxSupportedGuest: 0 };
    }

    const sortedRules = [...policy.depositRules].sort((a, b) => a.minGuest - b.minGuest);
    const maxSupported = sortedRules[sortedRules.length - 1]?.maxGuest || 0;

    // Tìm rule khớp chính xác khoảng khách
    let exactMatch = sortedRules.find(
      (r) => guestCount >= r.minGuest && guestCount <= r.maxGuest
    );

    if (exactMatch) {
      return { activeRule: exactMatch, isFallback: false, maxSupportedGuest: maxSupported };
    }

    // Nếu không khớp trực tiếp (VD: vượt maxGuest hoặc lọt khe), lùi về rule nhỏ hơn gần nhất
    const fallbackRule = sortedRules
      .filter((r) => r.minGuest <= guestCount)
      .pop() || sortedRules[sortedRules.length - 1]; // Lấy rule cao nhất nếu vượt quá

    return {
      activeRule: fallbackRule,
      isFallback: true,
      maxSupportedGuest: maxSupported,
    };
  }, [policy, guestCount]);

  // deposit label
  const isPerPerson = (t) => String(t || '').trim().toUpperCase() === 'PER_PERSON';

  const depositLabel = useMemo(() => {
    if (!activeRule) return '';
    if (isPerPerson(activeRule.depositType)) {
      return `${formatVND(activeRule.depositValue * guestCount)} (${formatVND(activeRule.depositValue)}/người)`;
    }
    return formatVND(activeRule.depositValue);
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
          {activeRule ? <Wallet size={16} /> : <Check size={16} />}
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
          <span style={{ display: 'inline-flex' }}><TriangleAlert size={14} /></span>
          <span>
            Số lượng <strong>{guestCount} khách</strong> nằm ngoài định mức thiết lập tiêu chuẩn. Hệ thống áp dụng quy tắc đặt cọc của mốc <strong>{activeRule.minGuest}–{activeRule.maxGuest} khách</strong>.
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
                  : `${rule.minGuest}–${rule.maxGuest} khách`;

              const amountLabel =
                isPerPerson(rule.depositType)
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
                    {rule.maxTables && <div><Armchair size={12} style={{ verticalAlign: '-2px' }} /> Tối đa {rule.maxTables} bàn</div>}
                    {rule.preorderDepositPercent ? (
                      <div style={{ fontWeight: 600 }}><Utensils size={12} style={{ verticalAlign: '-2px' }} /> Cọc {rule.preorderDepositPercent}% món</div>
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
            <Pin size={14} style={{ verticalAlign: '-2px' }} /> Quy định áp dụng cho đoàn của bạn:
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

      {/* Footer chính sách & Khung giờ */}
      <p style={{ fontSize: '.76rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
        Áp dụng theo chính sách <strong>{policy.policy?.name}</strong>
        {policy.schedules?.[0] && (
          <>
            {' '}trong khung giờ{' '}
            <strong>
              {policy.schedules[0].timeFrom?.slice(0, 5)}–{policy.schedules[0].timeTo?.slice(0, 5)}
            </strong>
          </>
        )}.
      </p>

      {/* BẢO CHỨNG ÂN HẠN HUỶ ĐƠN DABANA */}
      {systemPolicy?.enabled !== false && (
        <div
          style={{
            background: 'rgba(239, 246, 255, 0.9)',
            border: '1px solid #BFDBFE',
            borderRadius: 8,
            padding: '.45rem .75rem',
            marginTop: '.6rem',
            display: 'flex',
            alignItems: 'center',
            gap: '.5rem',
            fontSize: '.76rem',
            color: '#1E40AF',
          }}
        >
          <ShieldCheck size={16} color="#2563EB" style={{ flexShrink: 0 }} />
          <span>
            <strong>Bảo chứng Dabana:</strong> Hoàn <strong>100% tiền cọc</strong> nếu huỷ đơn trong vòng <strong>{systemPolicy?.gracePeriodMinutes ?? 15} phút</strong> sau khi đặt bàn thành công.
          </span>
        </div>
      )}
    </div>
  );
}

export default ReservationPolicyBanner;