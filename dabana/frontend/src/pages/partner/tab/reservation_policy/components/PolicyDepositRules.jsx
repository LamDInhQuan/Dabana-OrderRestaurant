import React, { useState } from "react";
import toast from "react-hot-toast";
import { reservationPolicyApi } from "../../../../../api";

const EMPTY_RULE = {
  minGuest: 1,
  maxGuest: "",
  depositType: "PER_PERSON",
  depositValue: "",
  limitTables: false,
  minTables: 1,
  maxTables: "",
};

// Map nhãn loại cọc trực quan
const DEPOSIT_TYPE_MAP = {
  NO_DEPOSIT: { label: "Không cọc", bg: "#F3F4F6", color: "#4B5563" },
  FIXED: { label: "Cố định / đơn", bg: "#E0F2FE", color: "#0369A1" },
  PER_PERSON: { label: "Theo đầu người", bg: "#FEF3C7", color: "#B45309" },
  PER_TABLE: { label: "Theo số bàn", bg: "#ECFDF5", color: "#047857" },
  PERCENT: { label: "% Đơn món", bg: "#FCE7F3", color: "#BE185D" },
  PERCENTAGE: { label: "% Đơn món", bg: "#FCE7F3", color: "#BE185D" },
};

const fmtValue = (r) => {
  if (r.depositType === "NO_DEPOSIT") return "0 ₫";
  if (r.depositType === "PERCENT" || r.depositType === "PERCENTAGE") return `${r.depositValue}%`;
  
  const val = Number(r.depositValue || 0).toLocaleString("vi-VN");
  if (r.depositType === "PER_PERSON") return `${val} ₫ / người`;
  if (r.depositType === "PER_TABLE") return `${val} ₫ / bàn`;
  return `${val} ₫`;
};

const hasTableLimit = (r) =>
  r.minTables != null &&
  r.maxTables != null &&
  Number(r.maxTables) > 0 &&
  !(Number(r.minTables) === 1 && Number(r.maxTables) === 1 && r._noLimitFlag);

