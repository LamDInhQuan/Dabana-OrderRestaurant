import React, { useState } from "react";
import toast from "react-hot-toast";
import { reservationPolicyApi } from "../../../../../api";

const EMPTY_RULE = {
  id: null,
  minGuests: 1,
  maxGuests: "",
  depositType: "PER_PERSON",
  depositValue: "",
  maxTables: "",
  maxCapacitySlop: "",
  minPreorderAmount: "",
  preorderDepositPercent: "",
};

const DEPOSIT_TYPE_MAP = {
  FIXED: { label: "Cố định / đơn", bg: "#EFF6FF", color: "#1D4ED8" },
  PER_PERSON: { label: "Theo đầu người", bg: "#FEF3C7", color: "#B45309" },
};

// Formatter hiển thị giá trị cọc
const fmtValue = (r) => {
  const val = Number(r.depositValue || 0).toLocaleString("vi-VN");
  if (r.depositType === "PER_PERSON") return `${val} ₫ / người`;
  return `${val} ₫ / đơn`;
};

// Formatter hiển thị khoảng số khách
const fmtGuestRange = (r) => {
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

function PolicyDepositRules({ restaurantId, policyId, rules = [], onRefresh, readOnly = false }) {
  console.log("readOnly",readOnly);
  
  const [form, setForm] = useState(EMPTY_RULE);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isEditing = Boolean(form.id);

  // Đưa dữ liệu rule vào Form để sửa
  const handleEdit = (rule) => {
    setForm({
      id: rule.id,
      minGuests: rule.minGuests ?? rule.minGuest ?? 1,
      maxGuests: rule.maxGuests ?? rule.maxGuest ?? "",
      depositType: rule.depositType || "PER_PERSON",
      depositValue: rule.depositValue ?? "",
      maxTables: rule.maxTables ?? "",
      maxCapacitySlop: rule.maxCapacitySlop ?? "",
      minPreorderAmount: rule.minPreorderAmount ?? "",
      preorderDepositPercent: rule.preorderDepositPercent ?? "",
    });
  };

  // Hủy sửa
  const handleCancelEdit = () => {
    setForm(EMPTY_RULE);
  };

  // Validation chung
  const validateForm = () => {
    if (!form.minGuests || Number(form.minGuests) < 1) {
      toast.error("Số khách tối thiểu phải từ 1 người trở lên");
      return false;
    }
    if (!form.maxGuests || Number(form.maxGuests) < 1) {
      toast.error("Số khách tối đa không được để trống và phải lớn hơn 0");
      return false;
    }
    if (Number(form.minGuests) > Number(form.maxGuests)) {
      toast.error("Số khách tối thiểu không được lớn hơn số khách tối đa");
      return false;
    }
    if (form.depositValue === "" || Number(form.depositValue) < 0) {
      toast.error("Giá trị cọc không được để trống và phải lớn hơn hoặc bằng 0");
      return false;
    }
    if (
      form.preorderDepositPercent !== "" &&
      (Number(form.preorderDepositPercent) < 0 || Number(form.preorderDepositPercent) > 100)
    ) {
      toast.error("Phần trăm cọc món ăn phải từ 0% đến 100%");
      return false;
    }
    return true;
  };

  // Thêm mới hoặc Cập nhật quy tắc
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (readOnly) return;

    if (!validateForm()) return;

    try {
      setSaving(true);

      const payload = {
        depositType: form.depositType,
        minGuests: Number(form.minGuests),
        maxGuests: Number(form.maxGuests),
        depositValue: Number(form.depositValue),
        maxCapacitySlop: form.maxCapacitySlop !== "" ? Number(form.maxCapacitySlop) : null,
        maxTables: form.maxTables !== "" ? Number(form.maxTables) : null,
        minPreorderAmount: form.minPreorderAmount !== "" ? Number(form.minPreorderAmount) : null,
        preorderDepositPercent: form.preorderDepositPercent !== "" ? Number(form.preorderDepositPercent) : null,
      };

      if (isEditing) {
        // Gọi API cập nhật
        if (typeof reservationPolicyApi.updateDepositRule === "function") {
          await reservationPolicyApi.updateDepositRule(restaurantId, policyId, form.id, payload);
        } else {
          await reservationPolicyApi.updateRule(restaurantId, policyId, form.id, payload);
        }
        toast.success("Cập nhật quy tắc cọc thành công!");
      } else {
        // Gọi API thêm mới
        await reservationPolicyApi.createDepositRule(restaurantId, policyId, payload);
        toast.success("Thêm quy tắc đặt cọc thành công!");
      }

      setForm(EMPTY_RULE);

      if (typeof onRefresh === "function") {
        await onRefresh();
      }
    } catch (err) {
      console.error("Lỗi lưu deposit rule:", err);
      const serverMessage =
        err.response?.data?.message || err.message || "Không thể lưu quy tắc đặt cọc!";
      toast.error(serverMessage);
    } finally {
      setSaving(false);
    }
  };

  // Xác nhận và thực thi Xóa
  const handleConfirmDelete = async () => {
    if (!deletingId || readOnly) return;

    try {
      setIsDeleting(true);

      if (typeof reservationPolicyApi.deleteDepositRule === "function") {
        await reservationPolicyApi.deleteDepositRule(restaurantId, policyId, deletingId);
      } else if (typeof reservationPolicyApi.removeDepositRule === "function") {
        await reservationPolicyApi.removeDepositRule(restaurantId, policyId, deletingId);
      } else {
        await reservationPolicyApi.deleteRule(restaurantId, policyId, deletingId);
      }

      toast.success("Đã xoá quy tắc thành công!");

      // Nếu đang mở đúng id xóa trên form thì reset form
      if (form.id === deletingId) {
        setForm(EMPTY_RULE);
      }

      setDeletingId(null);

      if (typeof onRefresh === "function") {
        await onRefresh();
      }
    } catch (err) {
      console.error("Lỗi xoá deposit rule:", err);
      const serverMessage = err.response?.data?.message || "Không thể xoá quy tắc!";
      toast.error(serverMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div style={ui.container}>
      <p style={ui.subtitle}>
        Tự động áp dụng mức cọc & ràng buộc đặt món/bàn dựa theo số lượng khách của đơn đặt.
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
                  <th style={{ ...ui.th, width: "18%" }}>Số lượng khách</th>
                  <th style={{ ...ui.th, width: "15%" }}>Giới hạn bàn</th>
                  <th style={{ ...ui.th, width: "15%" }}>Dung sai ghế (Slop)</th>
                  <th style={{ ...ui.th, width: "16%" }}>Hình thức cọc</th>
                  <th style={{ ...ui.th, width: "16%" }}>Mức cọc cơ bản</th>
                  <th style={{ ...ui.th, width: "15%" }}>Cọc món trước</th>
                  {!readOnly && <th style={{ ...ui.th, width: "10%", textAlign: "right" }}>Thao tác</th>}
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => {
                  const badge = DEPOSIT_TYPE_MAP[r.depositType] || DEPOSIT_TYPE_MAP.FIXED;
                  const isCurrentEditing = form.id === r.id;

                  return (
                    <tr
                      key={r.id}
                      style={{
                        ...ui.tr,
                        backgroundColor: isCurrentEditing ? "#FEFCE8" : "transparent",
                      }}
                    >
                      <td style={ui.tdBold}>👥 {fmtGuestRange(r)}</td>

                      <td style={ui.td}>
                        {r.maxTables ? (
                          <span style={ui.tableTag}>🪑 Tối đa {r.maxTables} bàn</span>
                        ) : (
                          <span style={ui.textMuted}>K giới hạn</span>
                        )}
                      </td>

                      <td style={ui.td}>
                        {r.maxCapacitySlop !== null && r.maxCapacitySlop !== undefined ? (
                          <span style={ui.slopTag}>+{r.maxCapacitySlop} ghế dư</span>
                        ) : (
                          <span style={ui.textMuted}>K giới hạn</span>
                        )}
                      </td>

                      <td style={ui.td}>
                        <span style={{ ...ui.typeBadge, background: badge.bg, color: badge.color }}>
                          {badge.label}
                        </span>
                      </td>

                      <td style={ui.tdHighlight}>{fmtValue(r)}</td>

                      <td style={ui.td}>
                        {r.minPreorderAmount || r.preorderDepositPercent ? (
                          <div style={ui.subNote}>
                            {r.minPreorderAmount ? <div>Min: {Number(r.minPreorderAmount).toLocaleString("vi-VN")} ₫</div> : null}
                            {r.preorderDepositPercent ? <div>Cọc: {r.preorderDepositPercent}%</div> : null}
                          </div>
                        ) : (
                          <span style={ui.textMuted}>Không áp dụng</span>
                        )}
                      </td>

                      {!readOnly && (
                        <td style={{ ...ui.td, textAlign: "right" }}>
                          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.4rem" }}>
                            <button
                              type="button"
                              onClick={() => handleEdit(r)}
                              style={ui.btnEdit}
                              title="Sửa quy tắc này"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(r.id)}
                              style={ui.btnDelete}
                              title="Xoá quy tắc"
                            >
                              Xoá
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Form thêm mới / Sửa (Ẩn hoàn toàn khi readOnly) */}
      {!readOnly && (
        <form onSubmit={handleSubmit} style={ui.formCard}>
          <div style={ui.formHeader}>
            <span style={ui.formHeaderIcon}>{isEditing ? "✏️" : "✦"}</span>
            <span>{isEditing ? "Cập nhật quy tắc cọc" : "Thêm quy tắc cọc & điều kiện bàn mới"}</span>
            {isEditing && (
              <span style={ui.editingBadge}>Đang sửa ID: #{form.id}</span>
            )}
          </div>

          <div style={ui.formGrid}>
            {/* Nhóm chọn số khách */}
            <div style={ui.fieldGroup}>
              <label style={ui.label}>
                Số lượng khách <span style={ui.required}>*</span>
              </label>
              <div style={ui.rangeInputs}>
                <input
                  type="number"
                  min={1}
                  placeholder="Từ (Min)"
                  value={form.minGuests}
                  onChange={(e) => setForm((f) => ({ ...f, minGuests: e.target.value }))}
                  style={ui.input}
                />
                <span style={ui.rangeSep}>–</span>
                <input
                  type="number"
                  min={1}
                  placeholder="Đến (Max)"
                  value={form.maxGuests}
                  onChange={(e) => setForm((f) => ({ ...f, maxGuests: e.target.value }))}
                  style={ui.input}
                />
              </div>
              <span style={ui.fieldHint}>Bắt buộc nhập cả số khách từ và đến</span>
            </div>

            {/* Loại cọc */}
            <div style={ui.fieldGroup}>
              <label style={ui.label}>
                Hình thức cọc <span style={ui.required}>*</span>
              </label>
              <select
                value={form.depositType}
                onChange={(e) => setForm((f) => ({ ...f, depositType: e.target.value }))}
                style={ui.select}
              >
                <option value="PER_PERSON">Theo đầu người (₫ / người)</option>
                <option value="FIXED">Cố định theo lượt đặt (₫ / đơn)</option>
              </select>
            </div>

            {/* Mức cọc cơ bản */}
            <div style={ui.fieldGroup}>
              <label style={ui.label}>
                Mức cọc cơ bản <span style={ui.required}>*</span>
              </label>
              <div style={ui.inputSuffixWrapper}>
                <input
                  type="number"
                  min={0}
                  placeholder="Nhập giá trị (≥ 0)"
                  value={form.depositValue}
                  onChange={(e) => setForm((f) => ({ ...f, depositValue: e.target.value }))}
                  style={{ ...ui.input, paddingRight: "2.5rem" }}
                />
                <span style={ui.suffix}>₫</span>
              </div>
              <span style={ui.fieldHint}>Mức cọc cơ sở (hoặc cọc giữ chỗ)</span>
            </div>
          </div>

          {/* Khối điều kiện Cọc Đặt Món Trước */}
          <div style={ui.sectionBlock}>
            <div style={ui.sectionTitle}>🍽️ Điều kiện cọc đặt món trước (Tùy chọn)</div>
            <div style={ui.formGrid}>
              <div style={ui.fieldGroup}>
                <label style={ui.label}>Giá trị đặt món tối thiểu</label>
                <div style={ui.inputSuffixWrapper}>
                  <input
                    type="number"
                    min={0}
                    placeholder="Bỏ trống = Null"
                    value={form.minPreorderAmount}
                    onChange={(e) => setForm((f) => ({ ...f, minPreorderAmount: e.target.value }))}
                    style={{ ...ui.input, paddingRight: "2.5rem" }}
                  />
                  <span style={ui.suffix}>₫</span>
                </div>
                <span style={ui.fieldHint}>Số tiền đặt món tối thiểu để áp dụng</span>
              </div>

              <div style={ui.fieldGroup}>
                <label style={ui.label}>Phần trăm cọc món (%)</label>
                <div style={ui.inputSuffixWrapper}>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    placeholder="VD: 30"
                    value={form.preorderDepositPercent}
                    onChange={(e) => setForm((f) => ({ ...f, preorderDepositPercent: e.target.value }))}
                    style={{ ...ui.input, paddingRight: "2.5rem" }}
                  />
                  <span style={ui.suffix}>%</span>
                </div>
                <span style={ui.fieldHint}>% cọc yêu cầu khi đặt món trước</span>
              </div>
            </div>
          </div>

          {/* Cấu hình gộp bàn */}
          <div style={ui.advancedSection}>
            <div style={ui.advancedGrid}>
              <div style={ui.fieldGroup}>
                <label style={ui.label}>Dung sai ghế dư (Max Capacity Slop)</label>
                <div style={ui.inputSuffixWrapper}>
                  <input
                    type="number"
                    min={0}
                    placeholder="Không giới hạn (Bỏ trống = null)"
                    value={form.maxCapacitySlop}
                    onChange={(e) => setForm((f) => ({ ...f, maxCapacitySlop: e.target.value }))}
                    style={ui.input}
                  />
                </div>
                <span style={ui.fieldHint}>Số ghế dư cho phép khi gộp bàn</span>
              </div>

              <div style={ui.fieldGroup}>
                <label style={ui.label}>Số lượng bàn gộp tối đa</label>
                <input
                  type="number"
                  min={1}
                  placeholder="Không giới hạn (Bỏ trống = null)"
                  value={form.maxTables}
                  onChange={(e) => setForm((f) => ({ ...f, maxTables: e.target.value }))}
                  style={ui.input}
                />
                <span style={ui.fieldHint}>Giới hạn số bàn ghép tối đa</span>
              </div>
            </div>
          </div>

          <div style={ui.formFooter}>
            {isEditing && (
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={saving}
                style={ui.btnCancelEdit}
              >
                Hủy sửa
              </button>
            )}
            <button type="submit" disabled={saving} style={ui.btnSubmit}>
              {saving
                ? "Đang lưu..."
                : isEditing
                ? "Lưu thay đổi"
                : "+ Thêm quy tắc này"}
            </button>
          </div>
        </form>
      )}

      {/* Modal Cảnh báo Xóa Quy tắc */}
      {deletingId && !readOnly && (
        <div style={ui.modalOverlay}>
          <div style={ui.modalCard}>
            <div style={ui.modalTitle}>⚠️ Xác nhận xoá quy tắc</div>
            <p style={ui.modalText}>
              Bạn có chắc chắn muốn xoá quy tắc cọc này không? Hành động này không thể hoàn tác.
            </p>
            <div style={ui.modalActions}>
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                style={ui.btnCancel}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                style={ui.btnConfirmDelete}
              >
                {isDeleting ? "Đang xoá..." : "Xác nhận xoá"}
              </button>
            </div>
          </div>
        </div>
      )}
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
  tr: { borderBottom: "1px solid #F8F6F0", transition: "background-color 0.2s" },
  td: { padding: "0.75rem 0.85rem", color: "#374151", verticalAlign: "middle", whiteSpace: "nowrap" },
  tdBold: { padding: "0.75rem 0.85rem", fontWeight: 600, color: "#1F2937", verticalAlign: "middle", whiteSpace: "nowrap" },
  tdHighlight: { padding: "0.75rem 0.85rem", fontWeight: 700, color: "#B45309", verticalAlign: "middle", whiteSpace: "nowrap" },
  subNote: { fontSize: "0.76rem", fontWeight: 500, color: "#4B5563" },
  tableTag: { fontSize: "0.78rem", background: "#FEF3C7", color: "#92400E", padding: "0.2rem 0.5rem", borderRadius: 5, fontWeight: 500, display: "inline-block" },
  slopTag: { fontSize: "0.78rem", background: "#F3F4F6", color: "#4B5563", padding: "0.2rem 0.5rem", borderRadius: 5, fontWeight: 500, display: "inline-block" },
  typeBadge: { fontSize: "0.76rem", fontWeight: 600, padding: "0.2rem 0.55rem", borderRadius: 6, display: "inline-block" },
  textMuted: { color: "#9CA3AF", fontSize: "0.8rem", fontStyle: "italic" },
  btnEdit: { background: "#EFF6FF", color: "#2563EB", border: "1px solid #BFDBFE", padding: "0.25rem 0.55rem", borderRadius: 4, fontWeight: 600, fontSize: "0.78rem", cursor: "pointer" },
  btnDelete: { background: "#FEF2F2", color: "#EF4444", border: "1px solid #FECACA", padding: "0.25rem 0.55rem", borderRadius: 4, fontWeight: 600, fontSize: "0.78rem", cursor: "pointer" },
  formCard: { background: "#FAF7F2", border: "1px solid #EAE3D2", borderRadius: 12, padding: "1.25rem" },
  formHeader: { fontSize: "0.92rem", fontWeight: 700, color: "#524328", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" },
  formHeaderIcon: { color: "#C29B38" },
  editingBadge: { marginLeft: "auto", fontSize: "0.75rem", background: "#FEF3C7", color: "#92400E", padding: "0.2rem 0.5rem", borderRadius: 4, fontWeight: 600 },
  formGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" },
  sectionBlock: { marginTop: "1.1rem", paddingTop: "0.85rem", borderTop: "1px dashed #E5D5BC" },
  sectionTitle: { fontSize: "0.82rem", fontWeight: 700, color: "#785E29", marginBottom: "0.75rem" },
  advancedSection: { marginTop: "1.1rem", paddingTop: "0.85rem", borderTop: "1px dashed #E5D5BC" },
  advancedGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1rem" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "0.3rem" },
  label: { fontSize: "0.8rem", fontWeight: 600, color: "#374151" },
  required: { color: "#EF4444" },
  fieldHint: { fontSize: "0.72rem", color: "#9CA3AF" },
  rangeInputs: { display: "flex", alignItems: "center", gap: "0.4rem" },
  rangeSep: { color: "#9CA3AF", fontWeight: "bold" },
  input: { width: "100%", height: 38, padding: "0 0.75rem", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: "0.85rem", outline: "none", background: "#FFFFFF", boxSizing: "border-box" },
  select: { width: "100%", height: 38, padding: "0 0.75rem", border: "1px solid #D1D5DB", borderRadius: 8, fontSize: "0.85rem", outline: "none", background: "#FFFFFF", boxSizing: "border-box", cursor: "pointer" },
  inputSuffixWrapper: { position: "relative", display: "flex", alignItems: "center", width: "100%" },
  suffix: { position: "absolute", right: 12, fontSize: "0.82rem", fontWeight: 600, color: "#6B7280", pointerEvents: "none" },
  formFooter: { marginTop: "1.25rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" },
  btnSubmit: { background: "#2563EB", color: "#FFFFFF", border: "none", height: 38, padding: "0 1.25rem", borderRadius: 8, fontWeight: 600, fontSize: "0.84rem", cursor: "pointer" },
  btnCancelEdit: { background: "#E5E7EB", color: "#374151", border: "none", height: 38, padding: "0 1rem", borderRadius: 8, fontWeight: 600, fontSize: "0.84rem", cursor: "pointer" },

  // Modal Styles
  modalOverlay: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  modalCard: { background: "#FFFFFF", padding: "1.25rem", borderRadius: 12, width: "90%", maxWidth: 400, boxShadow: "0 10px 25px rgba(0,0,0,0.15)" },
  modalTitle: { fontSize: "1rem", fontWeight: 700, color: "#1F2937", marginBottom: "0.5rem" },
  modalText: { fontSize: "0.85rem", color: "#4B5563", marginBottom: "1.25rem", lineHeight: 1.4 },
  modalActions: { display: "flex", justifyContent: "flex-end", gap: "0.6rem" },
  btnCancel: { background: "#F3F4F6", color: "#374151", border: "none", padding: "0.5rem 1rem", borderRadius: 6, fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" },
  btnConfirmDelete: { background: "#EF4444", color: "#FFFFFF", border: "none", padding: "0.5rem 1rem", borderRadius: 6, fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" },
};

export default PolicyDepositRules;