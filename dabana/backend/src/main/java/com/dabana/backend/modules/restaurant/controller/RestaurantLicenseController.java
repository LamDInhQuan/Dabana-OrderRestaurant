package com.dabana.backend.modules.restaurant.controller;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import com.dabana.backend.modules.restaurant.Dto.RestaurantLicensesDto;
import com.dabana.backend.modules.restaurant.Dto.response.RestaurantAndLicenseResponse;
import com.dabana.backend.modules.restaurant.entity.RestaurantLicense;
import com.dabana.backend.modules.restaurant.service.RestaurantLicenseService;

import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor

@RequestMapping("/api/restaurants")
public class RestaurantLicenseController {
    private final RestaurantLicenseService restaurantLicenseService;

    @GetMapping("/{restaurantId}/licenses/{licenseId}/image")
    public ResponseEntity<byte[]> downloadLicense(@PathVariable Long restaurantId, @PathVariable Long licenseId) {
        RestaurantLicense license = restaurantLicenseService.downloadLicense(licenseId);
        try {
            byte[] imageBytes = license.getImage().getBytes(1, (int) license.getImage().length());
            // Sử dụng fileType đã lưu từ DB thay vì hardcode PNG
            String contentType = license.getFileType() != null ? license.getFileType() : MediaType.IMAGE_PNG_VALUE;
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + license.getFileName() + "\"")
                    .contentType(MediaType.parseMediaType(contentType))
                    .body(imageBytes);
        } catch (Exception e) {
            throw new RuntimeException("Error reading image", e);
        }
    }

    @GetMapping("/all/licenses")
    public ResponseEntity<List<RestaurantAndLicenseResponse>> getAllLicenseByRestaurantId() {
        return ResponseEntity.ok(restaurantLicenseService.getAllRestaurantAndLicense());
    }


    @GetMapping("/{restaurantId}/licenses")
    public ResponseEntity<RestaurantAndLicenseResponse> getAllRestaurantLicense(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(restaurantLicenseService.getAllLicenseByRestaurantId(restaurantId));
    }
}
