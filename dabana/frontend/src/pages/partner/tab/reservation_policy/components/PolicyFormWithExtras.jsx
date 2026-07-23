// src/reservation_policy/components/PolicyFormWithExtras.jsx
import React from "react";
import PolicyForm from "./PolicyForm";
import PolicySchedule from "./PolicySchedule";
import PolicyDepositRules from "./PolicyDepositRules";
import PolicyDateSchedules from "./PolicyDateSchedules";

export default function PolicyFormWithExtras({
  restaurantId,
  policy = {},
  onChange,
  onSubmit,
  onCancel,
  onRefresh,
}) {
  // Helper map scheduleType hiện tại
  const scheduleType = policy.scheduleType || policy.policyScheduleType || "ALWAYS";

  // 1. CHUYỂN ĐỔI DATA SCHEDULE TỪ API CHUẨN SANG PROPS CỦA PolicySchedule
  // Extract mảng thứ từ backend (VD: [6, 7] từ mảng schedules)
  const daysOfWeek = (policy.schedules || [])
    .map((s) => s.dayOfWeek)
    .filter((d) => d !== null && d !== undefined);

  // Extract dateFrom, dateTo nếu là loại DATE_RANGE
  const firstSchedule = policy.schedules?.[0] || {};
  const dateFrom = firstSchedule.dateFrom || "";
  const dateTo = firstSchedule.dateTo || "";

  // 2. HANDLERS ĐỒNG BỘ DỮ LIỆU TỪ PolicySchedule VÀO OBJECT POLICY
  const handleApplyTypeChange = (newType) => {
    onChange({
      ...policy,
      scheduleType: newType,
      policyScheduleType: newType,
      schedules: [], // Reset schedule khi đổi loại
    });
  };

  const handleDaysOfWeekChange = (newDays) => {
    // Convert danh sách các thứ [6, 7] thành mảng schedules theo format Backend
    const updatedSchedules = newDays.map((day) => ({
      policyId: policy.id,
      dayOfWeek: day,
      dateFrom: null,
      dateTo: null,
      timeFrom: "17:00:00",
      timeTo: "22:00:00",
      status: "ACTIVE",
    }));

    onChange({
      ...policy,
      schedules: updatedSchedules,
    });
  };

  const handleDateFromChange = (newDateFrom) => {
    const currentSchedules = policy.schedules?.length > 0 ? [...policy.schedules] : [{}];
    currentSchedules[0] = {
      ...currentSchedules[0],
      policyId: policy.id,
      dateFrom: newDateFrom,
      dateTo: currentSchedules[0]?.dateTo || null,
      timeFrom: currentSchedules[0]?.timeFrom || "08:00:00",
      timeTo: currentSchedules[0]?.timeTo || "22:00:00",
      status: "ACTIVE",
    };

    onChange({
      ...policy,
      schedules: currentSchedules,
    });
  };

  const handleDateToChange = (newDateTo) => {
    const currentSchedules = policy.schedules?.length > 0 ? [...policy.schedules] : [{}];
    currentSchedules[0] = {
      ...currentSchedules[0],
      policyId: policy.id,
      dateFrom: currentSchedules[0]?.dateFrom || null,
      dateTo: newDateTo,
      timeFrom: currentSchedules[0]?.timeFrom || "08:00:00",
      timeTo: currentSchedules[0]?.timeTo || "22:00:00",
      status: "ACTIVE",
    };

    onChange({
      ...policy,
      schedules: currentSchedules,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem", width: "100%" }}>
      {/* 1. FORM CHÍNH (Tên, Mã, Mô tả, Điều khoản...) */}
      <PolicyForm
        policy={policy}
        onChange={onChange}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />

      {/* 2. CẤU HÌNH LOẠI LỊCH (PolicySchedule) */}
      <div style={{ borderTop: "1px solid #ECE4D3", paddingTop: "1.25rem" }}>
        <h4 style={{ margin: "0 0 1rem 0", color: "#2E2A25", fontSize: "1rem" }}>
          Khung thời gian áp dụng
        </h4>
        <PolicySchedule
          applyType={scheduleType}
          onApplyTypeChange={handleApplyTypeChange}
          daysOfWeek={daysOfWeek}
          onDaysOfWeekChange={handleDaysOfWeekChange}
          dateFrom={dateFrom}
          onDateFromChange={handleDateFromChange}
          dateTo={dateTo}
          onDateToChange={handleDateToChange}
        />
      </div>

      {/* 3. MỐC GIỜ CHI TIẾT THEO NGÀY (Nếu đã có Policy ID từ Backend) */}
      {policy.id && (
        <div style={{ borderTop: "1px solid #ECE4D3", paddingTop: "1.25rem" }}>
          <PolicyDateSchedules
            restaurantId={restaurantId}
            policyId={policy.id}
            schedules={policy.schedules || []}
            onRefresh={onRefresh}
          />
        </div>
      )}

      {/* 4. QUY TẮC ĐẶT CỌC (PolicyDepositRules) */}
      {policy.id && (
        <div style={{ borderTop: "1px solid #ECE4D3", paddingTop: "1.25rem" }}>
          <PolicyDepositRules
            restaurantId={restaurantId}
            policyId={policy.id}
            rules={policy.depositRules || []}
            onRefresh={onRefresh}
          />
        </div>
      )}
    </div>
  );
}