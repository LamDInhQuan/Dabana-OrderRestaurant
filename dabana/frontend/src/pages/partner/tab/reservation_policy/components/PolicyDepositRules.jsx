import React, { useState } from "react";
import toast from "react-hot-toast";
import { reservationPolicyApi } from "../../../../../api";

const EMPTY_RULE = {
  minGuests: 1,
  maxGuests: "",
  depositType: "PER_PERSON",
  depositValue: "",
  maxTables: "",
  maxCapacitySlop: "",
  minPreorderAmount: "",
};

const DEPOSIT_TYPE_MAP = {
  FIXED: { label: "Cố định / đơn", bg: "#EFF6FF", color: "#1D4ED8" },
  PER_PERSON: { label: "Theo đầu người", bg: "#FEF3C7", color: "#B45309" },
  PERCENTAGE: { label: "% Đơn món đặt trước", bg: "#FCE7F3", color: "#BE185D" },
};

// Formatter hiển thị giá trị cọc
const fmtValue = (r) => {
  if (r.depositType === "PERCENTAGE") return `${r.depositValue}%`;

  const val = Number(r.depositValue || 0).toLocaleString("vi-VN");
  if (r.depositType === "PER_PERSON") return `${val} ₫ / người`;
  return `${val} ₫ / đơn`;
};

// Formatter hiển thị khoảng số khách (Fix lỗi '👥 + khách')
const fmtGuestRange = (r) => {
  // Ưu tiên đọc minGuest/maxGuest (từ Response API) hoặc fallback minGuests/maxGuests
  const min = r.minGuest ?? r.minGuests;
  const max = r.maxGuest ?? r.maxGuests;

  if (min && max) {
    if (min === max) return `${min} khách`;
    return `${min} – ${max} khách`;
  }
  if (min) return `Từ ${min} khách`;
  if (max) return `Tối đa ${max} khách`;
  return "Mọi số lượng khách";
};

