package com.dabana.backend.modules.payment.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Request tao tai khoan ngan hang cho 1 branch (moi branch dung dung 1 tai
 * khoan - BranchBankAccountRepository#existsByBranch_Id de check truoc,
 * neu da co -> BRANCH_BANK_ACCOUNT_ALREADY_EXISTS).
 *
 * payosClientId/payosApiKey/payosChecksumKey nhan PLAINTEXT tu request (qua
 * kenh HTTPS + endpoint chi danh cho admin/quan ly branch), service se dung
 * AesEncryptionUtil ma hoa truoc khi luu vao payos_api_key_encrypted /
 * payos_checksum_key_encrypted. KHONG log lai cac truong nay.
 *
 * De trong 3 truong payOS neu branch chua co kenh thanh toan rieng (co the
 * bo sung sau qua UpdateBranchBankAccountRequest) - tai khoan van dung duoc
 * cho muc dich CHI (doi soat noi bo) du chua co the THU qua payOS.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateBranchBankAccountRequest {

    @NotNull
    private Long branchId;

    @NotNull
    private Integer bankId;

    @NotBlank
    @Size(max = 50)
    private String accountNumber;

    @NotBlank
    @Size(max = 150)
    private String accountName;

    @Size(max = 255)
    private String payosClientId;

    /** Plaintext - service ma hoa truoc khi luu, khong bao gio tra nguyen ve response. */
    private String payosApiKey;

    /** Plaintext - service ma hoa truoc khi luu, khong bao gio tra nguyen ve response. */
    private String payosChecksumKey;
}
