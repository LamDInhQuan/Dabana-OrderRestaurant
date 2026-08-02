package com.dabana.backend.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Khoi tao / dong bo an toan cac bang va cot moi vao co so du lieu MySQL
 * khi he thong khoi dong (do application.yml dang de ddl-auto: none).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseSchemaInitializer implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        initSysSettingsTable();
        initConfirmedAtColumn();
        initSubInvoicesOrderCodeColumn();
    }

    private void initSysSettingsTable() {
        try {
            String createTableSql = """
                CREATE TABLE IF NOT EXISTS sys_settings (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    setting_key VARCHAR(100) NOT NULL UNIQUE,
                    setting_value VARCHAR(500) NULL,
                    description VARCHAR(500) NULL,
                    created_at DATETIME NULL,
                    updated_at DATETIME NULL
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """;
            jdbcTemplate.execute(createTableSql);

            // Nạp dữ liệu cấu hình mặc định nếu chưa có
            String insertDefaultsSql = """
                INSERT IGNORE INTO sys_settings (setting_key, setting_value, description, created_at, updated_at)
                VALUES 
                ('CONFIRMED_CANCELLATION_GRACE_PERIOD_MINUTES', '15', 'Thời gian ân hạn huỷ đơn sau khi xác nhận (phút)', NOW(), NOW()),
                ('CONFIRMED_CANCELLATION_GRACE_PERIOD_ENABLED', 'true', 'Trạng thái bật/tắt chính sách ân hạn huỷ đơn', NOW(), NOW()),
                ('CONFIRMED_CANCELLATION_GRACE_PERIOD_DESCRIPTION', 'Khách hàng được hoàn 100% tiền cọc nếu huỷ đơn trong thời gian ân hạn kể từ khi đơn chuyển sang Đã xác nhận (CONFIRMED).', NOW(), NOW());
            """;
            jdbcTemplate.execute(insertDefaultsSql);

            log.info("✓ [DatabaseSchemaInitializer] Bang sys_settings va cau hinh mac dinh da duoc khoi tao thanh cong.");
        } catch (Exception e) {
            log.error("✗ [DatabaseSchemaInitializer] Loi khoi tao bang sys_settings: {}", e.getMessage(), e);
        }
    }

    private void initConfirmedAtColumn() {
        try {
            Integer columnCount = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'rs_reservations' 
                  AND COLUMN_NAME = 'confirmed_at'
                """,
                Integer.class
            );

            if (columnCount == null || columnCount == 0) {
                jdbcTemplate.execute("ALTER TABLE rs_reservations ADD COLUMN confirmed_at DATETIME NULL;");
                log.info("✓ [DatabaseSchemaInitializer] Da them cot confirmed_at vao bang rs_reservations.");
            } else {
                log.info("✓ [DatabaseSchemaInitializer] Cot confirmed_at da ton tai trong bang rs_reservations.");
            }
        } catch (Exception e) {
            log.error("✗ [DatabaseSchemaInitializer] Loi kiem tra/them cot confirmed_at vao rs_reservations: {}", e.getMessage(), e);
        }
    }

    private void initSubInvoicesOrderCodeColumn() {
        try {
            Integer columnCount = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                  AND TABLE_NAME = 'sub_invoices' 
                  AND COLUMN_NAME = 'order_code'
                """,
                Integer.class
            );

            if (columnCount == null || columnCount == 0) {
                jdbcTemplate.execute("ALTER TABLE sub_invoices ADD COLUMN order_code BIGINT NULL;");
                log.info("✓ [DatabaseSchemaInitializer] Da them cot order_code vao bang sub_invoices.");
            } else {
                log.info("✓ [DatabaseSchemaInitializer] Cot order_code da ton tai trong bang sub_invoices.");
            }
        } catch (Exception e) {
            log.error("✗ [DatabaseSchemaInitializer] Loi kiem tra/them cot order_code vao sub_invoices: {}", e.getMessage(), e);
        }
    }
}
