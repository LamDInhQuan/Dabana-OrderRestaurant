import React, { useState, useEffect } from "react";
import { C, S, GoldDivider } from '../../../../theme'
import PolicySchedule from "../../components/PolicySchedule";


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
    if (!a.daysOfWeek.length) return "Theo thứ (chưa chọn)";
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
 * Props:
 *  - policy: the currently selected ReservationPolicy (assignment target). Can be null.
 *  - branches: { id, name }[]
 *  - assignments: rt_branch_policy rows already saved for this policy
 *  - onSave(assignment)   -> POST branch-policy
 *  - onDelete(assignmentId)
 */
export default function BranchAssignment({
  policy,
  branches,
  assignments,
  onSave,
  onDelete,
}) {
  const [draft, setDraft] = useState(emptyAssignment(policy?.id));

  // reset draft whenever the selected policy changes
  useEffect(() => {
    setDraft(emptyAssignment(policy?.id));
  }, [policy?.id]);

  if (!policy) {
    return (
      <div style={{ ...S.card, textAlign: "center", color: C.muted }}>
        Chọn một chính sách bên trên để áp dụng cho chi nhánh.
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
    onSave({ ...draft, policyId: policy.id, id: Date.now() });
    setDraft(emptyAssignment(policy.id));
  };

  return (
    <div style={S.card}>
      <div style={{ ...S.eyebrow, marginBottom: "1.5rem" }}>
        Áp dụng "{policy.name}" cho chi nhánh
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
        <div>
          <label style={S.label}>Chi nhánh</label>
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
              Đang áp dụng tại
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
                  }}
                >
                  <div>
                    <b>
                      {a.branchIds
                        .map((id) => branches.find((b) => b.id === id)?.name || id)
                        .join(", ")}
                    </b>
                    <div style={{ color: C.muted, marginTop: ".2rem" }}>
                      {scheduleSummary(a)}
                      {a.effectiveFrom && ` · ${a.effectiveFrom} → ${a.effectiveTo || "..."}`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(a.id)}
                    style={{ ...S.btnOutline, color: C.red }}
                  >
                    Gỡ
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