import React, { useState } from "react";
import toast from "react-hot-toast";
import { reservationPolicyApi, branchPolicyApi } from "../../../../../api";

const EMPTY_RULE = {
  minGuest: 1,
  maxGuest: "",
  depositType: "PER_PERSON",
  depositValue: "",
};

const fmtValue = (r) => {
  if (r.depositType === "PERCENT") return `${r.depositValue}%`;
  const suffix = r.depositType === "PER_PERSON" ? "₫/người" : "₫";
  return `${Number(r.depositValue).toLocaleString("vi-VN")} ${suffix}`;
};

function PolicyDepositRules({ restaurantId, policyId, rules = [], onRefresh }) {
  console.log("rules",rules);
  
  const [form, setForm] = useState(EMPTY_RULE);
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.minGuest || !form.maxGuest || !form.depositValue) {
      toast.error("Nhập đủ số khách min/max và giá trị đặt cọc");
      return;
    }
    if (Number(form.minGuest) > Number(form.maxGuest)) {
      toast.error("Số khách tối thiểu phải nhỏ hơn hoặc bằng tối đa");
      return;
    }
    try {
      setSaving(true);
      await reservationPolicyApi.create(restaurantId, policyId, {
        minGuest: Number(form.minGuest),
        maxGuest: Number(form.maxGuest),
        depositType: form.depositType,
        depositValue: Number(form.depositValue),
      });
      toast.success("Đã thêm quy tắc đặt cọc");
      setForm(EMPTY_RULE);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Lỗi tạo deposit rule:", err);
      toast.error("Không thể thêm quy tắc đặt cọc!");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ruleId) => {
    if (!window.confirm("Xoá quy tắc đặt cọc này?")) return;
    try {
      await reservationPolicyApi.remove(restaurantId, policyId, ruleId);
      toast.success("Đã xoá");
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Lỗi xoá deposit rule:", err);
      toast.error("Không thể xoá quy tắc đặt cọc!");
    }
  };

  return (
    <section style={ui.panel}>
      <header style={ui.panelHeader}>
        <div style={ui.panelHeaderLeft}>
          <span style={ui.panelIcon}>🪙</span>
          <div>
            <div style={ui.panelTitle}>Đặt cọc theo số khách</div>
            <div style={ui.panelSubtitle}>
              Ghi đè mức cọc mặc định theo từng khoảng số khách
            </div>
          </div>
        </div>
        <span style={ui.countPill}>{rules.length} quy tắc</span>
      </header>

      {rules.length === 0 ? (
        <div style={ui.emptyState}>
          <span style={{ fontSize: "1.4rem" }}>🍽️</span>
          <span>
            Chưa có quy tắc riêng. Chính sách sẽ dùng mức đặt cọc mặc định ở phần
            thông tin chung.
          </span>
        </div>
      ) : (
        <div style={ui.rowList}>
          {rules.map((r) => (
            <div key={r.id} style={ui.row}>
              <div style={ui.rowMain}>
                <span style={ui.guestPill}>
                  {r.minGuest}–{r.maxGuest} khách
                </span>
                <span style={ui.arrow}>→</span>
                <span style={ui.valueText}>{fmtValue(r)}</span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(r.id)}
                style={ui.deleteBtn}
                title="Xoá quy tắc"
              >
                Xoá
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} style={ui.form}>
        <div style={ui.formGrid}>
          <div style={{ ...ui.field, flex: "1 1 90px" }}>
            <label style={ui.label}>Từ (khách)</label>
            <input
              type="number"
              min={1}
              value={form.minGuest}
              onChange={(e) => setForm((f) => ({ ...f, minGuest: e.target.value }))}
              style={ui.input}
            />
          </div>
          <div style={{ ...ui.field, flex: "1 1 90px" }}>
            <label style={ui.label}>Đến (khách)</label>
            <input
              type="number"
              min={1}
              value={form.maxGuest}
              onChange={(e) => setForm((f) => ({ ...f, maxGuest: e.target.value }))}
              style={ui.input}
              placeholder="VD: 20"
            />
          </div>
          <div style={{ ...ui.field, flex: "1.6 1 170px" }}>
            <label style={ui.label}>Loại đặt cọc</label>
            <select
              value={form.depositType}
              onChange={(e) => setForm((f) => ({ ...f, depositType: e.target.value }))}
              style={ui.input}
            >
              <option value="PER_PERSON">Theo người (₫/người)</option>
              <option value="FIXED">Số tiền cố định (₫)</option>
              <option value="PERCENT">Phần trăm (%)</option>
            </select>
          </div>
          <div style={{ ...ui.field, flex: "1.2 1 110px" }}>
            <label style={ui.label}>Giá trị</label>
            <input
              type="number"
              min={0}
              value={form.depositValue}
              onChange={(e) => setForm((f) => ({ ...f, depositValue: e.target.value }))}
              style={ui.input}
              placeholder="0"
            />
          </div>
          <button type="submit" disabled={saving} style={ui.addBtn}>
            {saving ? "Đang lưu..." : "+ Thêm"}
          </button>
        </div>
      </form>
    </section>
  );
}

const ui = {
  panel: {
    background: "#fff",
    border: "1px solid #ECE4D3",
    borderRadius: 12,
    padding: "1.5rem",
    boxShadow: "0 1px 2px rgba(46,42,37,0.04)",
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    marginBottom: "1.25rem",
    paddingBottom: "1rem",
    borderBottom: "1px solid #F1ECDF",
  },
  panelHeaderLeft: { display: "flex", alignItems: "center", gap: ".75rem" },
  panelIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: "#FBF7EE",
    border: "1px solid #E7E1D3",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1.05rem",
    flexShrink: 0,
  },
  panelTitle: { fontSize: ".95rem", fontWeight: 700, color: "#2E2A25" },
  panelSubtitle: { fontSize: ".78rem", color: "#8A8272", marginTop: "0.15rem" },
  countPill: {
    fontSize: ".72rem",
    fontWeight: 600,
    color: "#6B6353",
    background: "#FBF7EE",
    border: "1px solid #E7E1D3",
    borderRadius: 99,
    padding: ".3rem .7rem",
    whiteSpace: "nowrap",
  },
  emptyState: {
    display: "flex",
    alignItems: "center",
    gap: ".6rem",
    color: "#8A8272",
    fontSize: ".85rem",
    fontStyle: "italic",
    background: "#FBF7EE",
    border: "1px dashed #E7E1D3",
    borderRadius: 8,
    padding: "1rem 1.1rem",
    marginBottom: "1.25rem",
  },
  rowList: { display: "flex", flexDirection: "column", gap: ".5rem", marginBottom: "1.25rem" },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: ".7rem .9rem",
    border: "1px solid #EFE9DB",
    borderRadius: 8,
    background: "#FEFDFB",
  },
  rowMain: { display: "flex", alignItems: "center", gap: ".6rem", flexWrap: "wrap" },
  guestPill: {
    fontSize: ".78rem",
    fontWeight: 600,
    color: "#2E2A25",
    background: "#F1ECDF",
    borderRadius: 6,
    padding: ".25rem .55rem",
  },
  arrow: { color: "#C9BBA0", fontSize: ".85rem" },
  valueText: { fontSize: ".88rem", fontWeight: 700, color: "#B8903D" },
  deleteBtn: {
    border: "1px solid #FCA5A5",
    background: "#FEF2F2",
    color: "#DC2626",
    borderRadius: 6,
    padding: ".35rem .75rem",
    fontSize: ".75rem",
    fontWeight: 600,
    cursor: "pointer",
    flexShrink: 0,
  },
  form: {
    background: "#FBF7EE",
    border: "1px solid #E7E1D3",
    borderRadius: 10,
    padding: "1.1rem",
  },
  formGrid: { display: "flex", flexWrap: "wrap", gap: ".85rem", alignItems: "flex-end" },
  field: { minWidth: "90px", display: "flex", flexDirection: "column" },
  label: { fontSize: ".72rem", fontWeight: 600, color: "#6B6353", marginBottom: ".3rem" },
  input: {
    width: "100%",
    padding: ".55rem .6rem",
    border: "1px solid #E7E1D3",
    borderRadius: 6,
    fontSize: ".85rem",
    outline: "none",
    background: "#fff",
    color: "#2E2A25",
    boxSizing: "border-box",
    height: "38px",
  },
  addBtn: {
    flex: "0 0 auto",
    padding: "0 1.4rem",
    height: "38px",
    background: "#C9A24B",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    fontWeight: 700,
    fontSize: ".85rem",
    cursor: "pointer",
  },
};

export default PolicyDepositRules;