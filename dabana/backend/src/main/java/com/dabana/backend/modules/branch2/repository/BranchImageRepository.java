package com.dabana.backend.modules.branch2.repository;

import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.entity.BranchImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface BranchImageRepository extends JpaRepository<BranchImage, Long> {

}
