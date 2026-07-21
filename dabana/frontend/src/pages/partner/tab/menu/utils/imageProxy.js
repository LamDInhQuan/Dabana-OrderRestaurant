/**
 * Trả về URL ảnh đã được resize + nén thông qua proxy images.weserv.nl.
 * Dùng cho MỌI nơi hiển thị ảnh món ăn (bảng danh sách, form preview, trang khách xem menu...)
 * thay vì dùng thẳng item.imageUrl gốc.
 *
 * @param {string} url - URL ảnh gốc do admin dán vào (Unsplash, hoặc bất kỳ URL public nào)
 * @param {object} opts
 * @param {number} opts.w - chiều rộng mong muốn (px)
 * @param {number} opts.h - chiều cao mong muốn (px)
 * @param {number} opts.q - chất lượng nén (1-100), 75 là hợp lý cho ảnh món ăn
 */
export function resizedImageUrl(url, { w = 80, h = 80, q = 75 } = {}) {
  if (!url) return url

  // weserv yêu cầu URL không có scheme (http:// hoặc https://) ở tham số url=
  const clean = url.replace(/^https?:\/\//, '')

  const params = new URLSearchParams({
    url: clean,
    w: String(w),
    h: String(h),
    fit: 'cover',   // cắt ảnh vừa khung, giống object-fit: cover
    q: String(q),
    output: 'webp', // webp nhẹ hơn jpeg ~25-30% cùng chất lượng, weserv tự fallback nếu trình duyệt không hỗ trợ
  })

  return `https://images.weserv.nl/?${params.toString()}`
}

// Vài preset kích thước dùng chung để tránh mỗi nơi tự đặt số khác nhau
export const IMAGE_PRESETS = {
  thumbnail: { w: 80, h: 80, q: 70 },   // ảnh nhỏ trong bảng quản lý
  card: { w: 320, h: 240, q: 75 },      // ảnh thẻ món ăn (nếu có trang khách xem menu)
  detail: { w: 800, h: 600, q: 80 },    // ảnh phóng to / chi tiết món
}