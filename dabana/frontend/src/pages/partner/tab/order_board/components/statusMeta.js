import React from 'react'
import { Check, ClipboardList, Users, SprayCan, Wrench } from 'lucide-react'

// Khop dung diningtable/util/DiningTableStatus.java: EMPTY(1) RESERVED(2) OCCUPIED(3) CLEANING(4) MAINTENANCE(5)
// icon la React element (lucide) de moi consumer van render truc tiep {meta.icon}; mau theo currentColor cua badge
export const TABLE_STATUS_META = {
  1: { color: '#22C55E', bg: 'rgba(34,197,94,.1)',   label: 'Trống',      icon: React.createElement(Check, { size: 14 }) },
  2: { color: '#EF4444', bg: 'rgba(239,68,68,.1)',   label: 'Đã đặt',     icon: React.createElement(ClipboardList, { size: 14 }) },
  3: { color: '#F59E0B', bg: 'rgba(245,158,11,.1)',  label: 'Đang dùng',  icon: React.createElement(Users, { size: 14 }) },
  4: { color: '#94A3B8', bg: 'rgba(148,163,184,.12)',label: 'Dọn dẹp',    icon: React.createElement(SprayCan, { size: 14 }) },
  5: { color: '#3D2B1F', bg: 'rgba(61,43,31,.1)',    label: 'Bảo trì',    icon: React.createElement(Wrench, { size: 14 }) },
}

export const DEFAULT_TABLE_STATUS_META = { color: '#94A3B8', bg: 'rgba(148,163,184,.12)', label: 'Không xác định', icon: '?' }

export const BOOKING_STATUS_LABEL = {
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Đang phục vụ',
}

export const formatMoney = (value) =>
  `${Number(value || 0).toLocaleString('vi-VN')}₫`

export const formatTime = (isoString) => {
  if (!isoString) return ''
  return new Date(isoString).toLocaleString('vi-VN', {
    hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit',
  })
}
