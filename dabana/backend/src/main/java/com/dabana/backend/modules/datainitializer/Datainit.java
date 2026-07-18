// package com.dabana.backend.modules.datainitializer;

// import java.util.HashSet;
// import java.util.Set;

// import org.springframework.boot.context.event.ApplicationReadyEvent;

// import org.springframework.context.ApplicationListener;
// import org.springframework.lang.NonNull;
// import org.springframework.security.crypto.password.PasswordEncoder;
// import org.springframework.stereotype.Component;

// import com.dabana.backend.modules.auth.entity.Role;
// import com.dabana.backend.modules.auth.entity.User;
// import com.dabana.backend.modules.auth.entity.UserRole;
// import com.dabana.backend.modules.auth.repository.RoleRepository;
// import com.dabana.backend.modules.auth.repository.UserRepository;
// import com.dabana.backend.modules.auth.util.AccountStatus;

// import jakarta.transaction.Transactional;
// import lombok.RequiredArgsConstructor;

// //bo comment de them data mau vao db

// @Transactional
// @Component
// @RequiredArgsConstructor
// public class Datainit implements ApplicationListener<ApplicationReadyEvent>  {
//     private final UserRepository userRepository;
//     private final RoleRepository roleRepository;
//     private final PasswordEncoder passwordEncoder;
//     @Override
//     public void onApplicationEvent(@NonNull ApplicationReadyEvent event) {

//         InitalizeUser_Customer();
//         InitalizeUser_Admin();
//         InitalizeUser_Restaurant();
//     }
    
   

//     private void InitalizeUser_Customer() {
//         Role role = roleRepository.findByName("CUSTOMER").get();
//         for (int i = 0; i < 10; i++) {
//             HashSet<UserRole> roles = new HashSet<>();
//             User user = new User();

//             roles.add(UserRole.builder().role(role).user(user).build());

//             user.setFullName("customer " + i);
//             user.setEmail("customer" + i + "@example.com");
//             user.setPassword(passwordEncoder.encode("pass"));
//             user.setUserRoles(roles);
//             user.setStatus(AccountStatus.ACTIVE.getStatus());
//             userRepository.save(user);
//         }
//     }

//     private void InitalizeUser_Admin() {
//        Role role = roleRepository.findByName("ADMIN").get();
        
//        for (int i = 0; i < 2; i++) {
//             HashSet<UserRole> roles = new HashSet<>();
            
//             User user = new User();
            
//             roles.add(UserRole.builder().role(role).user(user).build());

//             user.setFullName("admin " + i);
//             user.setEmail("admin" + i + "@example.com");
//             user.setPassword(passwordEncoder.encode("pass"));
//             user.setUserRoles(roles);
//             user.setStatus(AccountStatus.ACTIVE.getStatus());
//             userRepository.save(user);
//         }
//     }

//     private void InitalizeUser_Restaurant() {
//         Role role = roleRepository.findByName("RESTAURANT_PARTNER").get();
        
//         for (int i = 0; i < 3; i++) {
//             HashSet<UserRole> roles = new HashSet<>();

//             User user = new User();

//             roles.add(UserRole.builder().role(role).user(user).build());

//             user.setFullName("partner " + i);
//             user.setEmail("partner" + i + "@example.com");
//             user.setPassword(passwordEncoder.encode("pass"));
//             user.setUserRoles(roles);
//             user.setStatus(AccountStatus.ACTIVE.getStatus());
//             userRepository.save(user);
//         }
//     }

// }
