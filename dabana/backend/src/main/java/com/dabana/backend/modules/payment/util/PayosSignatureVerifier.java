package com.dabana.backend.modules.payment.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.TreeMap;

/**
 * Tinh signature cho webhook "payment-requests" cua payOS
 * (https://payos.vn/docs/tich-hop-webhook/kiem-tra-du-lieu-voi-signature/):
 *   - Sap xep field cua object "data" theo alphabet (TreeMap tu lam viec nay).
 *   - Noi "key1=value1&key2=value2..." (KHONG encodeURI gia tri).
 *   - HMAC_SHA256(data, checksumKey) -> hex.
 *
 * CHI dung cho webhook payment-requests (thu tien coc). Payout dung cong thuc
 * khac (co encodeURI) - nen dung SDK (client.getCrypto()) cho phan do thay vi
 * viet lai class rieng.
 */
public final class PayosSignatureVerifier {

    private PayosSignatureVerifier() {
    }

    public static boolean verify(Map<String, Object> data, String signature, String checksumKey) {
        if (signature == null) {
            return false;
        }
        return compute(data, checksumKey).equalsIgnoreCase(signature);
    }

    public static String compute(Map<String, Object> data, String checksumKey) {
        TreeMap<String, Object> sorted = new TreeMap<>(data);
        StringBuilder raw = new StringBuilder();
        for (Map.Entry<String, Object> entry : sorted.entrySet()) {
            Object value = entry.getValue();
            if (raw.length() > 0) {
                raw.append('&');
            }
            raw.append(entry.getKey()).append('=').append(value == null ? "" : String.valueOf(value));
        }
        return hmacSha256Hex(raw.toString(), checksumKey);
    }

    private static String hmacSha256Hex(String data, String key) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Khong the tinh HMAC_SHA256 cho webhook payOS", e);
        }
    }
}