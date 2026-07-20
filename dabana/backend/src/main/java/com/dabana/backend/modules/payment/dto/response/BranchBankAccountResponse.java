package com.dabana.backend.modules.payment.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Response tai khoan ngan hang cua branch.
 *
 * QUAN TRONG: KHONG bao gio dua payosApiKeyEncrypted / payosChecksumKeyEncrypted
 * (hay ban giai ma cua chung) vao response nay duoi bat ky hinh thuc nao -
 * ke ca da ma hoa, vi day la du lieu nhay cam chi dung o tang service goi
 * payOS (xem entity BranchBankAccount). Thay vao do chi expose 2 co booleans
 * de FE biet kenh thanh toan payOS da duoc cau hinh du hay chua.
 *
 * branchId duoc gia nguyen Long, chua join sang thong tin ten/dia chi branch
 * vi module branch2 khong nam trong pham vi file nay - mapper co the bo sung
 * branchName sau khi xac nhan field thuc te cua entity Branch.
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
public class BranchBankAccountResponse {

    private Long id;
    private Long branchId;
    private BankCatalogResponse bank;
    private String accountNumber;
    private String accountName;
    private String payosClientId;

    /** true neu ca api-key va checksum-key da duoc cau hinh (khong ho gia tri thuc). */
    private Boolean payosConfigured;

    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
