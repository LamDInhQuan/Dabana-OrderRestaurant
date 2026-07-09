package com.dabana.backend.modules.branch2.dto;
import lombok.Data;

@Data
public class BranchImageDto {
    private Integer id; // Dùng khi cập nhật, nếu ảnh mới thì id = null
    private String imageUrl;
    private Integer isCover;
    private Integer displayOrder;
}