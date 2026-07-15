package com.dabana.backend.modules.branch2.dto.response;

import com.dabana.backend.modules.branch2.dto.BranchImageDto;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class BranchResponse {
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
    private List<BranchImageDto> branchImageDtos ;
}
