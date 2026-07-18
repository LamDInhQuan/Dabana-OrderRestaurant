import React, { useState } from "react";
import toast from "react-hot-toast";
import { reservationPolicyApi } from "../../../../../api";

const EMPTY_RULE = {
  minGuest: 1,
  maxGuest: "",
  depositType: "PER_PERSON",
  depositValue: "",
};

function PolicyDepositRules({ restaurantId, policyId, rules = [], onRefresh }) {
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
    <div style={{ marginTop: "1.5rem" }}>
      <div style={{ fontSize: ".75rem", fontWeight: 700, textTransform: "uppercase", color: "#8A8272", marginBottom: "0.75rem", letterSpacing: "0.5px" }}>
        Đặt cọc theo số khách
      </div>

      {rules.length === 0 ? (
        <div style={{ color: "#8A8272", fontSize: ".85rem", marginBottom: "1rem", fontStyle: "italic" }}>
          Chưa có quy tắc riêng theo số khách. Chính sách sẽ dùng mức đặt cọc mặc định ở trên.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: ".5rem", marginBottom: "1rem" }}>
          {rules.map((r) => (
            <div
              key={r.id}
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
                <b>{r.minGuest}–{r.maxGuest} khách</b>
                {"  →  "}
                <span style={{ color: "#C9A24B", fontWeight: 600 }}>
                  {r.depositType === "FIXED" || r.depositType === "PER_PERSON"
                    ? Number(r.depositValue).toLocaleString("vi-VN") + " ₫" + (r.depositType === "PER_PERSON" ? "/người" : "")
                    : r.depositValue + " %"}
                </span>
              </span>
              <button
                type="button"
                onClick={() => handleDelete(r.id)}
                style={{
                  border: "1px solid #FCA5A5",
                  background: "#FEF2F2",
                  color: "#DC2626",
                  borderRadius: 6,
                  padding: ".35rem .8rem",
                  fontSize: ".78rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                Xoá
              </button>
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
        <div style={{ flex: "1 1 70px", minWidth: "60px" }}>
          <label style={{ fontSize: ".75rem", display: "block", marginBottom: ".3rem", color: "#6B6353", fontWeight: 500 }}>Từ (khách)</label>
          <input
            type="number"
            min={1}
            value={form.minGuest}
            onChange={(e) => setForm((f) => ({ ...f, minGuest: e.target.value }))}
            style={{ width: "100%", padding: ".55rem .5rem", border: "1px solid #E7E1D3", borderRadius: 6, fontSize: ".85rem", outline: "none", background: "#fff" }}
          />
        </div>
        <div style={{ flex: "1 1 70px", minWidth: "60px" }}>
          <label style={{ fontSize: ".75rem", display: "block", marginBottom: ".3rem", color: "#6B6353", fontWeight: 500 }}>Đến (khách)</label>
          <input
            type="number"
            min={1}
            value={form.maxGuest}
            onChange={(e) => setForm((f) => ({ ...f, maxGuest: e.target.value }))}
            style={{ width: "100%", padding: ".55rem .5rem", border: "1px solid #E7E1D3", borderRadius: 6, fontSize: ".85rem", outline: "none", background: "#fff" }}
          />
        </div>
        <div style={{ flex: "2 1 140px", minWidth: "130px" }}>
          <label style={{ fontSize: ".75rem", display: "block", marginBottom: ".3rem", color: "#6B6353", fontWeight: 500 }}>Loại đặt cọc</label>
          <select
            value={form.depositType}
            onChange={(e) => setForm((f) => ({ ...f, depositType: e.target.value }))}
            style={{ width: "100%", padding: ".55rem .5rem", border: "1px solid #E7E1D3", borderRadius: 6, fontSize: ".85rem", outline: "none", background: "#fff", cursor: "pointer" }}
          >
            <option value="PER_PERSON">Theo người (₫/người)</option>
            <option value="FIXED">Số tiền cố định (₫)</option>
            <option value="PERCENT">Phần trăm (%)</option>
          </select>
        </div>
        <div style={{ flex: "1.5 1 100px", minWidth: "90px" }}>
          <label style={{ fontSize: ".75rem", display: "block", marginBottom: ".3rem", color: "#6B6353", fontWeight: 500 }}>Giá trị</label>
          <input
            type="number"
            min={0}
            value={form.depositValue}
            onChange={(e) => setForm((f) => ({ ...f, depositValue: e.target.value }))}
            style={{ width: "100%", padding: ".55rem .5rem", border: "1px solid #E7E1D3", borderRadius: 6, fontSize: ".85rem", outline: "none", background: "#fff" }}
          />
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

export default PolicyDepositRules;