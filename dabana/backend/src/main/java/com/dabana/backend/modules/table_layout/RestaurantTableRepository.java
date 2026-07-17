package com.dabana.backend.modules.table_layout;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {

    List<RestaurantTable> findByZoneId(Long zoneId);

    List<RestaurantTable> findByZoneBranchId(Long branchId);

    /**
     * B08 Buoc 4: khoa ban ghi (pessimistic lock) khi co nhieu yeu cau
     * dong thoi tac dong len cung mot ban, ket hop voi @Version
     * (optimistic locking) tren BaseEntity.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM RestaurantTable t WHERE t.id = :id")
    Optional<RestaurantTable> findByIdForUpdate(@Param("id") Long id);

    List<RestaurantTable> findByZoneBranchIdAndStatus(Long branchId, TableStatus status);
}
