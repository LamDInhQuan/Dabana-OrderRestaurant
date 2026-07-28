package com.dabana.backend.modules.subscription.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.subscription.dto.request.PayosConfigRequest;
import com.dabana.backend.modules.subscription.dto.response.PayosConfigResponse;
import com.dabana.backend.modules.subscription.service.IPayosConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Chi ADMIN. Cau hinh tai khoan payOS CAP NEN TANG dung de thu phi subscription
 * (khac han BranchBankAccount cua module payment la cap tung chi nhanh).
 * apiKey/checksumKey KHONG BAO GIO tra ve o response - chi bao da cau hinh hay chua.
 */
@RestController
@RequestMapping("/api/admin/subscriptions/payos-config")
@RequiredArgsConstructor
public class PayosConfigAdminController {

    private final IPayosConfigService payosConfigService;

    @GetMapping
    public ResponseEntity<ApiResponse<PayosConfigResponse>> getConfig() {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, payosConfigService.getConfig()));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<PayosConfigResponse>> saveConfig(
            @Valid @RequestBody PayosConfigRequest request
    ) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.UPDATED,
                payosConfigService.saveConfig(request)));
    }
}
