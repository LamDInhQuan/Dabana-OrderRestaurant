package com.dabana.backend.common;

import com.dabana.backend.modules.auth.entity.User;
import com.dabana.backend.security.CustomUserDetail;
import org.springframework.security.core.context.SecurityContextHolder;

public abstract class BaseController {

    protected User getCurrentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetail principal) {
            return principal.getUser();
        }
        return null;
    }
}