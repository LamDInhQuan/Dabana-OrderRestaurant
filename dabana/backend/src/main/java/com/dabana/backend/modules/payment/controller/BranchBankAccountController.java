package com.dabana.backend.modules.payment.controller;

import com.dabana.backend.exception.BusinessException;
import com.dabana.backend.modules.branch2.entity.Branch;
import com.dabana.backend.modules.branch2.repository.BranchRepository; // TODO: doi neu ten repository thuc te khac
import com.dabana.backend.modules.payment.dto.request.CreateBranchBankAccountRequest;
import com.dabana.backend.modules.payment.dto.request.UpdateBranchBankAccountRequest;
import com.dabana.backend.modules.payment.dto.response.BranchBankAccountResponse;
import com.dabana.backend.modules.payment.entity.BankCatalog;
import com.dabana.backend.modules.payment.entity.BranchBankAccount;
import com.dabana.backend.modules.payment.mapper.BranchBankAccountMapper;
import com.dabana.backend.modules.payment.repository.BankCatalogRepository;
import com.dabana.backend.modules.payment.repository.BranchBankAccountRepository;
import com.dabana.backend.modules.payment.service.PayosClientProvider;
import com.dabana.backend.modules.payment.util.AesEncryptionUtil;
import com.dabana.backend.modules.payment.util.PaymentErrorCode;
import jakarta.validation.Valid;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;

/**
 * Quan ly tai khoan ngan hang cua branch - gom credential cua CA 2 kenh payOS:
 * - Kenh THU (payos*): tao/huy link thanh toan coc.
 * - Kenh CHI (payosPayout*): tao lenh chi hoan coc.
 * Ca 2 kenh deu la CUA RIENG branch/nha hang do (Dabana la nen tang cho nhieu
 * nha hang khac nhau, khong dung chung 1 kenh cua Dabana cho tat ca).
 */
@RestController
@RequestMapping("/api/payment/branch-bank-accounts")
public class BranchBankAccountController {

    private final BranchBankAccountRepository branchBankAccountRepository;
    private final BankCatalogRepository bankCatalogRepository;
    private final BranchRepository branchRepository;
    private final AesEncryptionUtil aesEncryptionUtil;
    private final PayosClientProvider payosClientProvider;
    private final BranchBankAccountMapper branchBankAccountMapper;

    public BranchBankAccountController(BranchBankAccountRepository branchBankAccountRepository,
                                        BankCatalogRepository bankCatalogRepository,
                                        BranchRepository branchRepository,
                                        AesEncryptionUtil aesEncryptionUtil,
                                        PayosClientProvider payosClientProvider,
                                        BranchBankAccountMapper branchBankAccountMapper) {
        this.branchBankAccountRepository = branchBankAccountRepository;
        this.bankCatalogRepository = bankCatalogRepository;
        this.branchRepository = branchRepository;
        this.aesEncryptionUtil = aesEncryptionUtil;
        this.payosClientProvider = payosClientProvider;
        this.branchBankAccountMapper = branchBankAccountMapper;
    }

    @GetMapping("/{branchId}")
    public BranchBankAccountResponse getByBranch(@PathVariable Long branchId) {
        BranchBankAccount entity = branchBankAccountRepository.findByBranch_Id(branchId)
                .orElseThrow(() -> new BusinessException(PaymentErrorCode.BRANCH_BANK_ACCOUNT_NOT_FOUND));
        return branchBankAccountMapper.toResponse(entity);
    }

    @PostMapping
    public BranchBankAccountResponse create(@Valid @RequestBody CreateBranchBankAccountRequest request) {
        if (branchBankAccountRepository.existsByBranch_Id(request.getBranchId())) {
            throw new BusinessException(PaymentErrorCode.BRANCH_BANK_ACCOUNT_ALREADY_EXISTS);
        }
        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new BusinessException(PaymentErrorCode.BRANCH_NOT_FOUND));
        BankCatalog bank = bankCatalogRepository.findById(request.getBankId())
                .orElseThrow(() -> new BusinessException(PaymentErrorCode.BANK_NOT_FOUND));

