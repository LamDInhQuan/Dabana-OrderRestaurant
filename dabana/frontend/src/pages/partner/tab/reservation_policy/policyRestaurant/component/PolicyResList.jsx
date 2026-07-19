import React from "react";
import { C, S } from "../../../../theme";

// 1. Khai báo function như bình thường
function PolicyResList({ 
  policies, 
  selectedId, 
  onSelect, 
  onAddNew 
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Nút Tạo chính sách mới nằm trên đầu danh sách */}
      <button 
        onClick={onAddNew}
        style={{
          ...S.btnGold,
          width: "100%",
          padding: ".75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: ".5rem",
          fontSize: ".9rem"
        }}
      >
        <span>+</span> Tạo chính sách khung
      </button>

      {/* Danh bạ các chính sách gốc của nhà hàng */}
      <div 
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: ".75rem",
          maxHeight: "calc(100vh - 220px)",
          overflowY: "auto",
          paddingRight: ".25rem"
        }}
      >
        {policies.length === 0 ? (
          <div style={{ ...S.textMuted, textAlign: "center", padding: "2rem 0" }}>
            Chưa có chính sách khung nào.
          </div>
        ) : (
          policies.map((p) => {
            const isSelected = selectedId === p.id;
            return (
              <div
                key={p.id}
                onClick={() => onSelect(p)}
                style={{
                  ...S.card,
                  padding: "1rem",
                  cursor: "pointer",
                  border: isSelected ? `2px solid ${C.gold}` : `1px solid ${C.border}`,
                  background: isSelected ? `${C.cream}` : "#fff",
                  transition: "all .2s ease",
                  transform: isSelected ? "translateX(4px)" : "none"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontWeight: 600, color: C.text, fontSize: ".95rem" }}>
                    {p.policyCode}
                  </div>
                  {p.depositRequired && (
                    <span style={{ 
                      fontSize: ".7rem", 
                      background: C.green, 
                      color: "#fff", 
                      padding: ".15rem .4rem", 
                      borderRadius: 4,
                      fontWeight: 500
                    }}>
                      Có cọc
                    </span>
                  )}
                </div>
                
                {p.description && (
                  <div style={{ 
                    fontSize: ".8rem", 
                    color: C.muted, 
                    marginTop: ".4rem",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden"
                  }}>
                    {p.description}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// 2. 🎯 Đẩy các lệnh export tường minh xuống cuối file
export default PolicyResList;
export { PolicyResList };