package com.dabana.backend.modules.zone.controller;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.zone.dto.request.CreateZoneRequest;
import com.dabana.backend.modules.zone.dto.request.UpdateZoneRequest;
import com.dabana.backend.modules.zone.dto.response.ZoneResponse;
import com.dabana.backend.modules.zone.service.IZoneService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/zones")
@RequiredArgsConstructor
public class ZoneController {

    private final IZoneService zoneService;

    @GetMapping("/branches/{branchId}")
    public ResponseEntity<ApiResponse<List<ZoneResponse>>> getZonesByBranch(@PathVariable Long branchId) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.SUCCESS, zoneService.getZonesByBranch(branchId)));
    }

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<ZoneResponse>> createZone(@Valid @RequestBody CreateZoneRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.CREATED, zoneService.createZone(request)));
    }

    @PutMapping("/update/{zoneId}")
    public ResponseEntity<ApiResponse<ZoneResponse>> updateZone(@PathVariable Long zoneId,
                                                                @Valid @RequestBody UpdateZoneRequest request) {
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.UPDATED, zoneService.updateZone(zoneId, request)));
    }

    @DeleteMapping("/delete/{zoneId}")
    public ResponseEntity<ApiResponse<Boolean>> deleteZone(@PathVariable Long zoneId) {
        zoneService.deleteZone(zoneId);
        return ResponseEntity.ok(ResponseBuilder.success(SuccessCode.DELETED, true));
    }
}