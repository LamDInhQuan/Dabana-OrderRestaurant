package com.dabana.backend.modules.branch2.dto.request;

import com.dabana.backend.modules.branch2.util.BranchScheduleExceptionType;
import com.dabana.backend.modules.branch2.validation.ValidOperatingDate;
import com.dabana.backend.modules.branch2.validation.ValidOperatingHour;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ValidOperatingDate(message = "Ngày kết thúc phải bằng hoặc sau ngày bắt đầu")
public class BranchScheduleExceptionRequest {

    @NotNull(message = "Ngày bắt đầu không được để trống.")
    @FutureOrPresent(message = "Ngày bắt đầu phải từ hôm nay trở đi.")
    private LocalDate startDate;

    @NotNull(message = "Ngày kết thúc không được để trống.")
    @FutureOrPresent(message = "Ngày kết thúc phải từ hôm nay trở đi.")
    private LocalDate endDate;

    @NotNull(message = "Loại ngoại lệ không được để trống.")
    private BranchScheduleExceptionType exceptionType;

    /**
     * Nếu đóng đúng một ca
     */
    private Long operatingHourId;

    /**
     * Nếu SPECIAL_HOURS
     */
    private LocalTime openTime;

    /**
     * Nếu SPECIAL_HOURS
     */
    private LocalTime closeTime;

    @Size(max = 255)
    private String reason;

}