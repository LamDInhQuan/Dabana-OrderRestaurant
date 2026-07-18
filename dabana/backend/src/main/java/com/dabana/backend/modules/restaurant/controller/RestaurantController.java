package com.dabana.backend.modules.restaurant.controller;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.dabana.backend.common.ApiResponse;
import com.dabana.backend.common.ResponseBuilder;
import com.dabana.backend.common.SuccessCode;
import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.modules.auth.repository.UserRepository;
import com.dabana.backend.modules.restaurant.Dto.request.RestaurantRegisterRequest;
import com.dabana.backend.modules.restaurant.Dto.request.RestaurantUpdateRequest;
import com.dabana.backend.modules.restaurant.Dto.response.RestaurantResponse;
import com.dabana.backend.modules.restaurant.entity.Restaurant;
import com.dabana.backend.modules.restaurant.service.RestaurantService;
import com.dabana.backend.security.CustomUserDetail;

import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;


//TODO: phan quyen cho chu nha hang
@RestController
@RequestMapping("/api/restaurants/me/")
@RequiredArgsConstructor
public class RestaurantController {

     private final RestaurantService restaurantService;
     private Authentication authentication;

     @GetMapping("")
     public ResponseEntity<ApiResponse<RestaurantResponse>> GetRestaurantByOwnerId() {
          User owner = getLoggedOwner();
          return ResponseEntity.ok(
                    ResponseBuilder.success( SuccessCode.SUCCESS,restaurantService.findByOwnerId(owner.getId())));

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