import React, { useState } from "react";
import toast from "react-hot-toast";
import { reservationPolicyApi } from "../../../../../api";

const EMPTY_SCHEDULE = { dateFrom: "", dateTo: "", status: "ACTIVE" };

function statusLabel(s) {
  return s === "ACTIVE" ? "Đang bật" : "Tắt";
}

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
    <div style={{ marginTop: "1.5rem" }}>
      <div style={{ fontSize: ".75rem", fontWeight: 700, textTransform: "uppercase", color: "#8A8272", marginBottom: "0.75rem", letterSpacing: "0.5px" }}>
        Lịch áp dụng chính sách (theo ngày)
      </div>

      {schedules.length === 0 ? (
        <div style={{ color: "#8A8272", fontSize: ".85rem", marginBottom: "1rem", fontStyle: "italic" }}>
          Chưa đặt khoảng ngày riêng — chính sách áp dụng theo lịch chi nhánh bên dưới.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: ".5rem", marginBottom: "1rem" }}>
          {schedules.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: ".75rem 1rem",
                border: "1px solid #E7E1D3",
                borderRadius: 6,
                fontSize: ".85rem",
                background: "#fff"
              }}
            >
              <span style={{ color: "#2E2A25" }}>
                <b>{s.dateFrom || "Hàng ngày"}</b> → <b>{s.dateTo || "Hàng ngày"}</b>
                {s.timeFrom && ` (${s.timeFrom.substring(0,5)} - ${s.timeTo.substring(0,5)})`}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                <span
                  style={{
                    fontSize: ".72rem",
                    padding: ".2rem .6rem",
                    borderRadius: 99,
                    background: s.status === "ACTIVE" ? "#10B981" : "#9CA3AF",
                    color: "#fff",
                    fontWeight: 600
                  }}
                >
                  {statusLabel(s.status)}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(s.id)}
                  style={{
                    border: "1px solid #FCA5A5",
                    background: "#FEF2F2",
                    color: "#DC2626",
                    borderRadius: 6,
                    padding: ".35rem .8rem",
                    fontSize: ".78rem",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Xoá
                </button>
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 🟢 Tối ưu lại layout form tránh nhảy hàng lung tung */}
      <form
        onSubmit={handleAdd}
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "0.75rem",
          alignItems: "flex-end",
          padding: "1.25rem",
          background: "#FBF7EE",
          border: "1px solid #E7E1D3",
          borderRadius: 8,
        }}
      >
        <div style={{ flex: "2 1 130px", minWidth: "120px" }}>
          <label style={{ fontSize: ".75rem", display: "block", marginBottom: ".3rem", color: "#6B6353", fontWeight: 500 }}>Từ ngày</label>
          <input
            type="date"
            value={form.dateFrom}
            onChange={(e) => setForm((f) => ({ ...f, dateFrom: e.target.value }))}
            style={{ width: "100%", padding: ".45rem .5rem", border: "1px solid #E7E1D3", borderRadius: 6, fontSize: ".85rem", outline: "none", background: "#fff", cursor: "pointer" }}
          />
        </div>
        <div style={{ flex: "2 1 130px", minWidth: "120px" }}>
          <label style={{ fontSize: ".75rem", display: "block", marginBottom: ".3rem", color: "#6B6353", fontWeight: 500 }}>Đến ngày</label>
          <input
            type="date"
            value={form.dateTo}
            onChange={(e) => setForm((f) => ({ ...f, dateTo: e.target.value }))}
            style={{ width: "100%", padding: ".45rem .5rem", border: "1px solid #E7E1D3", borderRadius: 6, fontSize: ".85rem", outline: "none", background: "#fff", cursor: "pointer" }}
          />
        </div>
        <div style={{ flex: "1.5 1 100px", minWidth: "90px" }}>
          <label style={{ fontSize: ".75rem", display: "block", marginBottom: ".3rem", color: "#6B6353", fontWeight: 500 }}>Trạng thái</label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            style={{ width: "100%", padding: ".55rem .5rem", border: "1px solid #E7E1D3", borderRadius: 6, fontSize: ".85rem", outline: "none", background: "#fff", cursor: "pointer" }}
          >
            <option value="ACTIVE">Đang bật</option>
            <option value="INACTIVE">Tắt</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={saving}
          style={{
            flex: "0 0 auto",
            padding: ".55rem 1.25rem",
            background: "#C9A24B",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
            fontSize: ".85rem",
            cursor: saving ? "not-allowed" : "pointer",
            opacity: saving ? 0.6 : 1,
            height: "38px"
          }}
        >
          {saving ? "Đang lưu..." : "+ Thêm"}
        </button>
      </form>
    </div>
  );
}

export default PolicyDateSchedules;