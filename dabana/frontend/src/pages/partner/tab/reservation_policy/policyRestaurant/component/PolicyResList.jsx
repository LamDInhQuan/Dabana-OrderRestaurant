import React from "react";
import { S } from "../../../../theme";

function PolicyResList({ policies, selectedId, onSelect, onAddNew }) {
  console.log("policies",policies);
  
  // Read đúng field policyScheduleType từ backend
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
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Nút Tạo chính sách khung */}
      <button
        onClick={onAddNew}
        style={{
          ...S.btnGold,
          width: "100%",
          padding: ".8rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: ".5rem",
          fontSize: ".9rem",
          borderRadius: 8,
          fontWeight: 700,
        }}
      >
        <span>＋</span> Tạo chính sách khung
      </button>

      {/* Header Danh sách */}
      <div style={{ padding: "0 .2rem" }}>
        <span
          style={{
            fontSize: ".72rem",
            fontWeight: 700,
            letterSpacing: ".04em",
            textTransform: "uppercase",
            color: "#8A8272",
          }}
        >
          Chính sách khung ({policies?.length || 0})
        </span>
      </div>

      {/* List Container */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: ".6rem",
          maxHeight: "calc(100vh - 260px)",
          overflowY: "auto",
          paddingRight: ".25rem",
        }}
      >
        {!policies || policies.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "2rem 1rem",
              color: "#8A8272",
              fontSize: ".85rem",
              background: "#fff",
              border: "1px dashed #E7E1D3",
              borderRadius: 8,
            }}
          >
            Chưa có chính sách khung nào.
          </div>
        ) : (
          policies.map((p) => {
            const isSelected = selectedId === p.id;
            // Map đúng trường policyScheduleType từ JSON Backend
            const scheduleType = p.policyScheduleType || p.scheduleType;
            const typeBadge = renderScheduleTypeBadge(scheduleType);

            return (
              <div
                key={p.id}
                onClick={() => onSelect(p)}
                style={{
                  position: "relative",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: ".7rem",
                  padding: ".85rem 1rem",
                  cursor: "pointer",
                  borderRadius: 8,
                  border: isSelected ? "1px solid #C9A24B" : "1px solid #ECE4D3",
                  background: isSelected ? "#FBF7EE" : "#fff",
                  boxShadow: isSelected
                    ? "0 2px 8px rgba(201,162,75,0.15)"
                    : "0 1px 2px rgba(46,42,37,0.03)",
                  transition: "all .15s ease",
                }}
              >
                {/* Highlight viền trái */}
                {isSelected && (
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 8,
                      bottom: 8,
                      width: 3,
                      borderRadius: 2,
                      background: "#C9A24B",
                    }}
                  />
                )}

                {/* Avatar ký tự đầu */}
                <span
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    background: isSelected ? "#C9A24B" : "#F1ECDF",
                    color: isSelected ? "#fff" : "#8A8272",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: ".95rem",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {(p.policyCode || p.name || "?").charAt(0).toUpperCase()}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: ".5rem",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        color: "#2E2A25",
                        fontSize: ".92rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={p.name}
                    >
                      {p.name}{" "}
                      <span style={{ color: "#8A8272", fontWeight: 500, fontSize: ".8rem" }}>
                        ({p.policyCode})
                      </span>
                    </div>

                    {/* Badge Mặc định */}
                    {p.isDefault && (
                      <span
                        style={{
                          fontSize: ".65rem",
                          background: "#FEF3C7",
                          color: "#B45309",
                          padding: ".15rem .45rem",
                          borderRadius: 4,
                          fontWeight: 600,
                          flexShrink: 0,
                        }}
                      >
                        Mặc định
                      </span>
                    )}
                  </div>

                  {/* Badge ScheduleType */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: ".4rem",
                      marginTop: ".4rem",
                    }}
                  >
                    <span
                      style={{
                        fontSize: ".65rem",
                        background: typeBadge.bg,
                        color: typeBadge.color,
                        padding: ".1rem .4rem",
                        borderRadius: 4,
                        fontWeight: 600,
                      }}
                    >
                      {typeBadge.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default PolicyResList;