function PolicyDepositRules({ restaurantId, policyId, rules = [], onRefresh }) {
  const [form, setForm] = useState(EMPTY_RULE);
  const [saving, setSaving] = useState(false);

  const handleDepositTypeChange = (type) => {
    setForm((f) => ({
      ...f,
      depositType: type,
      depositValue: type === "NO_DEPOSIT" ? "0" : f.depositValue,
    }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();

    if (!form.minGuest) {
      toast.error("Vui lòng nhập số khách tối thiểu");
      return;
    }

    if (form.maxGuest && Number(form.minGuest) > Number(form.maxGuest)) {
      toast.error("Số khách tối thiểu không được lớn hơn tối đa");
      return;
    }

    if (form.depositType !== "NO_DEPOSIT" && (!form.depositValue || Number(form.depositValue) < 0)) {
      toast.error("Vui lòng nhập giá trị cọc hợp lệ");
      return;
    }

    if (form.limitTables) {
      if (form.maxTables && Number(form.minTables) > Number(form.maxTables)) {
        toast.error("Số bàn tối thiểu không được lớn hơn tối đa");
        return;
      }
    }

    try {
      setSaving(true);
      await reservationPolicyApi.create(restaurantId, policyId, {
        minGuest: Number(form.minGuest),
        maxGuest: form.maxGuest ? Number(form.maxGuest) : null,
        depositType: form.depositType,
        depositValue: form.depositType === "NO_DEPOSIT" ? 0 : Number(form.depositValue),
        minTables: form.limitTables ? Number(form.minTables) : 1,
        maxTables: form.limitTables && form.maxTables ? Number(form.maxTables) : null,
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
    if (!window.confirm("Bạn có chắc muốn xoá quy tắc đặt cọc này?")) return;
    try {
      await reservationPolicyApi.remove(restaurantId, policyId, ruleId);
      toast.success("Đã xoá quy tắc");
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Lỗi xoá deposit rule:", err);
      toast.error("Không thể xoá quy tắc!");
    }
  };

  return (
    <section style={ui.container}>
      {/* Header */}
      <header style={ui.header}>
        <div>
          <h3 style={ui.title}>Quy tắc cọc theo quy mô & hạn mức</h3>
          <p style={ui.subtitle}>
            Tự động áp dụng tiền cọc dựa theo số lượng khách (hoặc số bàn) của đơn đặt.
          </p>
        </div>
        <span style={ui.badgeCount}>{rules.length} Quy tắc</span>
      </header>

      {/* Danh sách Quy tắc đã tạo */}
      {rules.length === 0 ? (
        <div style={ui.emptyBox}>
          <span>💡</span>
          <span>Chưa có quy tắc riêng. Hệ thống sẽ áp dụng mức đặt cọc mặc định của chính sách.</span>
        </div>
      ) : (
        <div style={ui.tableWrapper}>
          <table style={ui.table}>
            <thead>
              <tr>
                <th style={ui.th}>Khoảng số khách</th>
                <th style={ui.th}>Giới hạn bàn</th>
                <th style={ui.th}>Hình thức cọc</th>
                <th style={ui.th}>Mức cọc áp dụng</th>
                <th style={{ ...ui.th, textAlign: "right" }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => {
                const badge = DEPOSIT_TYPE_MAP[r.depositType] || DEPOSIT_TYPE_MAP.FIXED;
                return (
                  <tr key={r.id} style={ui.tr}>
                    <td style={ui.tdBold}>
                      👥 {r.minGuest} {r.maxGuest ? `– ${r.maxGuest}` : "+"} khách
                    </td>
                    <td style={ui.td}>
                      {hasTableLimit(r) ? (
                        <span style={ui.tableTag}>
                          🪑 {r.minTables} {r.maxTables ? `– ${r.maxTables}` : "+"} bàn
                        </span>
                      ) : (
                        <span style={ui.textMuted}>Không giới hạn</span>
                      )}
                    </td>
                    <td style={ui.td}>
                      <span style={{ ...ui.typeBadge, background: badge.bg, color: badge.color }}>
                        {badge.label}
                      </span>
                    </td>
                    <td style={ui.tdHighlight}>{fmtValue(r)}</td>
                    <td style={{ ...ui.td, textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={() => handleDelete(r.id)}
                        style={ui.btnDelete}
                      >
                        Xoá
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Form thêm quy tắc mới */}
      <form onSubmit={handleAdd} style={ui.formCard}>
        <div style={ui.formHeader}>➕ Thêm quy tắc cọc mới</div>
        
        <div style={ui.formGrid}>
          {/* Nhóm chọn số khách */}
          <div style={ui.fieldGroup}>
            <label style={ui.label}>
              Số lượng khách <span style={{ color: "red" }}>*</span>
            </label>
            <div style={ui.rangeInputs}>
              <input
                type="number"
                min={1}
                placeholder="Từ (ví dụ: 5)"
                value={form.minGuest}
                onChange={(e) => setForm((f) => ({ ...f, minGuest: e.target.value }))}
                style={ui.input}
              />
              <span style={ui.rangeSep}>–</span>
              <input
                type="number"
                min={1}
                placeholder="Đến (để trống = không trần)"
                value={form.maxGuest}
                onChange={(e) => setForm((f) => ({ ...f, maxGuest: e.target.value }))}
                style={ui.input}
              />
            </div>
          </div>

          {/* Loại cọc */}
          <div style={ui.fieldGroup}>
            <label style={ui.label}>Hình thức cọc</label>
            <select
              value={form.depositType}
              onChange={(e) => handleDepositTypeChange(e.target.value)}
              style={ui.select}
            >
              <option value="PER_PERSON">Theo đầu người (₫ / người)</option>
              <option value="FIXED">Cố định theo lượt đặt (₫ / đơn)</option>
              <option value="PER_TABLE">Theo số lượng bàn (₫ / bàn)</option>
              <option value="PERCENT">Theo phần trăm món đặt trước (%)</option>
              <option value="NO_DEPOSIT">Miễn cọc (0 ₫)</option>
            </select>
          </div>

          {/* Giá trị cọc */}
          <div style={ui.fieldGroup}>
            <label style={ui.label}>Mức cọc</label>
            <div style={ui.inputSuffixWrapper}>
              <input
                type="number"
                min={0}
                disabled={form.depositType === "NO_DEPOSIT"}
                placeholder={form.depositType === "NO_DEPOSIT" ? "0" : "Nhập số tiền hoặc %"}
                value={form.depositType === "NO_DEPOSIT" ? "0" : form.depositValue}
                onChange={(e) => setForm((f) => ({ ...f, depositValue: e.target.value }))}
                style={{
                  ...ui.input,
                  background: form.depositType === "NO_DEPOSIT" ? "#F3F4F6" : "#FFF",
                }}
              />
              <span style={ui.suffix}>
                {form.depositType === "PERCENT"
                  ? "%"
                  : form.depositType === "NO_DEPOSIT"
                  ? "₫"
                  : "₫"}
              </span>
            </div>
          </div>
        </div>

        {/* Option mở rộng: Giới hạn số bàn */}
        <div style={ui.advancedSection}>
          <label style={ui.checkboxLabel}>
            <input
              type="checkbox"
              checked={form.limitTables}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  limitTables: e.target.checked,
                  minTables: e.target.checked ? f.minTables || 1 : 1,
                  maxTables: e.target.checked ? f.maxTables : "",
                }))
              }
              style={ui.checkbox}
            />
            <span style={{ fontWeight: 600 }}>Ràng buộc thêm theo số bàn thực tế</span>
          </label>

          {form.limitTables && (
            <div style={ui.tableLimitInputs}>
              <div style={{ flex: 1 }}>
                <span style={ui.subLabel}>Tối thiểu (bàn):</span>
                <input
                  type="number"
                  min={1}
                  value={form.minTables}
                  onChange={(e) => setForm((f) => ({ ...f, minTables: e.target.value }))}
                  style={ui.input}
                />
              </div>
              <div style={{ flex: 1 }}>
                <span style={ui.subLabel}>Tối đa (bàn):</span>
                <input
                  type="number"
                  min={1}
                  placeholder="Để trống = Không trần"
                  value={form.maxTables}
                  onChange={(e) => setForm((f) => ({ ...f, maxTables: e.target.value }))}
                  style={ui.input}
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div style={ui.formFooter}>
          <button type="submit" disabled={saving} style={ui.btnSubmit}>
            {saving ? "Đang lưu quy tắc..." : "+ Thêm quy tắc này"}
          </button>
        </div>
      </form>
    </section>
  );
}

const ui = {
  container: {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: 12,
    padding: "1.5rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "1.25rem",
    paddingBottom: "1rem",
    borderBottom: "1px solid #F3F4F6",
  },
  title: {
    fontSize: "1.05rem",
    fontWeight: 700,
    color: "#111827",
    margin: 0,
  },
  subtitle: {
    fontSize: "0.82rem",
    color: "#6B7280",
    marginTop: "0.25rem",
    margin: 0,
  },
  badgeCount: {
    fontSize: "0.75rem",
    fontWeight: 600,
    background: "#F3F4F6",
    color: "#374151",
    padding: "0.25rem 0.65rem",
    borderRadius: 99,
  },
  emptyBox: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "1rem",
    background: "#F9FAFB",
    border: "1px dashed #D1D5DB",
    borderRadius: 8,
    color: "#6B7280",
    fontSize: "0.85rem",
    marginBottom: "1.5rem",
  },
  tableWrapper: {
    overflowX: "auto",
    marginBottom: "1.5rem",
    border: "1px solid #E5E7EB",
    borderRadius: 8,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
    fontSize: "0.85rem",
  },
  th: {
    background: "#F9FAFB",
    padding: "0.75rem 1rem",
    fontWeight: 600,
    color: "#374151",
    borderBottom: "1px solid #E5E7EB",
  },
  tr: {
    borderBottom: "1px solid #F3F4F6",
  },
  td: {
    padding: "0.75rem 1rem",
    color: "#4B5563",
  },
  tdBold: {
    padding: "0.75rem 1rem",
    fontWeight: 600,
    color: "#111827",
  },
  tdHighlight: {
    padding: "0.75rem 1rem",
    fontWeight: 700,
    color: "#D97706",
  },
  tableTag: {
    fontSize: "0.78rem",
    background: "#FEF3C7",
    color: "#92400E",
    padding: "0.2rem 0.5rem",
    borderRadius: 4,
    fontWeight: 500,
  },
  typeBadge: {
    fontSize: "0.75rem",
    fontWeight: 600,
    padding: "0.2rem 0.55rem",
    borderRadius: 6,
    display: "inline-block",
  },
  textMuted: {
    color: "#9CA3AF",
    fontStyle: "italic",
    fontSize: "0.8rem",
  },
  btnDelete: {
    background: "#FEE2E2",
    color: "#DC2626",
    border: "none",
    padding: "0.3rem 0.65rem",
    borderRadius: 6,
    fontWeight: 600,
    fontSize: "0.75rem",
    cursor: "pointer",
  },
  formCard: {
    background: "#F9FAFB",
    border: "1px solid #E5E7EB",
    borderRadius: 10,
    padding: "1.25rem",
  },
  formHeader: {
    fontSize: "0.9rem",
    fontWeight: 700,
    color: "#1F2937",
    marginBottom: "1rem",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "1rem",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.35rem",
  },
  label: {
    fontSize: "0.78rem",
    fontWeight: 600,
    color: "#374151",
  },
  subLabel: {
    fontSize: "0.72rem",
    color: "#6B7280",
    marginBottom: "0.2rem",
    display: "block",
  },
  rangeInputs: {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
  },
  rangeSep: {
    color: "#9CA3AF",
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    height: 38,
    padding: "0 0.65rem",
    border: "1px solid #D1D5DB",
    borderRadius: 6,
    fontSize: "0.85rem",
    outline: "none",
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    height: 38,
    padding: "0 0.65rem",
    border: "1px solid #D1D5DB",
    borderRadius: 6,
    fontSize: "0.85rem",
    outline: "none",
    background: "#FFF",
    boxSizing: "border-box",
  },
  inputSuffixWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  suffix: {
    position: "absolute",
    right: 12,
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#6B7280",
    pointerEvents: "none",
  },
  advancedSection: {
    marginTop: "1rem",
    paddingTop: "0.85rem",
    borderTop: "1px dashed #E5E7EB",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.82rem",
    color: "#374151",
    cursor: "pointer",
  },
  checkbox: {
    width: 16,
    height: 16,
    accentColor: "#2563EB",
    cursor: "pointer",
  },
  tableLimitInputs: {
    display: "flex",
    gap: "1rem",
    marginTop: "0.75rem",
    maxWidth: "400px",
  },
  formFooter: {
    marginTop: "1.25rem",
    display: "flex",
    justifyContent: "flex-end",
  },
  btnSubmit: {
    background: "#2563EB",
    color: "#FFFFFF",
    border: "none",
    height: 38,
    padding: "0 1.5rem",
    borderRadius: 6,
    fontWeight: 600,
    fontSize: "0.85rem",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(37,99,235,0.2)",
  },
};

export default PolicyDepositRules;