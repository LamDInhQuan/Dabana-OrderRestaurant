// Khop dung voi diningtable/util/DiningTableStatus.java: EMPTY(1) RESERVED(2) OCCUPIED(3) CLEANING(4) MAINTENANCE(5)
export const STATUS_META = {
  1: { color: '#22C55E', label: 'Trống' },
  2: { color: '#EF4444', label: 'Đã đặt' },
  3: { color: '#F59E0B', label: 'Đang dùng' },
  4: { color: '#94A3B8', label: 'Dọn dẹp' },
  5: { color: '#1F2937', label: 'Bảo trì' },
}

export const DEFAULT_STATUS_META = { color: '#94A3B8', label: 'Không xác định' }