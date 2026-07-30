export const dictionary = {
  // BookingStatus
  HOLDING: 'Đang giữ bàn',
  AWAITING_PAYMENT: 'Chờ thanh toán',
  CONFIRMED: 'Xác nhận',
  PENDING_NO_SHOW: 'Dự kiến không đến',
  NO_SHOW: 'Không đến',
  CHECKED_IN: 'Check In',
  COMPLETED: 'Hoàn thành',
  CANCELLED_BY_CUSTOMER: 'Khách hàng hủy',
  CANCELLED_BY_RESTAURANT: 'Nhà hàng Hủy',
  EXPIRED: 'Hết hạn',
  REFUNDING: 'Đang hoàn tiền',
  REFUNDED: 'Đã hoàn tiền',

  // SubscriptionStatus
  PENDING_PAYMENT: 'Chờ thanh toán',
  ACTIVE: 'Đang hoạt động',
  PAST_DUE: 'Quá hạn',
  CANCELLED: 'Hủy',

  // Restaurant ApprovalStatus / ProfileStatus
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  PENDING_UPDATE: 'Chờ cập nhật',
  REJECTED: 'Từ chối',

  // UserRole
  CUSTOMER: 'Khách hàng',
  RESTAURANT_PARTNER: 'Nhà hàng đối tác',
  ADMIN: 'Quản trị viên',
  SYSTEM_ADMIN: 'Quản trị hệ thống',

  // Payment Method / Deposit Method
  CASH: 'Tiền mặt',
  CREDIT_CARD: 'Thẻ tín dụng',
  MOMO: 'MoMo',
  VNPAY: 'VNPay',
  ZALOPAY: 'ZaloPay',
  BANK_TRANSFER: 'Chuyển khoản',

  // Cashflow / Payout State
  HELD: 'Tạm giữ',
  COLLECTED: 'Đã thu',

  // InvoiceType
  INITIAL: 'Đăng ký mới',
  RENEWAL: 'Gia hạn',
  UPGRADE: 'Nâng cấp'
};

export function translateLabel(label) {
  if (!label) return label;

  const originalStr = String(label);
  let key = originalStr.trim().toUpperCase();

  // Clean up if backend still sent "chưa dịch: "
  if (originalStr.startsWith("chưa dịch: ")) {
    key = originalStr.replace("chưa dịch: ", "").trim().toUpperCase();
  }

  if (dictionary[key]) {
    return dictionary[key];
  }

  // If not found in dictionary, return the cleaned raw string (or original if not cleaned)
  if (originalStr.startsWith("chưa dịch: ")) return key;
  return label;
}
