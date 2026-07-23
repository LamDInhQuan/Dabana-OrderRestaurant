package com.dabana.backend.modules.auth.service;

import com.dabana.backend.modules.auth.util.OtpPurpose;

public interface IOtpService {
    String generateAndSend(String identifier, OtpPurpose purpose);
    Boolean verify(String identifier, String inputCode, OtpPurpose purpose);
}