        BranchBankAccount entity = new BranchBankAccount();
        entity.setBranch(branch);
        entity.setBank(bank);
        entity.setAccountNumber(request.getAccountNumber());
        entity.setAccountName(request.getAccountName());

        // ---- Kenh THU (co the de trong luc tao, bo sung sau qua update) ----
        entity.setPayosClientId(request.getPayosClientId());
        entity.setPayosApiKeyEncrypted(aesEncryptionUtil.encrypt(request.getPayosApiKey()));
        entity.setPayosChecksumKeyEncrypted(aesEncryptionUtil.encrypt(request.getPayosChecksumKey()));

        // ---- Kenh CHI - RIENG cua branch nay, KHONG dung chung toan he thong ----
        entity.setPayosPayoutClientId(request.getPayosPayoutClientId());
        entity.setPayosPayoutApiKeyEncrypted(aesEncryptionUtil.encrypt(request.getPayosPayoutApiKey()));
        entity.setPayosPayoutChecksumKeyEncrypted(aesEncryptionUtil.encrypt(request.getPayosPayoutChecksumKey()));

        entity = branchBankAccountRepository.save(entity);
        return branchBankAccountMapper.toResponse(entity);
    }

    @PatchMapping("/{id}")
    public BranchBankAccountResponse update(@PathVariable Long id,
                                             @Valid @RequestBody UpdateBranchBankAccountRequest request) {
        BranchBankAccount entity = branchBankAccountRepository.findById(id)
                .orElseThrow(() -> new BusinessException(PaymentErrorCode.BRANCH_BANK_ACCOUNT_NOT_FOUND));

        if (request.getBankId() != null) {
            BankCatalog bank = bankCatalogRepository.findById(request.getBankId())
                    .orElseThrow(() -> new BusinessException(PaymentErrorCode.BANK_NOT_FOUND));
            entity.setBank(bank);
        }
        if (StringUtils.hasText(request.getAccountNumber())) {
            entity.setAccountNumber(request.getAccountNumber());
        }
        if (StringUtils.hasText(request.getAccountName())) {
            entity.setAccountName(request.getAccountName());
        }

        // ---- Kenh THU ----
        if (StringUtils.hasText(request.getPayosClientId())) {
            entity.setPayosClientId(request.getPayosClientId());
        }
        if (StringUtils.hasText(request.getPayosApiKey())) {
            entity.setPayosApiKeyEncrypted(aesEncryptionUtil.encrypt(request.getPayosApiKey()));
        }
        if (StringUtils.hasText(request.getPayosChecksumKey())) {
            entity.setPayosChecksumKeyEncrypted(aesEncryptionUtil.encrypt(request.getPayosChecksumKey()));
        }

        // ---- Kenh CHI ----
        if (StringUtils.hasText(request.getPayosPayoutClientId())) {
            entity.setPayosPayoutClientId(request.getPayosPayoutClientId());
        }
        if (StringUtils.hasText(request.getPayosPayoutApiKey())) {
            entity.setPayosPayoutApiKeyEncrypted(aesEncryptionUtil.encrypt(request.getPayosPayoutApiKey()));
        }
        if (StringUtils.hasText(request.getPayosPayoutChecksumKey())) {
            entity.setPayosPayoutChecksumKeyEncrypted(aesEncryptionUtil.encrypt(request.getPayosPayoutChecksumKey()));
        }

        if (request.getIsActive() != null) {
            entity.setIsActive(request.getIsActive());
        }

        entity = branchBankAccountRepository.save(entity);
        // Credential (thu hoac chi) co the vua doi -> xoa cache client cu de lan goi sau tao lai dung key moi.
        payosClientProvider.invalidate(entity.getId());
        return branchBankAccountMapper.toResponse(entity);
    }
}