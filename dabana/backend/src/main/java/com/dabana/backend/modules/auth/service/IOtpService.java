package com.dabana.backend.modules.auth.service;

public interface IOtpService {
    String generateAndSend(String identifier) ;
    Boolean verify(String identifier, String inputCode);
}
