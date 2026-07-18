package com.dabana.backend.modules.branch2.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "rt_branch_images")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BranchImage { // bảng phụ không cần kế thừa BaseEntity
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @Column(name = "image_url", nullable = false, length = 255)
    private String imageUrl;

    @Column(name = "is_cover", nullable = false)
    private Integer isCover = 0; // 0: ảnh thường, 1: ảnh bìa

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
