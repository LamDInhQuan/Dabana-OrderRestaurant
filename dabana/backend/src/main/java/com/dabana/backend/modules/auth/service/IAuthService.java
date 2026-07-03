package com.dabana.backend.modules.auth.service;

import com.dabana.backend.modules.auth.dto.request.RegisterRequest;
import com.dabana.backend.modules.auth.dto.response.UserResponse;

public interface IAuthService {
    UserResponse register(RegisterRequest request);
}
