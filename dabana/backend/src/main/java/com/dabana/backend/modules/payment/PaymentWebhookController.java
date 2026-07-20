package com.dabana.backend.modules.payment;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.config.PayOSConfig;
import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.booking.BookingErrorCode;
import com.dabana.backend.modules.booking.BookingRepository;
import com.dabana.backend.modules.booking.BookingStatus;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.payos.PayOS;


@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentWebhookController {

    private final BookingRepository bookingRepository; // hoặc BookingService của bạn
    private final PayOS payOS; // 🌟 Tiêm Bean PayOS vào đây để sử dụng

    // 1. Định nghĩa nhanh DTO nhận dữ liệu từ Frontend gửi lên
    @Data
    public static class CreatePaymentDto {
        private Long bookingId;
    }

    @PostMapping("/create-link")
    public ResponseEntity<?> createPaymentLink(@RequestBody CreatePaymentDto dto) {
        try {
            // 1. Tìm thông tin booking để lấy mã số
            var booking = bookingRepository.findById(dto.getBookingId())
                    .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn hàng"));

            // 2. Đóng gói dữ liệu theo đúng class mới CreatePaymentLinkRequest của bản v2
            vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest paymentRequest =
                    vn.payos.model.v2.paymentRequests.CreatePaymentLinkRequest.builder()
                            .orderCode(booking.getId()) // Mã đơn hàng dạng Long
                            .amount(2000L)              // Số tiền (bản v2 yêu cầu kiểu Long, thêm chữ L đằng sau)
                            .description("Thanh toan BK" + booking.getId())
                            .returnUrl("http://localhost:5173/booking/payment/" + booking.getId() + "?status=success")
                            .cancelUrl("http://localhost:5173/booking/payment/" + booking.getId() + "?status=cancel")
                            .build();

            // 3. Gọi SDK bản v2 để tạo link thanh toán (Cực kỳ ngắn gọn, tự động tính toán Signature ngầm)
            var paymentLink = payOS.paymentRequests().create(paymentRequest);

            // 4. Đóng gói kết quả trả về cho Frontend y như cũ
            java.util.Map<String, Object> finalResponse = java.util.Map.of(
                    "orderCode", booking.getId(),
                    "amount", 2000,
                    "checkoutUrl", paymentLink.getCheckoutUrl(),
                    "qrCode", paymentLink.getQrCode(),
                    "status", paymentLink.getStatus()
            );

            return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, finalResponse));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Lỗi tạo link thanh toán: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<String>> handlePayOSWebhook(@RequestBody JsonNode webhookBody) {
        // Log ra màn hình console để bạn nhìn thấy cục dữ liệu PayOS bắn về máy mình qua ngrok
        System.out.println("====== NHẬN WEBHOOK TỪ PAYOS ======");
        System.out.println(webhookBody.toString());

        // Tạm thời trả về 200 SUCCESS để PayOS biết máy của bạn đã thông đường truyền ngon lành
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, "Nhận webhook thành công!"));
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> handlePayosWebhook(@RequestBody com.fasterxml.jackson.databind.JsonNode webhookBody) {
        try {
            System.out.println("====== NHẬN WEBHOOK TỪ PAYOS ======");
            System.out.println(webhookBody.toPrettyString());

            if (webhookBody.has("desc") && "Webhook Test".equals(webhookBody.get("desc").asText())) {
                System.out.println("✅ Nhận được tín hiệu test từ PayOS - Server OK!");
                return ResponseEntity.ok(java.util.Map.of("error", 0, "message", "OK"));
            }

            // 2. Logic xử lý thanh toán thật (như cũ)
            JsonNode dataNode = webhookBody.path("data");
            if (dataNode.isMissingNode()) {
                return ResponseEntity.ok(java.util.Map.of("error", 0, "message", "Ignore non-payment event"));
            }

            Long bookingId = Long.parseLong(dataNode.path("orderCode").asText());
            var bookingOptional = bookingRepository.findById(bookingId);

            // 3. Xử lý "Không tìm thấy booking" một cách an toàn
            if (bookingOptional.isEmpty()) {
                System.err.println("⚠️ [PayOS Webhook] Không tìm thấy đơn hàng ID: " + bookingId);
                return ResponseEntity.ok(java.util.Map.of("error", 0, "message", "Booking not found"));
            }


            // 3. Cập nhật trạng thái (Quân kiểm tra lại trạng thái HOLDING hoặc PENDING của dự án nhé)
            if (bookingOptional.get().getStatus() == BookingStatus.HOLDING) {
                bookingOptional.get().setStatus(BookingStatus.CONFIRMED);
                bookingRepository.save(bookingOptional.get());
                System.out.println("🎉 [PayOS Webhook] Đơn đặt bàn ID " + bookingId + " đã cập nhật CONFIRMED thành công!");
            } else {
                System.out.println("⚠️ [PayOS Webhook] Đơn hàng ID " + bookingId + " đã ở trạng thái: " + bookingOptional.get().getStatus());
            }

            // 4. Trả về đúng mã lỗi "error: 0" cho PayOS để xác nhận dừng retry
            return ResponseEntity.ok(java.util.Map.of(
                    "error", 0,
                    "message", "Xử lý webhook thành công"
            ));

        } catch (Exception e) {
            System.err.println("❌ Lỗi xử lý Webhook: " + e.getMessage());
            e.printStackTrace();

            // Trả về mã lỗi cho PayOS biết để gửi lại sau nếu lỗi hệ thống tạm thời
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(java.util.Map.of(
                            "error", 1,
                            "message", "Xử lý dữ liệu Webhook thất bại: " + e.getMessage()
                    ));
        }
    }

//    @GetMapping("/info/{orderCode}")
//    public ResponseEntity<?> getPaymentInfo(@PathVariable Long orderCode) {
//        try {
//            // Trả về Object thuần để Jackson tự động ép sang JSON gửi xuống React
//            Object paymentLinkData = payOS.getPaymentLinkInfomation(orderCode);
//
//            return ResponseEntity.ok(paymentLinkData);
//        } catch (Exception e) {
//            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
//        }
//    }
}