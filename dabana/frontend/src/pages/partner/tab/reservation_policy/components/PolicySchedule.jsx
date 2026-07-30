import React from "react";
import { C, S } from "../../../theme";

const DAYS = [
  { key: "MONDAY", label: "T2" },
  { key: "TUESDAY", label: "T3" },
  { key: "WEDNESDAY", label: "T4" },
  { key: "THURSDAY", label: "T5" },
  { key: "FRIDAY", label: "T6" },
  { key: "SATURDAY", label: "T7" },
  { key: "SUNDAY", label: "CN" },
];

export default function PolicySchedule({
  applyType,
  onApplyTypeChange,
  daysOfWeek = [], // Khởi tạo mảng rỗng mặc định để tránh lỗi .includes khi undefined
  onDaysOfWeekChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
}) {
  
  const toggleDay = (key) => {
    if (daysOfWeek.includes(key)) {
      onDaysOfWeekChange(daysOfWeek.filter((d) => d !== key));
    } else {
      onDaysOfWeekChange([...daysOfWeek, key]);
    }
  };

  // Tối ưu hàm đổi loại áp dụng: Clear sạch state không liên quan để tránh rác dữ liệu gửi lên Spring Boot
  const handleTypeChange = (newType) => {
    onApplyTypeChange(newType);
    if (newType === "ALWAYS") {
      onDaysOfWeekChange([]);
      onDateFromChange("");
      onDateToChange("");
    } else if (newType === "DAY_OF_WEEK") {
      onDateFromChange("");
      onDateToChange("");
    } else if (newType === "DATE_RANGE") {
      onDaysOfWeekChange([]);
    }
  };

  const radioRow = [
    { value: "ALWAYS", label: "Luôn luôn" },
    { value: "DAY_OF_WEEK", label: "Theo thứ" },
    { value: "DATE_RANGE", label: "Theo khoảng ngày" },
  ];

  return (
    <div>
      <label style={S.label}>Kiểu áp dụng lịch trình</label>

      <div style={{ display: "flex", gap: "1.5rem", marginBottom: "1rem" }}>
        {radioRow.map((opt) => (
          <label
            key={opt.value}
            style={{
              display: "flex",
              alignItems: "center",
              gap: ".4rem",
              fontSize: ".85rem",
              color: C.text,
              cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name="applyType"
              checked={applyType === opt.value}
              onChange={() => handleTypeChange(opt.value)} // Sử dụng hàm thay đổi an toàn mới
            />
            {opt.label}
          </label>
        ))}
      </div>

      {applyType === "DAY_OF_WEEK" && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: ".6rem",
            padding: "1rem",
            background: C.cream,
            border: `1px solid ${C.border}`,
            borderRadius: 4,
          }}
        >
          {DAYS.map((d) => (
            <label
              key={d.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: ".3rem",
                fontSize: ".82rem",
                color: C.text,
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={daysOfWeek.includes(d.key)}
                onChange={() => toggleDay(d.key)}
              />
              {d.label}
            </label>
          ))}
        </div>
      )}

      {applyType === "DATE_RANGE" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            padding: "1rem",
            background: C.cream,
            border: `1px solid ${C.border}`,
            borderRadius: 4,
          }}
        >
          <div>
            <label style={S.label}>Từ ngày</label>
            <input
              type="date"
              style={S.input}
              value={dateFrom || ""}
              onChange={(e) => onDateFromChange(e.target.value)}
              required={applyType === "DATE_RANGE"} // Bắt buộc nhập nếu đang mở Tab khoảng ngày
            />
          </div>
          <div>
            <label style={S.label}>Đến ngày</label>
            <input
              type="date"
              style={S.input}
              value={dateTo || ""}
              min={dateFrom || ""} // Chặn không cho chọn ngày kết thúc nhỏ hơn ngày bắt đầu
              onChange={(e) => onDateToChange(e.target.value)}
              required={applyType === "DATE_RANGE"}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export { DAYS };