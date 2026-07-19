import React, { useState, useEffect, memo } from "react";
import { C, S, GoldDivider } from '../../../../theme'
import PolicySchedule from "../../components/PolicySchedule";

// 🟢 Định nghĩa mảng DAYS để hàm dịch thứ không bị crash
const DAYS = [
  { key: "MONDAY", label: "T2" },
  { key: "TUESDAY", label: "T3" },
  { key: "WEDNESDAY", label: "T4" },
  { key: "THURSDAY", label: "T5" },
  { key: "FRIDAY", label: "T6" },
  { key: "SATURDAY", label: "T7" },
  { key: "SUNDAY", label: "CN" },
];

const emptyAssignment = (policyId) => ({
  id: null,
  policyId,
  branchIds: [],
  effectiveFrom: "",
  effectiveTo: "",
  applyType: "ALWAYS",
  daysOfWeek: [],
  dateFrom: "",
  dateTo: "",
});

function scheduleSummary(a) {
  if (a.applyType === "ALWAYS") return "Luôn luôn";
  if (a.applyType === "DAY_OF_WEEK") {
    if (!a.daysOfWeek || !a.daysOfWeek.length) return "Theo thứ (chưa chọn)";
    return a.daysOfWeek
      .map((k) => DAYS.find((d) => d.key === k)?.label || k)
      .join(", ");
  }
  if (a.applyType === "DATE_RANGE") {
    return `${a.dateFrom || "?"} → ${a.dateTo || "?"}`;
  }
  return "";
}

/**
 * Props nhận vào chỉ cần policyId (Không cần cả cục object policy cồng kềnh)
 */
function BranchAssignment({
  policyId,
  branches = [],
  assignments = [],
  onSave,
  onDelete,
}) {
  const [draft, setDraft] = useState(emptyAssignment(policyId));

  // Reset draft form mỗi khi policyId thay đổi
  useEffect(() => {
    setDraft(emptyAssignment(policyId));
  }, [policyId]);

  if (!policyId) {
    return (
      <div style={{ ...S.card, textAlign: "center", color: C.muted, padding: "2rem" }}>
        Chọn một chính sách bên trên để thiết lập lịch áp dụng cho chi nhánh.
      </div>
    );
  }

  const toggleBranch = (id) => {
    setDraft((d) =>
      d.branchIds.includes(id)
        ? { ...d, branchIds: d.branchIds.filter((b) => b !== id) }
        : { ...d, branchIds: [...d.branchIds, id] }
    );
  };

  const handleSave = () => {
    if (!draft.branchIds.length) {
      alert("Chọn ít nhất một chi nhánh");
      return;
    }
    // Gửi dữ liệu ra hàm gán của file cha
    onSave({ ...draft, policyId: policyId, id: Date.now() });
    setDraft(emptyAssignment(policyId));
  };

  return (
    <div style={S.card}>
      {/* 🟢 SỬA LỖI: Đổi {policy.name} thành tiêu đề tĩnh hoặc id do không còn object policy */}
      <div style={{ ...S.eyebrow, marginBottom: "1.5rem" }}>
        Thiết lập lịch áp dụng chính sách cho các chi nhánh
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
        <div>
          <label style={S.label}>Chọn chi nhánh áp dụng</label>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: ".6rem",
              padding: "1rem",
              background: C.cream,
              border: `1px solid ${C.border}`,
              borderRadius: 4,
            }}
          >
            {branches.map((b) => (
              <label
                key={b.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".4rem",
                  fontSize: ".85rem",
                  color: C.text,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={draft.branchIds.includes(b.id)}
                  onChange={() => toggleBranch(b.id)}
                />
                {b.name}
              </label>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={S.label}>Hiệu lực từ ngày</label>
            <input
              type="date"
              style={S.input}
              value={draft.effectiveFrom}
              onChange={(e) => setDraft((d) => ({ ...d, effectiveFrom: e.target.value }))}
            />
          </div>
          <div>
            <label style={S.label}>Đến ngày</label>
            <input
              type="date"
              style={S.input}
              value={draft.effectiveTo}
              onChange={(e) => setDraft((d) => ({ ...d, effectiveTo: e.target.value }))}
            />
          </div>
        </div>

        <GoldDivider />

        <PolicySchedule
          applyType={draft.applyType}
          onApplyTypeChange={(v) => setDraft((d) => ({ ...d, applyType: v }))}
          daysOfWeek={draft.daysOfWeek}
          onDaysOfWeekChange={(v) => setDraft((d) => ({ ...d, daysOfWeek: v }))}
          dateFrom={draft.dateFrom}
          onDateFromChange={(v) => setDraft((d) => ({ ...d, dateFrom: v }))}
          dateTo={draft.dateTo}
          onDateToChange={(v) => setDraft((d) => ({ ...d, dateTo: v }))}
        />

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={handleSave}
            style={{ ...S.btnGold, padding: ".75rem 2rem" }}
          >
            ✦ Lưu áp dụng
          </button>
        </div>
      </div>

      {assignments.length > 0 && (
        <>
          <GoldDivider />
          <div style={{ marginTop: "1rem" }}>
            <div style={{ ...S.eyebrow, marginBottom: "1rem" }}>
              Danh sách chi nhánh đang áp dụng lịch này
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: ".6rem" }}>
              {assignments.map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: ".75rem 1rem",
                    border: `1px solid ${C.border}`,
                    borderRadius: 4,
                    fontSize: ".85rem",
                    background: "#fff"
                  }}
                >
                  <div>
                    <b>
                      {a.branchIds
                        ?.map((id) => branches.find((b) => b.id === id)?.name || id)
                        .join(", ")}
                    </b>
                    <div style={{ color: C.muted, marginTop: ".2rem" }}>
                      {scheduleSummary(a)}
                      {a.effectiveFrom && ` · Từ ${a.effectiveFrom} ${a.effectiveTo ? `đến ${a.effectiveTo}` : "trở đi"}`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(a.id)}
                    style={{ ...S.btnOutline, color: C.red, padding: "0.25rem 0.75rem", fontSize: "0.8rem" }}
                  >
                    Gỡ bỏ
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// 🟢 Bọc React.memo để khi gõ text ở form khác hoặc render list, component này hoàn toàn không bị tính toán lại thừa thãi.
export default memo(BranchAssignment);