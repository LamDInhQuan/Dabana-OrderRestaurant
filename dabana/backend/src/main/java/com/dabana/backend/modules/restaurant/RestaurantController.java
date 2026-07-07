//package com.dabana.backend.modules.restaurant;
//
//import org.springframework.web.bind.annotation.RequestMapping;
//import org.springframework.web.bind.annotation.RestController;
//import org.springframework.web.bind.annotation.RestControllerAdvice;
//
//import com.dabana.backend.modules.restaurant.Dto.RestaurantDto;
//
//import lombok.RequiredArgsConstructor;
//
//import java.util.List;
//
//import org.springframework.web.bind.annotation.GetMapping;
//import org.springframework.web.bind.annotation.RequestParam;
//
//
//@RestController
//@RequestMapping("/api/restaurants")
//@RequiredArgsConstructor
//public class RestaurantController {
//    private final RestaurantService restaurantService;
//
//    @GetMapping
//    public List<RestaurantDto> GetRestaurantByOwnerId(long ownerId) {
//
//        //de tam nhu nay de test endpoint
//        return restaurantService.findByOwnerId(ownerId).stream().map(restaurant -> {
//            RestaurantDto dto = new RestaurantDto();
//            dto.setOwner(restaurant.getOwner());
//            dto.setBrandName(restaurant.getBrandName());
//            dto.setLogoUrl(restaurant.getLogoUrl());
//            dto.setDescription(restaurant.getDescription());
//            dto.setCuisineType(restaurant.getCuisineType());
//            return dto;
//        }).toList();
//    }
//
//}
