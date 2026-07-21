package com.dabana.backend.modules.menu.repository;

import com.dabana.backend.modules.menu.entity.MenuItem;
import com.dabana.backend.modules.menu.util.MenuItemStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MenuItemRepository extends JpaRepository<MenuItem, Long>, JpaSpecificationExecutor<MenuItem> {

    List<MenuItem> findByCategoryIdOrderByDisplayOrderAscIdAsc(Long categoryId);

    List<MenuItem> findByCategoryIdAndStatus(Long categoryId, MenuItemStatus status);

    Optional<MenuItem> findByCategoryIdAndItemNameIgnoreCase(Long categoryId, String itemName);

    /**
     * Dem so mon theo tung trang thai trong 1 lan truy van duy nhat (GROUP BY),
     * thay vi phai goi searchItems 3 lan (moi lan la 1 cap query + count) nhu truoc.
     */
    @Query("SELECT i.status as status, COUNT(i) as total " +
            "FROM MenuItem i WHERE i.category.branch.id = :branchId GROUP BY i.status")
    List<StatusCount> countByBranchGroupedByStatus(@Param("branchId") Long branchId);

    interface StatusCount {
        MenuItemStatus getStatus();
        long getTotal();
    }
}