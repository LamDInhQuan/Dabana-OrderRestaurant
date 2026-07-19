// Khop voi util/MenuItemStatus.java: SELLING(1) OUT_OF_STOCK(0) DISCONTINUED(-1)
// Luu y: BE khong co @JsonValue rieng nen field "status" tren JSON la CHUOI ten enum
// ("SELLING"/"OUT_OF_STOCK"/"DISCONTINUED"), khong phai so code -> dung dung key ben duoi lam index.
export const MENU_STATUS_META = {
  SELLING: { code: 1, label: 'Đang bán', badgeClass: 'badge-green' },
  OUT_OF_STOCK: { code: 0, label: 'Tạm ẩn', badgeClass: 'badge-yellow' },
  DISCONTINUED: { code: -1, label: 'Ngừng bán', badgeClass: 'badge-red' },
}

export const DEFAULT_STATUS_META = { code: null, label: 'Không xác định', badgeClass: 'badge-gray' }

export const getStatusMeta = (status) => MENU_STATUS_META[status] || DEFAULT_STATUS_META

// Dung cho select filter trong MenuFilterBar
export const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'SELLING', label: 'Đang bán' },
  { value: 'OUT_OF_STOCK', label: 'Tạm ẩn' },
  { value: 'DISCONTINUED', label: 'Ngừng bán' },
]

// Dung cho select trong form them/sua mon (giu dung thu tu code de nguoi dung de hinh dung)
export const STATUS_OPTIONS = [
  { value: 'SELLING', label: MENU_STATUS_META.SELLING.label },
  { value: 'OUT_OF_STOCK', label: MENU_STATUS_META.OUT_OF_STOCK.label },
  { value: 'DISCONTINUED', label: MENU_STATUS_META.DISCONTINUED.label },
]