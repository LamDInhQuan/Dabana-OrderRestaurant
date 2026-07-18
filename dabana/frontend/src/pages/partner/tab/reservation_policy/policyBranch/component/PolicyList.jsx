import React from "react";
import { C, S } from "../../../../theme";

/**
 * Props:
 *  - policies: ReservationPolicy[]
 *  - selectedPolicyId: number | null
 *  - onSelect(policy)
 *  - onCreate()
 *  - onDelete(id)
 */
export default function PolicyList({
  policies,
  selectedPolicyId,
  onSelect,
  onCreate,
  onDelete,
}) {
  return (
    <div style={{ ...S.card, padding: "1rem 1.25rem", background: "transparent", boxShadow: "none", border: "none" }}>
      
      {/* Tiêu đề & Nút Tạo mới chính sách */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <div style={{ ...S.eyebrow, fontSize: ".8rem", color: "#8A8272" }}>
          Chính sách khung đang áp dụng ({policies.length})
        </div>

        <button
          type="button"
          onClick={onCreate}
          style={{ 
            ...S.btnGold, 
            padding: ".5rem 1.25rem", 
            fontSize: ".8rem", 
            borderRadius: 6,
            fontWeight: 600
          }}
        >
          ＋ Tạo chính sách mới
        </button>
      </div>

      {/* Thông báo trống */}
      {policies.length === 0 && (
        <div
          style={{
            padding: "2rem 1rem",
            textAlign: "center",
            color: C.muted,
            fontSize: ".85rem",
            background: "#fff",
            borderRadius: 8,
            border: `1px dashed ${C.border}`
          }}
        >
          Chưa có chính sách nào. Bấm "Tạo chính sách mới" để bắt đầu cấu hình.
        </div>
      )}

      {/* 🟢 DANH SÁCH ĐÃ ĐƯỢC DÀN HÀNG NGANG TOÀN BỘ CHIỀU RỘNG */}
      <div 
        style={{ 
          display: "flex", 
          flexWrap: "wrap", 
          gap: "1rem", 
          width: "100%" 
        }}
      >
        {policies.map((policy) => {
          const isSelected = selectedPolicyId === policy.id;
          return (
            <div
              key={policy.id}
              onClick={() => onSelect(policy)}
              style={{
                /* Mỗi item chiếm tối thiểu 240px, tự động co giãn đều nhau trên 1 hàng */
                flex: "1 1 240px",
                maxWidth: "calc(33.33% - 0.7rem)",
                border: isSelected ? `2px solid ${C.gold}` : `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "1rem 1.25rem",
                cursor: "pointer",
                background: isSelected ? C.cream : "#fff",
                boxShadow: isSelected ? "0 4px 12px rgba(201, 162, 75, 0.1)" : "0 1px 3px rgba(0,0,0,0.02)",
                position: "relative",
                transition: "all .2s ease-in-out",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                {/* Header item: Tên chính sách & Số chi nhánh */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                    marginBottom: ".35rem",
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600, color: C.text }}>
                    {policy.name}
                  </h4>
                  <span
                    style={{
                      fontSize: ".7rem",
                      background: isSelected ? C.gold : "#F3F4F6",
                      color: isSelected ? "#fff" : "#6B7280",
                      padding: ".15rem .4rem",
                      borderRadius: 4,
                      fontWeight: 600,
                      whiteSpace: "nowrap"
                    }}
                  >
                    {policy.branchCount || 0} CN
                  </span>
                </div>

                {/* Mô tả ngắn */}
                <p
                  style={{
                    fontSize: ".8rem",
                    color: C.muted,
                    margin: "0 0 0.5rem 0",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: "1.3"
                  }}
                >
                  {policy.description || "Không có mô tả cho chính sách này."}
                </p>
              </div>

              {/* Khu vực hành động nhỏ gọn: Đổi nút Sửa thành nút Xóa trực tiếp ở góc */}
              <div 
                style={{ 
                  display: "flex", 
                  justifyContent: "flex-end", 
                  alignItems: "center",
                  borderTop: "1px dashed #F3F4F6",
                  paddingTop: "0.5rem",
                  marginTop: "0.25rem"
                }}
              >
                <span style={{ fontSize: "0.75rem", color: isSelected ? C.gold : "#9CA3AF", fontWeight: 500 }}>
                  {isSelected ? "● Đang xem" : "Xem chi tiết"}
                </span>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(policy.id);
                  }}
                  style={{
                    marginLeft: "auto",
                    background: "none",
                    border: "none",
                    color: C.red,
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    padding: "0.2rem 0.5rem",
                    fontWeight: 500,
                    opacity: 0.7,
                    transition: "opacity 0.2s"
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = 1}
                  onMouseLeave={(e) => e.target.style.opacity = 0.7}
                >
                  Xóa khung
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}