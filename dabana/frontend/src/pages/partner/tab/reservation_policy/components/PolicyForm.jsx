import React from "react";
import { Lock, Sparkles } from "lucide-react";
import { C, S, GoldDivider } from "../../../theme";

const DEFAULT_POLICY = {
  policyCode: "",
  name: "",
  autoAssignToBranch: false,
  termsAndConditions: ""
};

export default function PolicyForm({
  policy = DEFAULT_POLICY,
  isBranchMode = false, // Flag nhận diện nếu xem ở Chi nhánh
  isReadOnly = false,   // Bổ sung prop isReadOnly
  onChange,
  onSubmit,
  onCancel,
}) {
  // Chuẩn hóa p để tránh null
  const p = policy || DEFAULT_POLICY;
  
  // Khóa chỉnh sửa nếu là Branch Mode HOẶC là Read Only
  const isDisabled = isBranchMode || isReadOnly;

  const set = (patch) => !isDisabled && onChange && onChange({ ...p, ...patch });

  return (
    <div style={S.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div style={S.eyebrow}>
          {isDisabled
            ? "Chi tiết thông tin chính sách"
            : p.id
            ? "Chỉnh sửa chính sách"
            : "Tạo chính sách mới"}
        </div>
        {isDisabled && (
          <span style={{ fontSize: "0.75rem", background: "#FEF3C7", color: "#92400E", padding: "0.25rem 0.6rem", borderRadius: 4, fontWeight: 600 }}>
            <Lock size={14} style={{ verticalAlign: '-2px' }} /> Chế độ xem (Không thể sửa)
          </span>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!isDisabled && onSubmit) onSubmit(e);
        }}
        style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}
      >
        {/* Mã chính sách */}
        <div>
          <label style={S.label}>Mã chính sách</label>
          <input
            style={{ ...S.input, ...(isDisabled ? { background: "#F3F4F6", cursor: "not-allowed" } : {}) }}
            value={p.policyCode ?? ""}
            onChange={(e) => set({ policyCode: e.target.value })}
            disabled={isDisabled}
            required
          />
        </div>

        {/* Tên chính sách */}
        <div>
          <label style={S.label}>Tên chính sách</label>
          <textarea
            rows={2}
            style={{ ...S.input, ...(isDisabled ? { background: "#F3F4F6", cursor: "not-allowed" } : {}) }}
            value={p.name ?? p.policyName ?? ""} 
            onChange={(e) => set({ name: e.target.value })}
            disabled={isDisabled}
            required
          />
        </div>

        {/* Tự gán cho chi nhánh khi tạo */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem",
            border: `1px solid ${C.border || "#ECE4D3"}`,
            borderRadius: 6,
            background: isDisabled ? "#F9FAFB" : C.cream || "#FFFDF7",
          }}
        >
          <div>
            <div style={{ fontWeight: 600, color: C.text || "#1F2937" }}>
              Tự gán cho chi nhánh khi tạo
            </div>
            <div style={{ fontSize: ".8rem", color: C.muted || "#6B7280", marginTop: ".25rem" }}>
              Bật nếu muốn tự động áp dụng chính sách này cho các chi nhánh mới khởi tạo.
            </div>
          </div>

          <button
            type="button"
            disabled={isDisabled}
            onClick={() => set({ autoAssignToBranch: !p.autoAssignToBranch })}
            style={{
              width: 54,
              height: 28,
              border: "none",
              borderRadius: 99,
              cursor: isDisabled ? "not-allowed" : "pointer",
              position: "relative",
              background: p.autoAssignToBranch ? (C.green || "#10B981") : "rgba(0,0,0,.15)",
              opacity: isDisabled ? 0.7 : 1,
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: "#fff",
                position: "absolute",
                top: 3,
                left: p.autoAssignToBranch ? 28 : 3,
                transition: ".2s",
              }}
            />
          </button>
        </div>

        {/* Điều khoản */}
        <div>
          <label style={S.label}>Điều khoản</label>
          <textarea
            rows={3}
            style={{ ...S.input, ...(isDisabled ? { background: "#F3F4F6", cursor: "not-allowed" } : {}) }}
            value={p.termsAndConditions ?? p.terms ?? ""} 
            onChange={(e) => set({ termsAndConditions: e.target.value })}
            disabled={isDisabled}
            placeholder="Điều khoản chi tiết hiển thị cho khách khi đặt bàn..."
          />
        </div>

        <GoldDivider />

        {/* Nút thao tác dưới cùng */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: ".75rem", marginTop: "1rem" }}>
          <button type="button" style={S.btnOutline} onClick={onCancel}>
            {isDisabled ? "Đóng" : "Huỷ"}
          </button>
          
          {!isDisabled && (
            <button type="submit" style={{ ...S.btnGold, padding: ".75rem 2rem" }}>
              <Sparkles size={16} style={{ verticalAlign: '-2px' }} /> Lưu chính sách
            </button>
          )}
        </div>
      </form>
    </div>
  );
}