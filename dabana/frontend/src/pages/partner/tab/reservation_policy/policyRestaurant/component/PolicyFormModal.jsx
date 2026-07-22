// src/reservation_policy/policyRestaurant/component/PolicyFormModal.jsx
import React, { useState, useEffect } from "react";
import { S } from "../../../../theme";

// Import các sub-components
import PolicySchedule from "../../components/PolicySchedule";
import PolicyDepositRules from "../../components/PolicyDepositRules";
import PolicyDateSchedules from "../../components/PolicyDateSchedules";

const SCHEDULE_TYPES = [
  { value: "ALWAYS", label: "Áp dụng hàng ngày (Continuous)", desc: "Áp dụng cố định theo các khung giờ mỗi ngày" },
  { value: "DAY_OF_WEEK", label: "Theo thứ trong tuần (Weekly)", desc: "Áp dụng vào các ngày cố định (VD: Thứ 7, Chủ Nhật)" },
  { value: "DATE_RANGE", label: "Theo khoảng ngày / Lễ Tết (Date Range)", desc: "Áp dụng cho dịp đặc biệt (VD: 24/12 - 25/12)" },
];

function PolicyFormModal({ restaurantId, initialData, onSave, onClose, onRefresh }) {
  console.log("initialData", initialData);

  const [formData, setFormData] = useState({
    id: null,
    policyCode: "",
    name: "",
    description: "",
    termsAndConditions: "",
    scheduleType: "ALWAYS",
    status: "ACTIVE",
    schedules: [],
    depositRules: [],
  });

  // Đồng bộ state khi initialData thay đổi
  useEffect(() => {
    const rawData = initialData?.data ? initialData.data : initialData;

    if (rawData && rawData.id) {
      setFormData({
        id: rawData.id,
        policyCode: rawData.policyCode || "",
        name: rawData.name || "",
        description: rawData.description || "",
        termsAndConditions: rawData.termsAndConditions || "",
        scheduleType: rawData.scheduleType || rawData.policyScheduleType || "ALWAYS",
        status: rawData.status || "ACTIVE",
        schedules: rawData.schedules || [],
        depositRules: rawData.depositRules || [],
      });
    } else {
      setFormData({
        id: null,
        policyCode: "",
        name: "",
        description: "",
        termsAndConditions: "",
        scheduleType: "ALWAYS",
        status: "ACTIVE",
        schedules: [],
        depositRules: [],
      });
    }
  }, [initialData]);

  // --- CÁC HÀM CONVERT DỮ LIỆU ĐỂ TRUYỀN VÀO POLICY SCHEDULE ---
  // Extract mảng dayOfWeek từ schedules: VD [6, 7]
  const daysOfWeek = (formData.schedules || [])
    .map((s) => s.dayOfWeek)
    .filter((d) => d !== null && d !== undefined);

  // Extract dateFrom, dateTo từ schedule đầu tiên (nếu có)
  const firstSchedule = formData.schedules?.[0] || {};
  const dateFrom = firstSchedule.dateFrom || "";
  const dateTo = firstSchedule.dateTo || "";

  // Handlers cho PolicySchedule
  const handleApplyTypeChange = (newType) => {
    setFormData((prev) => ({
      ...prev,
      scheduleType: newType,
      schedules: [], // Reset lại danh sách khi đổi type
    }));
  };

  const handleDaysOfWeekChange = (newDays) => {
    // Map mảng các thứ thành danh sách object schedules
    const updatedSchedules = newDays.map((day) => ({
      policyId: formData.id,
      dayOfWeek: day,
      dateFrom: null,
      dateTo: null,
      timeFrom: "17:00:00",
      timeTo: "22:00:00",
      status: "ACTIVE",
    }));

    setFormData((prev) => ({ ...prev, schedules: updatedSchedules }));
  };

  const handleDateFromChange = (newDateFrom) => {
    const currentSchedules = formData.schedules?.length > 0 ? [...formData.schedules] : [{}];
    currentSchedules[0] = {
      ...currentSchedules[0],
      policyId: formData.id,
      dateFrom: newDateFrom,
      dateTo: currentSchedules[0]?.dateTo || null,
      timeFrom: currentSchedules[0]?.timeFrom || "08:00:00",
      timeTo: currentSchedules[0]?.timeTo || "22:00:00",
      status: "ACTIVE",
    };
    setFormData((prev) => ({ ...prev, schedules: currentSchedules }));
  };

  const handleDateToChange = (newDateTo) => {
    const currentSchedules = formData.schedules?.length > 0 ? [...formData.schedules] : [{}];
    currentSchedules[0] = {
      ...currentSchedules[0],
      policyId: formData.id,
      dateFrom: currentSchedules[0]?.dateFrom || null,
      dateTo: newDateTo,
      timeFrom: currentSchedules[0]?.timeFrom || "08:00:00",
      timeTo: currentSchedules[0]?.timeTo || "22:00:00",
      status: "ACTIVE",
    };
    setFormData((prev) => ({ ...prev, schedules: currentSchedules }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      {/* Header Modal / Form */}
      <div
        style={{
          display: "flex",
          justify: "space-between",
          alignItems: "center",
          marginBottom: "1.2rem",
          borderBottom: "1px solid #ECE4D3",
          paddingBottom: ".8rem",
        }}
      >
        <h3 style={{ color: "#2E2A25", margin: 0, fontSize: "1.2rem", fontWeight: 700 }}>
          {formData.id ? `Chi tiết chính sách: ${formData.name}` : "Tạo chính sách khung mới"}
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            type="button"
            style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#8A8272" }}
          >
            ✕
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
        {/* 1. Mã Code & Tên Chính Sách */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
          <div>
            <label style={S.label}>Mã chính sách *</label>
            <input
              type="text"
              required
              value={formData.policyCode}
              onChange={(e) => setFormData({ ...formData, policyCode: e.target.value.toUpperCase() })}
              placeholder="VD: WEEKEND"
              style={{ ...S.input, width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={S.label}>Tên chính sách *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="VD: Cuối tuần"
              style={{ ...S.input, width: "100%", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {/* Mô tả & Điều khoản */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label style={S.label}>Mô tả chính sách</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ ...S.input, width: "100%", boxSizing: "border-box" }}
            />
          </div>
          <div>
            <label style={S.label}>Điều khoản & Điều kiện</label>
            <input
              type="text"
              value={formData.termsAndConditions}
              onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
              style={{ ...S.input, width: "100%", boxSizing: "border-box" }}
            />
          </div>
        </div>

        {/* 2. CẤU HÌNH KIỂU ÁP DỤNG THỜI GIAN (MAP ĐÚNG PROPS CỦA PolicySchedule) */}
        <div style={{ borderTop: "1px solid #ECE4D3", paddingTop: "1rem" }}>
          <PolicySchedule
            applyType={formData.scheduleType}
            onApplyTypeChange={handleApplyTypeChange}
            daysOfWeek={daysOfWeek}
            onDaysOfWeekChange={handleDaysOfWeekChange}
            dateFrom={dateFrom}
            onDateFromChange={handleDateFromChange}
            dateTo={dateTo}
            onDateToChange={handleDateToChange}
          />
        </div>

        {/* 3. HIỂN THỊ KHUNG GIỜ CHI TIẾT (Nếu đã có policyId) */}
        {formData.id && (
          <div style={{ borderTop: "1px solid #ECE4D3", paddingTop: "1rem" }}>
            <PolicyDateSchedules
              restaurantId={restaurantId}
              policyId={formData.id}
              schedules={formData.schedules}
              onRefresh={onRefresh}
            />
          </div>
        )}

        {/* 4. QUY TẮC ĐẶT CỌC (MAP ĐÚNG PROPS rules CHO PolicyDepositRules) */}
        {formData.id && (
          <div style={{ borderTop: "1px solid #ECE4D3", paddingTop: "1rem" }}>
            <PolicyDepositRules
              restaurantId={restaurantId}
              policyId={formData.id}
              rules={formData.depositRules}
              onRefresh={onRefresh}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: ".8rem", marginTop: "1rem" }}>
          {onClose && (
            <button type="button" onClick={onClose} style={S.btnSecondary}>
              Hủy
            </button>
          )}
          <button type="submit" style={S.btnGold}>
            {formData.id ? "Cập nhật chính sách" : "Lưu chính sách"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PolicyFormModal;