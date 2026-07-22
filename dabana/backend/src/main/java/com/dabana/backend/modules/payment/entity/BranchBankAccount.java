package com.dabana.backend.modules.payment.entity;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.branch2.entity.Branch;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Tai khoan ngan hang cua tung branch (moi branch dung 1 tai khoan - UNIQUE branch_id).
 * Dabana la NEN TANG cho nhieu nha hang khac nhau, nen ca kenh THU va kenh CHI
 * deu phai la cua RIENG branch/nha hang do (KHONG dung chung 1 kenh cua Dabana):
 * - THU: payos_client_id / payos_api_key_encrypted / payos_checksum_key_encrypted.
 * - CHI: payos_payout_client_id / payos_payout_api_key_encrypted / payos_payout_checksum_key_encrypted.
 *   payOS quy dinh checksum key cua kenh chi KHAC checksum key cua kenh thu,
 *   nen luu tach rieng 3 truong, khong dung chung voi bo credential THU.
 */
@Getter
@Setter
@Entity
@Table(name = "pm_branch_bank_accounts")
public class BranchBankAccount extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false, unique = true)
    private Branch branch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_id", nullable = false)
    private BankCatalog bank;

    @Column(name = "account_number", nullable = false, length = 50)
    private String accountNumber;

    @Column(name = "account_name", nullable = false, length = 150)
    private String accountName;

    // ---- Kenh THU (tao/huy link thanh toan coc) ----

    @Column(name = "payos_client_id", length = 255)
    private String payosClientId;

    @Column(name = "payos_api_key_encrypted", length = 255)
    private String payosApiKeyEncrypted;

    @Column(name = "payos_checksum_key_encrypted", length = 255)
    private String payosChecksumKeyEncrypted;

    // ---- Kenh CHI (hoan coc) - RIENG cho tung branch, khong dung chung ----

    @Column(name = "payos_payout_client_id", length = 255)
    private String payosPayoutClientId;

    @Column(name = "payos_payout_api_key_encrypted", length = 255)
    private String payosPayoutApiKeyEncrypted;

    @Column(name = "payos_payout_checksum_key_encrypted", length = 255)
    private String payosPayoutChecksumKeyEncrypted;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}