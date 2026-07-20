package com.dabana.backend.modules.payment.entity;

import com.dabana.backend.common.BaseEntity;
import com.dabana.backend.modules.branch2.entity.Branch;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

/**
 * Tai khoan ngan hang cua tung branch (moi branch dung 1 tai khoan - UNIQUE branch_id).
 * - THU: la tai khoan gan voi "kenh thanh toan" (Payment Channel) tren payOS ma link
 *   thanh toan coc cua branch do se tao ra.
 * - CHI: la can cu doi soat noi bo khi tao lenh chi hoan coc (xem
 *   pm_payout_orders.source_branch_bank_account_id).
 *
 * Luu y bao mat: payos_api_key_encrypted / payos_checksum_key_encrypted duoc luu o
 * dang da ma hoa (xem util.AesEncryptionUtil se bo sung o buoc sau), KHONG bao gio
 * lay ra plaintext ngoai tang service goi payOS.
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
    private String accountName; // Ten chu tk, khong dau, IN HOA theo chuan ngan hang

    @Column(name = "payos_client_id", length = 255)
    private String payosClientId; // x-client-id cua kenh thanh toan payOS gan voi branch nay

    @Column(name = "payos_api_key_encrypted", length = 255)
    private String payosApiKeyEncrypted; // x-api-key, luu o dang da ma hoa AES

    @Column(name = "payos_checksum_key_encrypted", length = 255)
    private String payosChecksumKeyEncrypted; // checksum key dung tao/kiem tra signature, da ma hoa AES

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}