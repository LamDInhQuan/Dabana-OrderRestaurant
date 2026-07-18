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

/**
 * Controlled component for PolicyApplyType: ALWAYS / DAY_OF_WEEK / DATE_RANGE
 *
 * Props:
 *  - applyType: "ALWAYS" | "DAY_OF_WEEK" | "DATE_RANGE"
 *  - onApplyTypeChange(type)
 *  - daysOfWeek: string[]  (subset of DAYS keys)
 *  - onDaysOfWeekChange(days)
 *  - dateFrom, dateTo: "YYYY-MM-DD"
 *  - onDateFromChange(v), onDateToChange(v)
 */
export default function PolicySchedule({
  applyType,
  onApplyTypeChange,
  daysOfWeek,
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

  const radioRow = [
    { value: "ALWAYS", label: "Luôn luôn" },
    { value: "DAY_OF_WEEK", label: "Theo thứ" },
    { value: "DATE_RANGE", label: "Theo khoảng ngày" },
  ];

  return (
    <div>
      <label style={S.label}>Kiểu áp dụng</label>

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
              onChange={() => onApplyTypeChange(opt.value)}
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
            />
          </div>
          <div>
            <label style={S.label}>Đến ngày</label>
            <input
              type="date"
              style={S.input}
              value={dateTo || ""}
              onChange={(e) => onDateToChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export { DAYS };