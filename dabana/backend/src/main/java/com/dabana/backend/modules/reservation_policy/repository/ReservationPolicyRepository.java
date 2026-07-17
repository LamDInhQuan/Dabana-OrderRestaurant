package com.dabana.backend.modules.reservation_policy.repository;

import com.dabana.backend.modules.reservation_policy.entity.ReservationPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReservationPolicyRepository extends JpaRepository<ReservationPolicy, Long> {

    Optional<ReservationPolicy> findByIdAndRestaurantId(
            Long id,
            Long restaurantId
    );

    @Query("""
    SELECT DISTINCT p
    FROM ReservationPolicy p
    LEFT JOIN FETCH p.depositRules
    LEFT JOIN FETCH p.schedules
    WHERE p.id = :policyId
      AND p.restaurant.id = :restaurantId
""")
    Optional<ReservationPolicy> findDetailByIdAndRestaurantId(
            @Param("policyId") Long policyId,
            @Param("restaurantId") Long restaurantId
    );

    List<ReservationPolicy> findAllByRestaurantId(Long restaurantId);

    boolean existsByRestaurantIdAndPolicyCode(
            Long restaurantId,
            String policyCode
    );

    boolean existsByRestaurantIdAndPolicyCodeAndIdNot(
            Long restaurantId,
            String policyCode,
            Long id
    );

}