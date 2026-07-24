// src/reservation_policy/policyRestaurant/component/PolicyFormModal.jsx
import React, { useState, useEffect } from "react";
import { S } from "../../../../theme";

import PolicySchedule from "../../components/PolicySchedule";
import PolicyDepositRules from "../../components/PolicyDepositRules";
import PolicyDateSchedules from "../../components/PolicyDateSchedules";

// 💡 import file API của bạn (ví dụ: policyApi)
// import { policyApi } from "../../../../api/policyApi"; 
import axios from "axios"; 

const SCHEDULE_TYPES = [
  { value: "ALWAYS", label: "Áp dụng hàng ngày (Continuous)", desc: "Áp dụng cố định theo các khung giờ mỗi ngày" },
  { value: "DAY_OF_WEEK", label: "Theo thứ trong tuần (Weekly)", desc: "Áp dụng vào các ngày cố định (VD: Thứ 7, Chủ Nhật)" },
  { value: "DATE_RANGE", label: "Theo khoảng ngày / Lễ Tết (Date Range)", desc: "Áp dụng cho dịp đặc biệt (VD: 24/12 - 25/12)" },
];

function PolicyFormModal({ restaurantId, initialData, onSave, onClose, onRefresh }) {
  console.log("initialData", initialData);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

  // Extract handlers cho schedules
  const daysOfWeek = (formData.schedules || [])
    .map((s) => s.dayOfWeek)
    .filter((d) => d !== null && d !== undefined);

  const firstSchedule = formData.schedules?.[0] || {};
  const dateFrom = firstSchedule.dateFrom || "";
  const dateTo = firstSchedule.dateTo || "";

  const handleApplyTypeChange = (newType) => {
    setFormData((prev) => ({
      ...prev,
      scheduleType: newType,
      schedules: [],
    }));
  };

  const handleDaysOfWeekChange = (newDays) => {
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

  // 💡 HÀM XỬ LÝ SUBMIT CHÍNH (ĐÃ THÊM API CALL)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    // Chuẩn bị payload đúng DTO backend
    const payload = {
      ...formData,
      restaurantId: restaurantId,
    };

    try {
      if (onSave) {
        // Nếu component cha truyền hàm onSave vào, ủy quyền cho component cha
        await onSave(payload);
      } else {
        // Nếu chưa khai báo onSave ở ngoài, tự gọi API trực tiếp tại đây:
        if (formData.id) {
          // Cập nhật
          await axios.put(`/api/v1/restaurants/${restaurantId}/policies/${formData.id}`, payload);
        } else {
          // Tạo mới
          await axios.post(`/api/v1/restaurants/${restaurantId}/policies`, payload);
        }
      }

      if (onRefresh) onRefresh();
      if (onClose) onClose();

    } catch (err) {
      console.error("Lỗi khi lưu chính sách:", err);
      setErrorMsg(err.response?.data?.message || "Không thể lưu chính sách. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: "100%", boxSizing: "border-box" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
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

      {/* Hiển thị lỗi nếu bấm lưu bị crash API */}
      {errorMsg && (
        <div style={{ padding: "10px", background: "#FFEBE9", color: "#C00", borderRadius: "6px", marginBottom: "1rem" }}>
          {errorMsg}
        </div>
      )}

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

        {/* 2. CẤU HÌNH KIỂU ÁP DỤNG THỜI GIAN */}
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

        {/* 3. HIỂN THỊ KHUNG GIỜ CHI TIẾT (Chỉ hiển thị khi đã tạo policyId xong) */}
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

        {/* 4. QUY TẮC ĐẶT CỌC (Chỉ hiển thị khi đã tạo policyId xong) */}
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
            <button type="button" onClick={onClose} disabled={loading} style={S.btnSecondary}>
              Hủy
            </button>
          )}
          <button type="submit" disabled={loading} style={S.btnGold}>
            {loading ? "Đang xử lý..." : formData.id ? "Cập nhật chính sách" : "Lưu chính sách"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PolicyFormModal;