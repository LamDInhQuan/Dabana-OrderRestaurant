// package com.dabana.backend.modules.datainitializer;

// import java.util.Set;

// import org.springframework.boot.context.event.ApplicationReadyEvent;

// import org.springframework.context.ApplicationListener;
// import org.springframework.lang.NonNull;
// import org.springframework.security.crypto.password.PasswordEncoder;
// import org.springframework.stereotype.Component;

// import com.dabana.backend.modules.auth.entity.Role;
// import com.dabana.backend.modules.auth.entity.User;
// import com.dabana.backend.modules.auth.repository.RoleRepository;
// import com.dabana.backend.modules.auth.repository.UserRepository;


// import jakarta.transaction.Transactional;
// import lombok.RequiredArgsConstructor;

// //bo comment de them data mau vao db

// @Transactional
// @Component
// @RequiredArgsConstructor
// public class Datainit implements ApplicationListener<ApplicationReadyEvent>  {
//     private final UserRepository userRepository;
//     // private final RestaurantRepository restaurantRepository;
//     private final RoleRepository roleRepository;
//     private final PasswordEncoder passwordEncoder;
//     @Override
//     public void onApplicationEvent(@NonNull ApplicationReadyEvent event) {
//         InitalizeRole();
//         InitalizeUser_Customer();
//         InitalizeUser_Admin();
//         InitalizeUser_Restaurant();
//     }
    
//     private void InitalizeRole() {
//         Set<String> roleNames = Set.of("CUSTOMER", "ADMIN", "RESTAURANT_PARTNER");
//         for (String roleName : roleNames) {
//             if (!roleRepository.findByName(roleName).isPresent()) {
//                 Role role = new Role();
//                 role.setName(roleName);
//                 roleRepository.save(role);
//             }
//         }
//     }

//     private void InitalizeUser_Customer() {
//         Role userRole = roleRepository.findByName("CUSTOMER").get();

//         for (int i = 0; i < 10; i++) {
//             User user = new User();
//             user.setFullName("customer " + i);
//             user.setEmail("customer" + i + "@example.com");
//             user.setPassword(passwordEncoder.encode("pass"));
//             user.setRole(userRole);
//             userRepository.save(user);
//         }
//     }

//     private void InitalizeUser_Admin() {
//        Role userRole = roleRepository.findByName("ADMIN").get();
        
//         for (int i = 0; i < 2; i++) {
//             User user = new User();
//             user.setFullName("admin " + i);
//             user.setEmail("admin" + i + "@example.com");
//             user.setPassword(passwordEncoder.encode("pass"));
//             user.setRole(userRole);
//             userRepository.save(user);
//         }
//     }

//     private void InitalizeUser_Restaurant() {
//         Role userRole = roleRepository.findByName("RESTAURANT_PARTNER").get();
        
//         for (int i = 0; i < 3; i++) {
//             User user = new User();
//             user.setFullName("partner " + i);
//             user.setEmail("partner" + i + "@example.com");
//             user.setPassword(passwordEncoder.encode("pass"));
//             user.setRole(userRole);
//             userRepository.save(user);
//         }
//     }

// }
