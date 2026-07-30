// src/reservation_policy/policyRestaurant/component/PolicyResList.jsx
import React from "react";
import { Settings } from "lucide-react";
import { S } from "../../../../theme";

function PolicyResList({ policies, onSelect, onAddNew }) {
  const renderScheduleTypeBadge = (type) => {
    switch (type) {
      case "ALWAYS":
        return { label: "Hàng ngày", bg: "#FEF3C7", color: "#B45309" };
      case "DAY_OF_WEEK":
        return { label: "Theo thứ", bg: "#F0FDF4", color: "#15803D" };
      case "DATE_RANGE":
        return { label: "Theo khoảng ngày", bg: "#EFF6FF", color: "#1D4ED8" };
      default:
        return { label: type || "Cố định", bg: "#F3F4F6", color: "#4B5563" };
    }
  };

  return (
    <div style={{ background: "#fff", padding: "1.5rem", borderRadius: 12, border: "1px solid #ECE4D3" }}>
      {/* Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#2E2A25" }}>
            Danh sách chính sách khung ({policies?.length || 0})
          </h3>
          <span style={{ fontSize: ".85rem", color: "#8A8272" }}>
            Quản lý các khung chính sách cọc và lịch áp dụng cho toàn bộ nhà hàng
          </span>
        </div>
        <button
          onClick={onAddNew}
          style={{
            ...S.btnGold,
            padding: ".6rem 1.2rem",
            display: "flex",
            alignItems: "center",
            gap: ".5rem",
            fontSize: ".9rem",
            borderRadius: 8,
            fontWeight: 700,
            cursor: "pointer"
          }}
        >
          <span>＋</span> Tạo chính sách khung
        </button>
      </div>

      {/* Grid danh sách card */}
      {!policies || policies.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#8A8272", border: "1px dashed #E7E1D3", borderRadius: 8 }}>
          Chưa có chính sách khung nào. Bấm nút bên trên để bắt đầu thêm.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
          {policies.map((p) => {
            const scheduleType = p.policyScheduleType || p.scheduleType;
            const typeBadge = renderScheduleTypeBadge(scheduleType);

            return (
              <div
                key={p.id}
                style={{
                  border: "1px solid #ECE4D3",
                  borderRadius: 10,
                  padding: "1rem",
                  background: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  justify: "space-between",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                  transition: "all .2s ease"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: ".6rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
                      <span
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 8,
                          background: "#F1ECDF",
                          color: "#C9A24B",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700
                        }}
                      >
                        {(p.policyCode || p.name || "?").charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, color: "#2E2A25", fontSize: "1rem" }}>{p.name}</div>
                        <span style={{ fontSize: ".8rem", color: "#8A8272" }}>Mã: {p.policyCode}</span>
                      </div>
                    </div>
                    {p.isDefault && (
                      <span style={{ fontSize: ".65rem", background: "#FEF3C7", color: "#B45309", padding: ".2rem .5rem", borderRadius: 4, fontWeight: 600 }}>
                        Mặc định
                      </span>
                    )}
                  </div>

                  <div style={{ marginTop: ".8rem", display: "flex", gap: ".5rem" }}>
                    <span style={{ fontSize: ".75rem", background: typeBadge.bg, color: typeBadge.color, padding: ".2rem .5rem", borderRadius: 4, fontWeight: 600 }}>
                      {typeBadge.label}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: "1.2rem", paddingTop: ".8rem", borderTop: "1px solid #F5F1E8", display: "flex", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => onSelect(p)}
                    style={{
                      background: "#FBF7EE",
                      border: "1px solid #C9A24B",
                      color: "#C9A24B",
                      padding: ".4rem border .8rem",
                      borderRadius: 6,
                      fontWeight: 600,
                      fontSize: ".85rem",
                      cursor: "pointer"
                    }}
                  >
                    <Settings size={14} style={{ verticalAlign: '-2px' }} /> Cấu hình chi tiết
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PolicyResList;