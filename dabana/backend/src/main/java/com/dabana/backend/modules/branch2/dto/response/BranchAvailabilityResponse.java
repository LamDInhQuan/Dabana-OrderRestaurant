package com.dabana.backend.modules.branch2.dto.response;

import com.dabana.backend.modules.branch2.dto.BranchImageDto;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
public class BranchAvailabilityResponse {
    // Các trường thông tin cơ bản sẵn có từ BranchResponse của ông
    private Long id;
    private Integer restaurantId;
    private String name;
    private String province;
    private String address;
    private String phone;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private Integer status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<BranchImageDto> branchImageDtos;

    // --- BỔ SUNG CHO TÍNH NĂNG ĐẶT BÀN ---

    // Giờ hoạt động hiển thị (Ví dụ: "10:00 - 22:00") hoặc cấu trúc tuỳ ý
    private String operatingHours;

    // Danh sách các khung giờ trống trong ngày user chọn (VD: ["13:00", "13:15", "13:30"])
    private List<String> availableSlots;

    // Map chứa danh sách khu vực và bàn tương ứng với từng khung giờ
    // Key: Khung giờ (VD: "13:00"), Value: Danh sách khu vực kèm bàn trống ở giờ đó
    private Map<String, List<ZoneAvailabilityDto>> zonesBySlot;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ZoneAvailabilityDto {
        private Long zoneId;
        private String zoneName;
        private List<TableAvailabilityDto> tables;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TableAvailabilityDto {
        private Long id;
        private String name;
        private Integer capacity;
    }
}