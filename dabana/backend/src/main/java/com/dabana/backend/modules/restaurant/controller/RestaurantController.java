package com.dabana.backend.modules.restaurant.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.booking.dto.BookingDtos.BookingResponse;
import com.dabana.backend.modules.diningtable.dto.response.DiningTableResponse;
import com.dabana.backend.modules.restaurant.Dto.report.BranchReportDto;
import com.dabana.backend.modules.restaurant.Dto.report.PerDayReport;
import com.dabana.backend.modules.restaurant.Dto.request.RestaurantRegisterRequest;
import com.dabana.backend.modules.restaurant.Dto.request.RestaurantUpdateRequest;
import com.dabana.backend.modules.restaurant.Dto.response.RestaurantResponse;
import com.dabana.backend.modules.restaurant.service.RestaurantService;
import com.dabana.backend.security.CustomUserDetail;

import lombok.RequiredArgsConstructor;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.format.annotation.DateTimeFormat;


//TODO: phan quyen cho chu nha hang
@RestController
@RestControllerAdvice
@RequestMapping("/api/restaurants/me")
@RequiredArgsConstructor
public class RestaurantController {

     private final RestaurantService restaurantService;
     private Authentication authentication;

     @GetMapping("")
     public ResponseEntity<ApiResponse<RestaurantResponse>> GetRestaurantByOwnerId() {
          User owner = getLoggedOwner();
          return ResponseEntity.ok(
                    ResponseBuilder.success(SuccessCode.SUCCESS, restaurantService.findByOwnerId(owner.getId())));

     }

     @GetMapping("/dashboard")
     public ResponseEntity<ApiResponse<List<BranchReportDto>>> dashboard() {
          User owner = getLoggedOwner();
          return ResponseEntity.ok(
                    ResponseBuilder.success(SuccessCode.SUCCESS, restaurantService.dashboard(owner.getId())));

     }
     //TODO: đổi tên endpoint
     @GetMapping("/perDayReportForBranch/{branchId}")
     public ResponseEntity<ApiResponse<List<PerDayReport>>> perDayReportForBranch(@PathVariable Long branchId) {
          User owner = getLoggedOwner();
          return ResponseEntity.ok(
                    ResponseBuilder.success(SuccessCode.SUCCESS,
                              restaurantService.getPerDayReports(branchId, owner.getId())));

     }

     @GetMapping("/tables/{branchId}")
     public ResponseEntity<ApiResponse<List<DiningTableResponse>>> getUpcomingBookingByBranch(
               @PathVariable Long branchId) {

          return ResponseEntity.ok(
                    ResponseBuilder.success(SuccessCode.SUCCESS, restaurantService.getAllTableByBranch(branchId)));

     }
     @GetMapping("/export")
     public ResponseEntity<InputStreamResource> exportExcel(
               @RequestParam(required = false) List<Long> branchIds,
               @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
               @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) throws IOException {
          User owner = getLoggedOwner();
          ByteArrayInputStream stream = restaurantService.exportToExcel(owner.getId(), branchIds, from, to);
          String fileName = "BookingsReport_" + LocalDate.now() + ".xlsx";
          HttpHeaders headers = new HttpHeaders();

          headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + fileName);
          return ResponseEntity.ok().headers(headers)
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new InputStreamResource(stream));

     }

     @GetMapping("/bookings/{branchId}")
     public ResponseEntity<ApiResponse<List<BookingResponse>>> getAlltableByBranch(@PathVariable Long branchId) {

          return ResponseEntity.ok(
                    ResponseBuilder.success( SuccessCode.SUCCESS,restaurantService.getBranchBookings( branchId )));

     }
     @PostMapping
     public ResponseEntity<ApiResponse<RestaurantResponse>> RegisterRestaurant(@RequestBody RestaurantRegisterRequest request) {
          User owner = getLoggedOwner();
          return ResponseEntity.ok(
                    ResponseBuilder.
                    success(SuccessCode.CREATED, restaurantService.Register(request, owner.getId())));

   }
     @PutMapping
     public ResponseEntity<ApiResponse<RestaurantResponse>> UpdateRestaurant(@RequestBody RestaurantUpdateRequest request) {
          User owner = getLoggedOwner();  
          return ResponseEntity.ok(
                    ResponseBuilder.
                    success(SuccessCode.UPDATED, restaurantService.updateRestaurantById( owner.getId(),request)));

     }
   
     private User getLoggedOwner() {

        // dang le ra dinh dung authentication.getName(); de lay gmail
        // nhung authentication.getName(); tra ve Fullname
        // va CustomUserDetail chi co user nen phai lam nhu the nay
        
     authentication = SecurityContextHolder.getContext().getAuthentication();
     CustomUserDetail user = (CustomUserDetail) authentication.getPrincipal();
     return user.getUser();
     
   }
   

}