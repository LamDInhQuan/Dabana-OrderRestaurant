package com.dabana.backend.modules.auth.util;

import lombok.Getter;

@Getter
public enum OtpPurpose {
    REGISTER("REGISTER"),
    FORGOT_PASSWORD("FORGOT_PASSWORD"),
    GUEST_BOOKING("GUEST_BOOKING"),
    GUEST_LOOKUP("GUEST_LOOKUP");

    private final String value;

    OtpPurpose(String value) {
        this.value = value;
    }
}