function PolicyDepositRules({ restaurantId, policyId, rules = [], onRefresh }) {
  const [form, setForm] = useState(EMPTY_RULE);
  const [saving, setSaving] = useState(false);

  const handleDepositTypeChange = (type) => {
    setForm((f) => ({
      ...f,
      depositType: type,
    }));
  };

  const handleAdd = async (e) => {
    e.preventDefault();

    if (!form.minGuests) {
      toast.error("Vui lòng nhập số khách tối thiểu");
      return;
    }

    if (form.maxGuests && Number(form.minGuests) > Number(form.maxGuests)) {
      toast.error("Số khách tối thiểu không được lớn hơn số khách tối đa");
      return;
    }

    if (!form.depositValue || Number(form.depositValue) <= 0) {
      toast.error("Vui lòng nhập giá trị cọc hợp lệ");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        minGuests: Number(form.minGuests),
        maxGuests: form.maxGuests ? Number(form.maxGuests) : null,
        depositType: form.depositType,
        depositValue: Number(form.depositValue),
        maxTables: form.maxTables ? Number(form.maxTables) : null,
        maxCapacitySlop: form.maxCapacitySlop ? Number(form.maxCapacitySlop) : null,
        minPreorderAmount:
          form.depositType === "PERCENTAGE" && form.minPreorderAmount
            ? Number(form.minPreorderAmount)
            : null,
      };

      await reservationPolicyApi.createDepositRule(restaurantId, policyId, payload);

      toast.success("Thêm quy tắc đặt cọc thành công!");
      setForm(EMPTY_RULE);

      // Trigger re-render lại UI ở Component cha
      if (typeof onRefresh === "function") {
        await onRefresh();
      }
    } catch (err) {
      console.error("Lỗi tạo deposit rule:", err);
      // Hiển thị chính xác thông báo lỗi từ Backend (ví dụ: RESERVATION_POLICY_001)
      const serverMessage = err.response?.data?.message || "Không thể thêm quy tắc đặt cọc!";
      toast.error(serverMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ruleId) => {
    if (!window.confirm("Bạn có chắc muốn xoá quy tắc đặt cọc này?")) return;
    try {
      await reservationPolicyApi.remove(restaurantId, policyId, ruleId);
      toast.success("Đã xoá quy tắc thành công!");
      if (typeof onRefresh === "function") {
        await onRefresh();
      }
    } catch (err) {
      console.error("Lỗi xoá deposit rule:", err);
      const serverMessage = err.response?.data?.message || "Không thể xoá quy tắc!";
      toast.error(serverMessage);
    }
  };

  return (
    <div style={ui.container}>
      <p style={ui.subtitle}>
        Tự động áp dụng mức cọc & ràng buộc số bàn tối đa dựa theo số lượng khách của đơn đặt.
      </p>

      {/* Bảng danh sách quy tắc */}
      {rules.length === 0 ? (
        <div style={ui.emptyBox}>
          <span style={ui.emptyIcon}>💡</span>
          <span>Chưa có quy tắc riêng. Hệ thống sẽ áp dụng theo chính sách cọc mặc định của nhà hàng.</span>
        </div>
      ) : (
        <div style={ui.tableCard}>
          <div style={ui.tableHeaderBar}>
            <span style={ui.tableTitle}>Danh sách quy tắc ({rules.length})</span>
          </div>
          <div style={ui.tableWrapper}>
            <table style={ui.table}>
              <thead>
                <tr>
                  <th style={{ ...ui.th, width: "22%" }}>Số lượng khách</th>
                  <th style={{ ...ui.th, width: "18%" }}>Giới hạn bàn</th>
                  <th style={{ ...ui.th, width: "18%" }}>Dung sai ghế (Slop)</th>
                  <th style={{ ...ui.th, width: "20%" }}>Hình thức cọc</th>
                  <th style={{ ...ui.th, width: "15%" }}>Mức cọc</th>
                  <th style={{ ...ui.th, width: "7%", textAlign: "right" }}></th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => {
                  const badge = DEPOSIT_TYPE_MAP[r.depositType] || DEPOSIT_TYPE_MAP.FIXED;
                  return (
                    <tr key={r.id} style={ui.tr}>
                      {/* Cột số lượng khách - đã fix hiển thị */}
                      <td style={ui.tdBold}>👥 {fmtGuestRange(r)}</td>

                      {/* Cột Bàn gộp */}
                      <td style={ui.td}>
                        {r.maxTables ? (
                          <span style={ui.tableTag}>🪑 Tối đa {r.maxTables} bàn</span>
                        ) : (
                          <span style={ui.textMuted}>Không giới hạn</span>
                        )}
                      </td>

                      {/* Cột Dung sai ghế */}
                      <td style={ui.td}>
                        {r.maxCapacitySlop !== null && r.maxCapacitySlop !== undefined ? (
                          <span style={ui.slopTag}>+{r.maxCapacitySlop} ghế dư</span>
                        ) : (
                          <span style={ui.textMuted}>Theo mặc định</span>
                        )}
                      </td>

                      {/* Cột Hình thức cọc */}
                      <td style={ui.td}>
                        <span style={{ ...ui.typeBadge, background: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      </td>

                      {/* Cột Mức cọc */}
                      <td style={ui.tdHighlight}>{fmtValue(r)}</td>

                      {/* Cột Hành động */}
                      <td style={{ ...ui.td, textAlign: "right" }}>
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id)}
                          style={ui.btnDelete}
                          title="Xoá quy tắc"
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
        </div>
      )}

      {/* Form thêm mới */}
      <form onSubmit={handleAdd} style={ui.formCard}>
        <div style={ui.formHeader}>
          <span style={ui.formHeaderIcon}>✦</span> Thêm quy tắc cọc & điều kiện bàn mới
        </div>

        <div style={ui.formGrid}>
          {/* Nhóm chọn số khách */}
          <div style={ui.fieldGroup}>
            <label style={ui.label}>
              Số lượng khách <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <div style={ui.rangeInputs}>
              <input
                type="number"
                min={1}
                placeholder="Từ (VD: 1)"
                value={form.minGuests}
                onChange={(e) => setForm((f) => ({ ...f, minGuests: e.target.value }))}
                style={ui.input}
              />
              <span style={ui.rangeSep}>–</span>
              <input
                type="number"
                min={1}
                placeholder="Đến (bỏ trống = +)"
                value={form.maxGuests}
                onChange={(e) => setForm((f) => ({ ...f, maxGuests: e.target.value }))}
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
              <option value="PERCENTAGE">Theo phần trăm món đặt trước (%)</option>
            </select>
          </div>

          {/* Giá trị cọc */}
          <div style={ui.fieldGroup}>
            <label style={ui.label}>Mức cọc</label>
            <div style={ui.inputSuffixWrapper}>
              <input
                type="number"
                min={0}
                placeholder="Nhập giá trị"
                value={form.depositValue}
                onChange={(e) => setForm((f) => ({ ...f, depositValue: e.target.value }))}
                style={{ ...ui.input, paddingRight: "2.2rem" }}
              />
              <span style={ui.suffix}>
                {form.depositType === "PERCENTAGE" ? "%" : "₫"}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic field cho PERCENTAGE */}
        {form.depositType === "PERCENTAGE" && (
          <div style={{ marginTop: "1rem" }}>
            <div style={ui.fieldGroup}>
              <label style={ui.label}>Giá trị đặt món tối thiểu để áp dụng cọc %</label>
              <div style={ui.inputSuffixWrapper}>
                <input
                  type="number"
                  min={0}
                  placeholder="VD: 500000 (Để trống nếu không bắt buộc)"
                  value={form.minPreorderAmount}
                  onChange={(e) => setForm((f) => ({ ...f, minPreorderAmount: e.target.value }))}
                  style={{ ...ui.input, paddingRight: "2.2rem" }}
                />
                <span style={ui.suffix}>₫</span>
              </div>
            </div>
          </div>
        )}

        {/* Cấu hình nâng cao: Slop & MaxTables */}
        <div style={ui.advancedSection}>
          <div style={ui.advancedGrid}>
            <div style={ui.fieldGroup}>
              <label style={ui.label}>Dung sai lãng phí chỗ (Ghế dư)</label>
              <div style={ui.inputSuffixWrapper}>
                <input
                  type="number"
                  min={0}
                  placeholder="Mặc định"
                  value={form.maxCapacitySlop}
                  onChange={(e) => setForm((f) => ({ ...f, maxCapacitySlop: e.target.value }))}
                  style={ui.input}
                />
                <span style={ui.suffix}>ghế dư</span>
              </div>
            </div>

            <div style={ui.fieldGroup}>
              <label style={ui.label}>Số lượng bàn gộp tối đa</label>
              <input
                type="number"
                min={1}
                placeholder="Bỏ trống = Không giới hạn"
                value={form.maxTables}
                onChange={(e) => setForm((f) => ({ ...f, maxTables: e.target.value }))}
                style={ui.input}
              />
            </div>
          </div>
        </div>

        <div style={ui.formFooter}>
          <button type="submit" disabled={saving} style={ui.btnSubmit}>
            {saving ? "Đang lưu..." : "+ Thêm quy tắc này"}
          </button>
        </div>
      </form>
    </div>
  );
}

const ui = {
  container: { padding: "0.5rem 0 0 0", color: "#2B2623" },
  subtitle: { fontSize: "0.86rem", color: "#6B7280", marginBottom: "1.25rem", marginTop: 0 },
  emptyBox: { display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.9rem 1.1rem", background: "#FFFDF9", border: "1px dashed #E5D5BC", borderRadius: 10, color: "#785E29", fontSize: "0.85rem", marginBottom: "1.25rem" },
  emptyIcon: { fontSize: "1.1rem" },
  tableCard: { border: "1px solid #EAE3D2", borderRadius: 10, overflow: "hidden", marginBottom: "1.5rem", background: "#FFFFFF" },
  tableHeaderBar: { padding: "0.6rem 1rem", background: "#FAF7F2", borderBottom: "1px solid #EAE3D2" },
  tableTitle: { fontSize: "0.82rem", fontWeight: 700, color: "#785E29", textTransform: "uppercase" },
  tableWrapper: { overflowX: "auto" },
  table: { width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.84rem" },
  th: { background: "#FFFFFF", padding: "0.65rem 0.85rem", fontWeight: 600, color: "#6B7280", borderBottom: "1px solid #F3F4F6", whiteSpace: "nowrap" },
  tr: { borderBottom: "1px solid #F8F6F0" },
  td: { padding: "0.75rem 0.85rem", color: "#374151", verticalAlign: "middle", whiteSpace: "nowrap" },
  tdBold: { padding: "0.75rem 0.85rem", fontWeight: 600, color: "#1F2937", verticalAlign: "middle", whiteSpace: "nowrap" },
  tdHighlight: { padding: "0.75rem 0.85rem", fontWeight: 700, color: "#B45309", verticalAlign: "middle", whiteSpace: "nowrap" },
  tableTag: { fontSize: "0.78rem", background: "#FEF3C7", color: "#92400E", padding: "0.2rem 0.5rem", borderRadius: 5, fontWeight: 500, display: "inline-block" },
  slopTag: { fontSize: "0.78rem", background: "#F3F4F6", color: "#4B5563", padding: "0.2rem 0.5rem", borderRadius: 5, fontWeight: 500, display: "inline-block" },
  typeBadge: { fontSize: "0.76rem", fontWeight: 600, padding: "0.2rem 0.55rem", borderRadius: 6, display: "inline-block" },
  textMuted: { color: "#9CA3AF", fontSize: "0.8rem" },
  btnDelete: { background: "transparent", color: "#EF4444", border: "none", padding: "0.25rem 0.5rem", borderRadius: 4, fontWeight: 600, fontSize: "0.78rem", cursor: "pointer" },
  formCard: { background: "#FAF7F2", border: "1px solid #EAE3D2", borderRadius: 12, padding: "1.25rem" },
  formHeader: { fontSize: "0.92rem", fontWeight: 700, color: "#524328", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" },
  formHeaderIcon: { color: "#C29B38" },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" },
  advancedSection: { marginTop: "1.1rem", paddingTop: "0.85rem", borderTop: "1px dashed #E5D5BC" },
  advancedGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "0.4rem" },
  label: { fontSize: "0.8rem", fontWeight: 600, color: "#374151" },
  rangeInputs: { display: "flex", alignItems: "center", gap: "0.4rem" },
  rangeSep: { color: "#9CA3AF", fontWeight: "bold" },
  input: { width: "100%", height: 38, padding: "0 0.75rem", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: "0.85rem", outline: "none", background: "#FFFFFF", boxSizing: "border-box" },
  select: { width: "100%", height: 38, padding: "0 0.75rem", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: "0.85rem", outline: "none", background: "#FFFFFF", boxSizing: "border-box", cursor: "pointer" },
  inputSuffixWrapper: { position: "relative", display: "flex", alignItems: "center", width: "100%" },
  suffix: { position: "absolute", right: 12, fontSize: "0.82rem", fontWeight: 600, color: "#6B7280", pointerEvents: "none" },
  formFooter: { marginTop: "1.25rem", display: "flex", justifyContent: "flex-end" },
  btnSubmit: { background: "#2563EB", color: "#FFFFFF", border: "none", height: 38, padding: "0 1.25rem", borderRadius: 8, fontWeight: 600, fontSize: "0.84rem", cursor: "pointer" },
};

export default PolicyDepositRules;