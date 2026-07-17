package com.dabana.backend.modules.auth.repository;

import com.dabana.backend.modules.auth.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    @EntityGraph(attributePaths = {"userRoles.role"}) // như lệnh join bảng
    Optional<User> findById(Long id);

    Optional<User> findByEmail(String email);

    Optional<User> findByPhone(String phone);

    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);

    long countByStatus(Integer status);

    @Query("SELECT u FROM User u WHERE u.email = :identifier OR u.phone = :identifier")
    Optional<User> findByEmailOrPhone(@Param("identifier") String identifier);

    /**
     * F44: Quan tri vien tim kiem/loc tai khoan Khach hang & Nha hang doi tac
     * toan he thong theo vai tro, trang thai va tu khoa (ten/email/sdt).
     */
    @EntityGraph(attributePaths = {"userRoles.role"})
    @Query("""
        SELECT DISTINCT u FROM User u
        LEFT JOIN u.userRoles ur
        LEFT JOIN ur.role r
        WHERE (:role IS NULL OR r.name = :role)
        AND (:status IS NULL OR u.status = :status)
        AND (:keyword IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%'))
             OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
             OR u.phone LIKE CONCAT('%', :keyword, '%'))
        """)
    Page<User> searchUsers(@Param("role") String role,
                            @Param("status") Integer status,
                            @Param("keyword") String keyword,
                            Pageable pageable);
}
