import React from "react";
import { C, S, GoldDivider } from "../../../theme";

// 💡 1. Khai báo Object mặc định rỗng để tránh crash khi prop không được truyền vào
const DEFAULT_POLICY = {
  policyCode: "",
  name: "",
  depositRequired: false,
  depositType: "FIXED_AMOUNT",
  depositValue: 0,
  freeCancellationHours: 0,
  lateCancellationPenaltyPercent: 0,
  noShowPenaltyPercent: 0,
  termsAndConditions: ""
};

export default function PolicyForm({ policy = DEFAULT_POLICY, onChange, onSubmit, onCancel }) {
  // 💡 2. Guard clause: Đảm bảo p luôn là 1 object an toàn
  const p = policy || DEFAULT_POLICY;
  const set = (patch) => onChange && onChange({ ...p, ...patch });

  return (
    <div style={S.card}>
      <div style={{ ...S.eyebrow, marginBottom: "1.5rem" }}>
        {p.id ? "Chỉnh sửa chính sách" : "Tạo chính sách"}
      </div>

      <form
        onSubmit={onSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}
      >
        <div>
          <label style={S.label}>Mã chính sách</label>
          <input
            style={S.input}
            value={p.policyCode || ""}
            onChange={(e) => set({ policyCode: e.target.value })}
            required
          />
        </div>

        <div>
          <label style={S.label}>Tên chính sách</label>
          <textarea
            rows={2}
            style={S.input}
            value={p.name || ""}
            onChange={(e) => set({ policyName: e.target.value })}
            required
          />
        </div>

        {/* Deposit Required toggle */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem",
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            background: C.cream,
          }}
        >
          <div>
            <div style={{ fontWeight: 600, color: C.text }}>
              Yêu cầu đặt cọc
            </div>
            <div style={{ fontSize: ".8rem", color: C.muted, marginTop: ".25rem" }}>
              Bật nếu khách phải thanh toán tiền cọc trước.
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const nextRequired = !p.depositRequired;
              if (!nextRequired) {
                set({
                  depositRequired: false,
                  depositType: "FIXED_AMOUNT",
                  depositValue: 0,
                  freeCancellationHours: 0,
                  lateCancellationPenaltyPercent: 0,
                  noShowPenaltyPercent: 0
                });
              } else {
                set({
                  depositRequired: true,
                  depositType: "FIXED_AMOUNT",
                  depositValue: "",
                  freeCancellationHours: 24,
                  lateCancellationPenaltyPercent: 50,
                  noShowPenaltyPercent: 100
                });
              }
            }}
            style={{
              width: 54,
              height: 28,
              border: "none",
              borderRadius: 99,
              cursor: "pointer",
              position: "relative",
              background: p.depositRequired ? C.green : "rgba(0,0,0,.15)",
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
                left: p.depositRequired ? 28 : 3,
                transition: ".2s",
              }}
            />
          </button>
        </div>

        {p.depositRequired && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
            }}
          >
            <div>
              <label style={S.label}>Loại đặt cọc</label>
              <select
                style={S.input}
                value={p.depositType || "FIXED_AMOUNT"}
                onChange={(e) => set({ depositType: e.target.value })}
              >
                <option value="FIXED_AMOUNT">Số tiền cố định</option>
                <option value="PER_PERSON">Theo đầu người</option>
              </select>
            </div>

            <div>
              <label style={S.label}>Giá trị</label>
              <input
                style={S.input}
                type="number"
                min={0}
                value={p.depositValue ?? ""}
                onChange={(e) => set({ depositValue: e.target.value === "" ? "" : +e.target.value })}
                required
              />
            </div>

            <div>
              <label style={S.label}>Huỷ miễn phí trước (giờ)</label>
              <input
                style={S.input}
                type="number"
                min={0}
                value={p.freeCancellationHours ?? 0}
                onChange={(e) => set({ freeCancellationHours: e.target.value === "" ? 0 : +e.target.value })}
                required
              />
            </div>

            <div>
              <label style={S.label}>Huỷ muộn - giữ lại (%)</label>
              <input
                style={S.input}
                type="number"
                min={0}
                max={100}
                value={p.lateCancellationPenaltyPercent ?? 0}
                onChange={(e) => set({ lateCancellationPenaltyPercent: e.target.value === "" ? 0 : +e.target.value })}
                required
              />
            </div>

            <div>
              <label style={S.label}>No-show - mất (%)</label>
              <input
                style={S.input}
                type="number"
                min={0}
                max={100}
                value={p.noShowPenaltyPercent ?? 0}
                onChange={(e) => set({ noShowPenaltyPercent: e.target.value === "" ? 0 : +e.target.value })}
                required
              />
            </div>
          </div>
        )}

        <div>
          <label style={S.label}>Điều khoản</label>
          <textarea
            rows={3}
            style={S.input}
            value={p.termsAndConditions || ""}
            onChange={(e) => set({ terms: e.target.value })}
            placeholder="Điều khoản chi tiết hiển thị cho khách khi đặt bàn..."
          />
        </div>

        <GoldDivider />

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: ".75rem",
            marginTop: "1rem",
          }}
        >
          <button type="button" style={S.btnOutline} onClick={onCancel}>
            Huỷ
          </button>
          <button type="submit" style={{ ...S.btnGold, padding: ".75rem 2rem" }}>
            ✦ Lưu chính sách
          </button>
        </div>
      </form>
    </div>
  );
}