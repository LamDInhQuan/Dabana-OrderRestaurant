package com.dabana.backend.modules.payment.controller;

import com.dabana.backend.modules.payment.dto.response.BankCatalogResponse;
import com.dabana.backend.modules.payment.mapper.BankCatalogMapper;
import com.dabana.backend.modules.payment.repository.BankCatalogRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/payment/banks")
public class BankCatalogController {

    private final BankCatalogRepository bankCatalogRepository;
    private final BankCatalogMapper bankCatalogMapper;

    public BankCatalogController(BankCatalogRepository bankCatalogRepository,
                                  BankCatalogMapper bankCatalogMapper) {
        this.bankCatalogRepository = bankCatalogRepository;
        this.bankCatalogMapper = bankCatalogMapper;
    }

    @GetMapping
    public List<BankCatalogResponse> list() {
        return bankCatalogRepository.findAllByIsActiveTrue().stream()
                .map(bankCatalogMapper::toResponse)
                .toList();
    }
}