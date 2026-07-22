package com.dabana.backend.modules.payment.util;

import com.dabana.backend.exception.BusinessException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Util ma hoa/giai ma don gian bang AES-256-GCM, dung de luu
 * payos_api_key_encrypted / payos_checksum_key_encrypted (pm_branch_bank_accounts)
 * o dang mahoa trong DB thay vi plaintext.
 *
 * Khoa AES duoc suy ra (SHA-256) tu 1 secret cau hinh o application.yml/env,
 * KHONG duoc hardcode va KHONG duoc commit vao source:
 *
 *   app:
 *     payment:
 *       encryption-secret: ${PAYMENT_ENCRYPTION_SECRET}
 *
 * Dinh dang chuoi da ma hoa (Base64 cua): [12 byte IV] + [ciphertext + 16 byte GCM tag]
 * -> luu truc tiep chuoi Base64 nay vao cot *_encrypted (varchar 255 la du cho AES-GCM
 * cua 1 api-key/checksum-key thong thuong ~vai chuc ky tu).
 */
@Component
public class AesEncryptionUtil {

    private static final String AES_ALGORITHM = "AES";
    private static final String CIPHER_TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_IV_LENGTH_BYTES = 12;
    private static final int GCM_TAG_LENGTH_BITS = 128;

    private final SecretKeySpec secretKey;
    private final SecureRandom secureRandom = new SecureRandom();

    public AesEncryptionUtil(@Value("${app.payment.encryption-secret}") String encryptionSecret) {
        this.secretKey = deriveKey(encryptionSecret);
    }

    /** SHA-256 cua secret cau hinh -> luon ra dung 32 byte (AES-256), bat ke do dai secret goc. */
    private SecretKeySpec deriveKey(String secret) {
        try {
            if (secret == null || secret.isBlank()) {
                throw new IllegalStateException(
                        "Thieu cau hinh app.payment.encryption-secret - khong the khoi tao AesEncryptionUtil");
            }
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = sha256.digest(secret.getBytes(StandardCharsets.UTF_8));
            return new SecretKeySpec(keyBytes, AES_ALGORITHM);
        } catch (Exception e) {
            throw new IllegalStateException("Khong the khoi tao khoa ma hoa AES", e);
        }
    }

    /**
     * Ma hoa 1 chuoi plaintext (vd: payOS api-key/checksum-key).
     * Tra ve null neu dau vao null (de service goi thoai mai ma khong can check null truoc).
     */
    public String encrypt(String plaintext) {
        if (plaintext == null) {
            return null;
        }
        try {
            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
            byte[] cipherText = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

            byte[] ivAndCipherText = new byte[iv.length + cipherText.length];
            System.arraycopy(iv, 0, ivAndCipherText, 0, iv.length);
            System.arraycopy(cipherText, 0, ivAndCipherText, iv.length, cipherText.length);

            return Base64.getEncoder().encodeToString(ivAndCipherText);
        } catch (Exception e) {
            throw new BusinessException(PaymentErrorCode.ENCRYPTION_ERROR);
        }
    }

    /**
     * Giai ma chuoi da duoc tao boi {@link #encrypt(String)}.
     * Tra ve null neu dau vao null.
     */
    public String decrypt(String encryptedBase64) {
        if (encryptedBase64 == null) {
            return null;
        }
        try {
            byte[] ivAndCipherText = Base64.getDecoder().decode(encryptedBase64);
            byte[] iv = new byte[GCM_IV_LENGTH_BYTES];
            byte[] cipherText = new byte[ivAndCipherText.length - GCM_IV_LENGTH_BYTES];
            System.arraycopy(ivAndCipherText, 0, iv, 0, iv.length);
            System.arraycopy(ivAndCipherText, GCM_IV_LENGTH_BYTES, cipherText, 0, cipherText.length);

            Cipher cipher = Cipher.getInstance(CIPHER_TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
            byte[] plainText = cipher.doFinal(cipherText);

            return new String(plainText, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new BusinessException(PaymentErrorCode.ENCRYPTION_ERROR);
        }
    }
}