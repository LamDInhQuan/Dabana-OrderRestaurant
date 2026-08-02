package com.dabana.backend.modules.payment;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.config.PayOSConfig;
import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.booking.Booking;
import com.dabana.backend.modules.booking.BookingErrorCode;
import com.dabana.backend.modules.booking.BookingRepository;
import com.dabana.backend.modules.booking.BookingStatus;
import com.dabana.backend.modules.booking.dto.BookingDtos;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import vn.payos.PayOS;
import vn.payos.model.v1.payouts.Payout;
import vn.payos.model.v1.payouts.PayoutRequests;
import vn.payos.model.v2.paymentRequests.PaymentLink;

import java.time.LocalDateTime;
import java.util.List;


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
                    "qrCode", paymentLink.getQrCode(),
                    "status", paymentLink.getStatus()
            );
            booking.setQrCode(paymentLink.getQrCode());
            bookingRepository.save(booking);
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
                bookingOptional.get().setConfirmedAt(LocalDateTime.now());
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

    @GetMapping("/info/{orderCode}")
    public ResponseEntity<?> getPaymentInfo(@PathVariable Long orderCode) {
        try {
            var booking = bookingRepository.findById(orderCode)
                    .orElseThrow(() -> new BusinessException(BookingErrorCode.BOOKING_NOT_FOUND));

            PaymentLink paymentInfo = payOS.paymentRequests().get(orderCode);

            java.util.Map<String, Object> responseData = java.util.Map.of(
                    "orderCode", orderCode,
                    "amount", paymentInfo.getAmount(),
                    "amountPaid", paymentInfo.getAmountPaid(),
                    "amountRemaining", paymentInfo.getAmountRemaining(),
                    "status", paymentInfo.getStatus(),
                    "qrCode", booking.getQrCode() != null ? booking.getQrCode() : "",
                    "bookingStatus", booking.getStatus()
            );

            return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, responseData));

        } catch (Exception e) {
            System.err.println("❌ Lỗi lấy thông tin phiên thanh toán: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ResponseBuilder.error(PaymentErrorCode.PAYMENT_NOT_FOUND));
        }
    }

    @PostMapping("/{bookingId}/cancel-refund")
    public ResponseEntity<?> cancelAndRefund(
            @PathVariable Long bookingId,
            @RequestBody(required = false) BookingDtos.CancelRequest refundRequest) {
        try {
            Booking booking = bookingRepository.findById(bookingId)
                    .orElseThrow(() -> new BusinessException(BookingErrorCode.BOOKING_NOT_FOUND));

            if (booking.getStatus() != BookingStatus.CONFIRMED) {
                return ResponseEntity.badRequest()
                        .body(ResponseBuilder.error(BookingErrorCode.BOOKING_CANNOT_CANCEL));
            }

            // Kiểm tra dữ liệu ngân hàng do FE gửi lên
            if (refundRequest == null || refundRequest.getToBin() == null || refundRequest.getToAccountNumber() == null) {
                return ResponseEntity.badRequest()
                        .body(ResponseBuilder.error(BookingErrorCode.MISSING_REFUND_BANK_INFO));
            }

            // Tạo mã tham chiếu duy nhất cho giao dịch hoàn tiền
            String referenceId = "refund_" + bookingId + "_" + System.currentTimeMillis();

            // Tạo request gọi PayOS Payout (Fix cứng 1000đ để test demo)
            PayoutRequests payoutRequest = PayoutRequests.builder()
                    .referenceId(referenceId)
                    .amount(Long.valueOf(2000))
                    .description("Hoan coc don " + bookingId)
                    .toBin(refundRequest.getToBin())
                    .toAccountNumber(refundRequest.getToAccountNumber())
                    .category(List.of("booking"))
                    .build();

            // Thực hiện gọi API hoàn tiền qua PayOS SDK
            Payout payout = payOS.payouts().create(payoutRequest);

            // Cập nhật trạng thái đơn hàng sang đang hoàn tiền
            booking.setStatus(BookingStatus.REFUNDING);
            // booking.setRefundReferenceId(referenceId); // Có thể mở comment nếu đã có cột này trong Entity
            booking.setQrCode(null);
            bookingRepository.save(booking);

            return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS,
                    java.util.Map.of(
                            "payoutId", payout.getId(),
                            "state", payout.getApprovalState(),
                            "referenceId", referenceId
                    )));

        } catch (Exception e) {
            System.err.println("❌ Lỗi hoàn cọc: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(ResponseBuilder.error(PaymentErrorCode.REFUND_FAILED));
        }
    }

    @PostMapping("/webhook/refund")
    public ResponseEntity<?> handleRefundWebhook(@RequestBody com.fasterxml.jackson.databind.JsonNode webhookBody) {
        try {
            System.out.println("====== NHẬN WEBHOOK HOÀN TIỀN (REFUND) ======");
            System.out.println(webhookBody.toPrettyString());

            // 1. Kiểm tra sự kiện test (nếu cổng thanh toán có gửi ping test)
            if (webhookBody.has("desc") && "Webhook Test".equals(webhookBody.get("desc").asText())) {
                System.out.println("✅ Nhận được tín hiệu test hoàn tiền từ cổng thanh toán - Server OK!");
                return ResponseEntity.ok(java.util.Map.of("error", 0, "message", "OK"));
            }

            // 2. Bóc tách dữ liệu hoàn tiền từ payload (Tùy chỉnh path theo JSON thực tế của cổng thanh toán)
            JsonNode dataNode = webhookBody.path("data");
            if (dataNode.isMissingNode()) {
                return ResponseEntity.ok(java.util.Map.of("error", 0, "message", "Ignore non-refund event"));
            }

            // Lấy thông tin mã đơn hàng hoặc mã giao dịch hoàn tiền
            // (Ví dụ: orderCode ở đây đại diện cho bookingId hoặc mã refund tùy cấu trúc bạn truyền đi lúc tạo lệnh refund)
            String orderCodeStr = dataNode.path("orderCode").asText();
            if (orderCodeStr == null || orderCodeStr.isEmpty()) {
                return ResponseEntity.ok(java.util.Map.of("error", 0, "message", "Missing orderCode in refund data"));
            }

            Long bookingId = Long.parseLong(orderCodeStr);
            var bookingOptional = bookingRepository.findById(bookingId);

            if (bookingOptional.isEmpty()) {
                System.err.println("⚠️ [Refund Webhook] Không tìm thấy đơn hàng ID: " + bookingId);
                return ResponseEntity.ok(java.util.Map.of("error", 0, "message", "Booking not found"));
            }

            var booking = bookingOptional.get();

            // 3. Xử lý cập nhật trạng thái hoàn tiền (Ví dụ: kiểm tra kết quả thành công từ cổng thanh toán)
            // Thay đổi tùy theo trường trạng thái trả về của cổng (VD: "success", "completed", code == 0...)
            boolean isRefundSuccess = dataNode.path("success").asBoolean(false)
                    || "SUCCESS".equalsIgnoreCase(dataNode.path("status").asText());

            if (isRefundSuccess) {
                // Cập nhật trạng thái đơn thành đã hủy hoàn tất sau khi refund thành công
                booking.setStatus(BookingStatus.REFUNDED); // hoặc CANCELLED_BY_RESTAURANT tùy luồng
                bookingRepository.save(booking);

                // TODO: (Tùy chọn) Cập nhật thêm bảng/trạng thái hoàn tiền riêng nếu bạn có bảng booking_refunds

                System.out.println("🎉 [Refund Webhook] Đơn đặt bàn ID " + bookingId + " đã hoàn tiền và hủy thành công!");
            } else {
                System.out.println("⚠️ [Refund Webhook] Giao dịch hoàn tiền cho đơn ID " + bookingId + " chưa thành công hoặc đang xử lý.");
            }

            // 4. Phản hồi lại để cổng thanh toán xác nhận đã nhận webhook
            return ResponseEntity.ok(java.util.Map.of(
                    "error", 0,
                    "message", "Xử lý webhook hoàn tiền thành công"
            ));

        } catch (Exception e) {
            System.err.println("❌ Lỗi xử lý Webhook hoàn tiền: " + e.getMessage());
            e.printStackTrace();

            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(java.util.Map.of(
                            "error", 1,
                            "message", "Xử lý dữ liệu Webhook hoàn tiền thất bại: " + e.getMessage()
                    ));
        }
    }
}