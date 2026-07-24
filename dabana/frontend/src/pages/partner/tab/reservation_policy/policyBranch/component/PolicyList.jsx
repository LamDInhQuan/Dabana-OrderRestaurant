import React from "react";
import { C, S } from "../../../../theme";

export default function PolicyList({
  policies,
  selectedPolicyId,
  onSelect,
  onCreate,
  onDelete,
}) {
  return (
    <div style={{ padding: 0, background: "transparent" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.1rem",
        }}
      >
        <div>
          <div style={{ fontSize: ".85rem", fontWeight: 700, color: "#2E2A25" }}>
            Chính sách áp dụng riêng cho chi nhánh
          </div>
          <div style={{ fontSize: ".78rem", color: "#8A8272", marginTop: ".2rem" }}>
            {policies.length} chính sách đang thiết lập
          </div>
        </div>

        <button
          type="button"
          onClick={onCreate}
          style={{
            ...S.btnGold,
            padding: ".6rem 1.3rem",
            fontSize: ".8rem",
            borderRadius: 8,
            fontWeight: 700,
          }}
        >
          ＋ Tạo chính sách mới
        </button>
      </div>

      {policies.length === 0 && (
        <div
          style={{
            padding: "2.5rem 1rem",
            textAlign: "center",
            color: "#8A8272",
            fontSize: ".85rem",
            background: "#FBF7EE",
            borderRadius: 10,
            border: "1px dashed #E7E1D3",
          }}
        >
          Chưa có chính sách nào. Bấm "Tạo chính sách mới" để bắt đầu cấu hình.
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap: "1rem",
          width: "100%",
        }}
      >
        {policies.map((policy) => {
          const isSelected = selectedPolicyId === policy.id;
          return (
            <div
              key={policy.id}
              onClick={() => onSelect(policy)}
              style={{
                border: isSelected ? "1.5px solid #C9A24B" : "1px solid #ECE4D3",
                borderRadius: 10,
                padding: "1.1rem 1.25rem",
                cursor: "pointer",
                background: isSelected ? "#FBF7EE" : "#fff",
                boxShadow: isSelected
                  ? "0 4px 12px rgba(201,162,75,0.15)"
                  : "0 1px 2px rgba(46,42,37,0.03)",
                transition: "all .15s ease",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "0.5rem",
                    marginBottom: ".4rem",
                  }}
                >
                  <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#2E2A25" }}>
                    {policy.policyCode}
                  </h4>
                  <span
                    style={{
                      fontSize: ".68rem",
                      background: isSelected ? "#C9A24B" : "#F1ECDF",
                      color: isSelected ? "#fff" : "#6B7280",
                      padding: ".18rem .45rem",
                      borderRadius: 4,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {policy.branchCount || 0} CN
                  </span>
                </div>

                <p
                  style={{
                    fontSize: ".8rem",
                    color: "#8A8272",
                    margin: "0 0 0.75rem 0",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    lineHeight: "1.4",
                  }}
                >
                  {policy.policyName || "Không có mô tả cho chính sách này."}
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderTop: "1px dashed #EFE9DB",
                  paddingTop: "0.6rem",
                }}
              >
                <span style={{ fontSize: "0.75rem", color: isSelected ? "#B8903D" : "#9CA3AF", fontWeight: 600 }}>
                  {isSelected ? "● Đang xem" : "Xem chi tiết"}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(policy.id);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#DC2626",
                    fontSize: "0.75rem",
                    cursor: "pointer",
                    padding: "0.2rem 0.4rem",
                    fontWeight: 600,
                    opacity: 0.75,
                  }}
                  onMouseEnter={(e) => (e.target.style.opacity = 1)}
                  onMouseLeave={(e) => (e.target.style.opacity = 0.75)}
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