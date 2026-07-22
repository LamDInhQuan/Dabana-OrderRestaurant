import React, { useState } from "react";
import toast from "react-hot-toast";
import { reservationPolicyApi } from "../../../../../api";

const EMPTY_SCHEDULE = { dateFrom: "", dateTo: "", status: "ACTIVE" };

function PolicyDateSchedules({ restaurantId, policyId, schedules = [], onRefresh }) {
  const [form, setForm] = useState(EMPTY_SCHEDULE);
  const [saving, setSaving] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.dateFrom || !form.dateTo) {
      toast.error("Chọn đủ ngày bắt đầu và kết thúc");
      return;
    }
    if (form.dateFrom > form.dateTo) {
      toast.error("Ngày bắt đầu phải trước ngày kết thúc");
      return;
    }
    try {
      setSaving(true);
      await reservationPolicyApi.createSchedule(restaurantId, policyId, form);
      toast.success("Đã thêm lịch áp dụng");
      setForm(EMPTY_SCHEDULE);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Lỗi tạo policy schedule:", err);
      toast.error("Không thể thêm lịch áp dụng!");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (scheduleId) => {
    if (!window.confirm("Xoá lịch áp dụng này?")) return;
    try {
      await reservationPolicyApi.removeSchedule(restaurantId, policyId, scheduleId);
      toast.success("Đã xoá");
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Lỗi xoá policy schedule:", err);
      toast.error("Không thể xoá lịch áp dụng!");
    }
  };

  return (
    <section style={ui.panel}>
      <header style={ui.panelHeader}>
        <div style={ui.panelHeaderLeft}>
          <span style={ui.panelIcon}>📅</span>
          <div>
            <div style={ui.panelTitle}>Lịch áp dụng chính sách (theo ngày)</div>
            <div style={ui.panelSubtitle}>
              Giới hạn khoảng ngày cụ thể để chính sách này có hiệu lực
            </div>
          </div>
        </div>
        <span style={ui.countPill}>{schedules.length} khoảng ngày</span>
      </header>

      {schedules.length === 0 ? (
        <div style={ui.emptyState}>
          <span style={{ fontSize: "1.4rem" }}>🗓️</span>
          <span>
            Chưa đặt khoảng ngày riêng — chính sách sẽ áp dụng theo lịch chi
            nhánh bên dưới.
          </span>
        </div>
      ) : (
        <div style={ui.rowList}>
          {schedules.map((s) => (
            <div key={s.id} style={ui.row}>
              <div style={ui.rowMain}>
                <span style={ui.datePill}>{s.dateFrom || "Hàng ngày"}</span>
                <span style={ui.arrow}>→</span>
                <span style={ui.datePill}>{s.dateTo || "Hàng ngày"}</span>
                {s.timeFrom && (
                  <span style={ui.timeText}>
                    {s.timeFrom.substring(0, 5)} – {s.timeTo.substring(0, 5)}
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: ".6rem" }}>
                <span
                  style={{
                    ...ui.statusBadge,
                    background: s.status === "ACTIVE" ? "#10B981" : "#9CA3AF",
                  }}
                >
                  {s.status === "ACTIVE" ? "Đang bật" : "Tắt"}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(s.id)}
                  style={ui.deleteBtn}
                  title="Xoá lịch"
                >
                  Xoá
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} style={ui.form}>
        <div style={ui.formGrid}>
          <div style={{ ...ui.field, flex: "1.6 1 140px" }}>
            <label style={ui.label}>Từ ngày</label>
            <input
              type="date"
              value={form.dateFrom}
              onChange={(e) => setForm((f) => ({ ...f, dateFrom: e.target.value }))}
              style={{ ...ui.input, cursor: "pointer" }}
            />
          </div>
          <div style={{ ...ui.field, flex: "1.6 1 140px" }}>
            <label style={ui.label}>Đến ngày</label>
            <input
              type="date"
              value={form.dateTo}
              onChange={(e) => setForm((f) => ({ ...f, dateTo: e.target.value }))}
              style={{ ...ui.input, cursor: "pointer" }}
            />
          </div>
          <div style={{ ...ui.field, flex: "1 1 110px" }}>
            <label style={ui.label}>Trạng thái</label>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              style={{ ...ui.input, cursor: "pointer" }}
            >
              <option value="ACTIVE">Đang bật</option>
              <option value="INACTIVE">Tắt</option>
            </select>
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
    flexWrap: "wrap",
    gap: ".5rem",
    padding: ".7rem .9rem",
    border: "1px solid #EFE9DB",
    borderRadius: 8,
    background: "#FEFDFB",
  },
  rowMain: { display: "flex", alignItems: "center", gap: ".55rem", flexWrap: "wrap" },
  datePill: {
    fontSize: ".78rem",
    fontWeight: 600,
    color: "#2E2A25",
    background: "#F1ECDF",
    borderRadius: 6,
    padding: ".25rem .55rem",
  },
  arrow: { color: "#C9BBA0", fontSize: ".85rem" },
  timeText: { fontSize: ".78rem", color: "#8A8272", marginLeft: ".25rem" },
  statusBadge: {
    fontSize: ".7rem",
    padding: ".25rem .6rem",
    borderRadius: 99,
    color: "#fff",
    fontWeight: 600,
  },
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
  field: { minWidth: "110px", display: "flex", flexDirection: "column" },
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

export default PolicyDateSchedules;