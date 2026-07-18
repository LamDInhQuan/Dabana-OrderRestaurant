import React from "react";
import { C, S } from "../../../theme";

/**
 * Props:
 *  - policy: ReservationPolicy (or the in-progress editingPolicy)
 *  - title?: string
 */
export default function PolicyPreview({ policy, title = "Khách hàng sẽ thấy" }) {
  const depositLabel =
    policy.depositType === "FIXED_AMOUNT"
      ? Number(policy.depositValue || 0).toLocaleString("vi-VN") + "₫"
      : Number(policy.depositValue || 0).toLocaleString("vi-VN") + "₫ / người";

  return (
    <div>
      <div style={{ ...S.eyebrow, marginBottom: "1rem" }}>{title}</div>

      <div
        style={{
          background: C.cream,
          padding: "1.25rem",
          borderRadius: 4,
          border: `1px solid ${C.goldBorder}`,
        }}
      >
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: "none",
            display: "flex",
            flexDirection: "column",
            gap: ".6rem",
            fontSize: ".88rem",
            color: C.text,
          }}
        >
          {policy.depositRequired ? (
            <>
              <li>✔ Đặt cọc: <b>{depositLabel}</b></li>
              <li>
                ✔ Huỷ miễn phí trước <b>{policy.freeCancellationHours} giờ</b>
              </li>
              <li>
                ✔ Huỷ muộn hoàn lại{" "}
                <b>{100 - Number(policy.lateCancellationPenaltyPercent || 0)}%</b>
              </li>
              <li>
                ✔ Không đến sẽ mất{" "}
                <b>{policy.noShowPenaltyPercent}%</b> tiền cọc
              </li>
            </>
          ) : (
            <li>✔ Không yêu cầu đặt cọc</li>
          )}
        </ul>
      </div>
    </div>
  );
}