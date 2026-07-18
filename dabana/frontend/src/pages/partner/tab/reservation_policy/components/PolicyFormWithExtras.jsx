import React from "react";
import PolicyForm from "./PolicyForm";

import PolicyDateSchedules from "./PolicyDateSchedules";
import PolicyDepositRules from "./PolicyDepositRules";

/**
 * PolicyFormWithExtras
 * ---------------------
 * Drop-in replacement for <PolicyForm/> — same props, same behavior — that
 * additionally renders the deposit-rules and schedules sub-resource panels
 * underneath, once the policy has been saved (has an id). Kept separate so
 * PolicyForm.jsx itself doesn't need to change.
 */
// 🟢 ĐÃ SỬA: Đưa ...rest xuống cuối cùng để tránh lỗi sập cú pháp JS, đổi fetchPolicies thành onRefresh cho khớp cha
function PolicyFormWithExtras({ restaurantId, policy, onRefresh, ...rest }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Truyền các props còn lại (onChange, onSubmit, onCancel) vào PolicyForm gốc */}
            <PolicyForm policy={policy} { ...rest } />

            {policy?.id ? (
                <>
                    {/* Panel cấu hình quy tắc đặt cọc */}
                    <PolicyDepositRules
                        restaurantId={restaurantId}
                        policyId={policy.id}
                        rules={policy?.depositRules || []}
                        onRefresh={onRefresh} // 🟢 Đã sửa: Đồng bộ hàm gọi lại detail combo từ cha
                    />

                    {/* Panel cấu hình lịch áp dụng */}
                    <PolicyDateSchedules
                        restaurantId={restaurantId}
                        policyId={policy.id}
                        schedules={policy?.schedules || []}
                        onRefresh={onRefresh} // 🟢 Đã sửa: Đồng bộ hàm gọi lại detail combo từ cha
                    />
                </>
            ) : (
                <div
                    style={{
                        border: "1px dashed #E7E1D3",
                        borderRadius: 6,
                        padding: "1.25rem",
                        fontSize: ".82rem",
                        color: "#8A8272",
                        textAlign: "center",
                    }}
                >
                    Lưu chính sách trước, sau đó bạn có thể thêm quy tắc đặt cọc theo số
                    khách và lịch áp dụng theo ngày.
                </div>
            )}
        </div>
    );
}

export default PolicyFormWithExtras;