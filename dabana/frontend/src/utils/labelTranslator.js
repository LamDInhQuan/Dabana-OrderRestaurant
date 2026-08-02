export const dictionary = {
  // BookingStatus
  HOLDING: 'Đang giữ bàn',
  AWAITING_PAYMENT: 'Chờ thanh toán',
  CONFIRMED: 'Đã xác nhận',
  PENDING_NO_SHOW: 'Chờ xác nhận đến',
  NO_SHOW: 'Không đến',
  CHECKED_IN: 'Đang phục vụ',
  COMPLETED: 'Hoàn thành',
  CANCELLED_BY_CUSTOMER: 'Khách hàng hủy',
  CANCELLED_BY_RESTAURANT: 'Nhà hàng hủy',
  EXPIRED: 'Hết hạn',
  REFUNDING: 'Đang hoàn tiền',
  REFUNDED: 'Đã hoàn tiền',

  // RefundStatus & PayoutState
  NONE: 'Không có',
  PENDING: 'Chờ xử lý',
  SUCCESS: 'Thành công',
  FAILED: 'Thất bại',
  PROCESSING: 'Đang xử lý',
  SUCCEEDED: 'Thành công',

  // Payment Status
  PAID: 'Đã thanh toán',
  UNPAID: 'Chưa thanh toán',

  // SubscriptionStatus
  PENDING_PAYMENT: 'Chờ thanh toán',
  ACTIVE: 'Đang hoạt động',
  PAST_DUE: 'Quá hạn',
  CANCELLED: 'Đã hủy',

  // Restaurant ApprovalStatus / ProfileStatus
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
  PAYOS: 'PayOS',

  // Cashflow / Payout State
  HELD: 'Tạm giữ',
  COLLECTED: 'Đã thu',

  // InvoiceType
  INITIAL: 'Đăng ký mới',
  RENEWAL: 'Gia hạn',
  UPGRADE: 'Nâng cấp',

  // Revenue Composition
  PREORDER: 'Đặt trước',
  EXTRA_ORDER: 'Gọi thêm',
  SURCHARGE: 'Phụ thu',
  'DAT TRUOC': 'Đặt trước',
  'GOI THEM': 'Gọi thêm',
  'PHU THU': 'Phụ thu',
  TRANSFER: 'Chuyển khoản'
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
