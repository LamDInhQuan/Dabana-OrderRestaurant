package com.dabana.backend.modules.admin.repository;

import com.dabana.backend.modules.admin.entity.SystemCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SystemCategoryRepository extends JpaRepository<SystemCategory, Long> {

    List<SystemCategory> findByCategoryTypeOrderByCategoryNameAsc(String categoryType);

    boolean existsByCategoryTypeAndCategoryNameIgnoreCase(String categoryType, String categoryName);

    List<SystemCategory> findAllByOrderByCategoryTypeAscCategoryNameAsc();
}
