package com.dabana.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Diem khoi dong he thong Dabana - nen tang dat ban nha hang truc tuyen.
 * EnableScheduling: phuc vu B09 (nhac lich), B10 (het han loi moi hang cho),
 *                    B08 (tu dong canh bao no-show).
 */
@SpringBootApplication
@EnableScheduling
@EnableAsync
public class DabanaBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(DabanaBackendApplication.class, args);
    }
}
