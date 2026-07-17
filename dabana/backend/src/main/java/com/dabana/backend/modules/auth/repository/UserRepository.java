package com.dabana.backend.modules.auth.repository;

import com.dabana.backend.modules.auth.entity.User;
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

    @Query("SELECT u FROM User u WHERE u.email = :identifier OR u.phone = :identifier")
    Optional<User> findByEmailOrPhone(@Param("identifier") String identifier);
}
