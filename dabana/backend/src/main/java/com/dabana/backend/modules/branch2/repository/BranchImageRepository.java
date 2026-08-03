package com.dabana.backend.modules.branch2.repository;

import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.entity.BranchImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface BranchImageRepository extends JpaRepository<BranchImage, Long> {
    @Query("SELECT img FROM BranchImage img WHERE img.branch.id IN :branchIds ORDER BY img.displayOrder ASC")
    List<BranchImage> findByBranchIdInOrderByDisplayOrderAsc(@Param("branchIds") List<Long> branchIds);
}
