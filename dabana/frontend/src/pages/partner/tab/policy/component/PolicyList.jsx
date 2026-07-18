import React from "react";
import { C, S } from "../../../theme";

function formatDeposit(policy) {
  if (!policy.depositRequired) return "Không yêu cầu";
  if (policy.depositType === "FIXED_AMOUNT") {
    return Number(policy.depositValue || 0).toLocaleString("vi-VN") + " ₫";
  }
  return Number(policy.depositValue || 0).toLocaleString("vi-VN") + " ₫ / người";
}

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
    <div style={{ ...S.card, padding: "1.25rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <div style={S.eyebrow}>Chính sách nhà hàng</div>

        <button
          type="button"
          onClick={onCreate}
          style={{ ...S.btnGold, padding: ".45rem .9rem", fontSize: ".75rem" }}
        >
          ＋ Tạo
        </button>
      </div>

      {policies.length === 0 && (
        <div
          style={{
            padding: "2rem 1rem",
            textAlign: "center",
            color: C.muted,
            fontSize: ".85rem",
          }}
        >
          Chưa có chính sách nào. Bấm "Tạo" để thêm chính sách đầu tiên.
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {policies.map((policy) => (
          <div
            key={policy.id}
            onClick={() => onSelect(policy)}
            style={{
              border:
                selectedPolicyId === policy.id
                  ? `2px solid ${C.gold}`
                  : `1px solid ${C.border}`,
              borderRadius: 4,
              padding: "1rem",
              cursor: "pointer",
              background: selectedPolicyId === policy.id ? C.cream : "#fff",
              transition: ".2s",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: ".5rem",
              }}
            >
              <h4 style={{ margin: 0, fontSize: "1rem", color: C.text }}>
                {policy.name}
              </h4>
              <span
                style={{
                  fontSize: ".72rem",
                  background: C.gold,
                  color: "#fff",
                  padding: ".2rem .45rem",
                  borderRadius: 2,
                  height: "fit-content",
                }}
              >
                {policy.branchCount || 0} CN
              </span>
            </div>

            {policy.description && (
              <p
                style={{
                  fontSize: ".82rem",
                  color: C.muted,
                  margin: "0 0 .8rem",
                }}
              >
                {policy.description}
              </p>
            )}

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: ".25rem",
                fontSize: ".75rem",
                color: C.muted,
              }}
            >
              <div>
                Đặt cọc: <b>{formatDeposit(policy)}</b>
              </div>
              <div>
                Huỷ miễn phí: <b>{policy.freeCancellationHours} giờ</b>
              </div>
              <div>
                No-show: <b>{policy.noShowPenaltyPercent}%</b>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: ".5rem",
                marginTop: "1rem",
              }}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(policy);
                }}
                style={S.btnOutline}
              >
                Sửa
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(policy.id);
                }}
                style={{ ...S.btnOutline, color: C.red }}
              >
                Xóa
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}