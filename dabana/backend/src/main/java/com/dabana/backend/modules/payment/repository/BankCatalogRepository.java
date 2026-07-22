package com.dabana.backend.modules.payment.repository;

import com.dabana.backend.modules.payment.entity.BankCatalog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BankCatalogRepository extends JpaRepository<BankCatalog, Integer> {

    Optional<BankCatalog> findByBin(String bin);

    Optional<BankCatalog> findByCode(String code);

    /** Danh sach ngan hang cho phep chon khi tao tk branch / nhap tk hoan tien (F/E dropdown). */
    List<BankCatalog> findAllByIsActiveTrue();

    boolean existsByBin(String bin);
}