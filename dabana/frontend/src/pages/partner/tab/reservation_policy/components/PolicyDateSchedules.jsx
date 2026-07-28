import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import { reservationPolicyApi } from "../../../../../api";

const EMPTY_FORM = {
  id: null,
  dayOfWeek: "",
  dateFrom: "",
  dateTo: "",
  timeFrom: "",
  timeTo: "",
  status: "ACTIVE",
};

const DAY_OPTIONS = [
  { value: 1, label: "Thứ 2" },
  { value: 2, label: "Thứ 3" },
  { value: 3, label: "Thứ 4" },
  { value: 4, label: "Thứ 5" },
  { value: 5, label: "Thứ 6" },
  { value: 6, label: "Thứ 7" },
  { value: 7, label: "Chủ nhật" },
];

// Helper Formatters
const formatTimeVN = (timeStr) => {
  if (!timeStr) return "";
  const [hStr, mStr] = timeStr.split(":");
  const hour = parseInt(hStr, 10);
  const min = mStr || "00";

  let period = "Sáng";
  if (hour >= 12 && hour < 18) period = "Chiều";
  else if (hour >= 18) period = "Tối";
  else if (hour < 5) period = "Đêm";

  return `${hStr}:${min} (${period})`;
};

const formatDateVN = (dateStr) => {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
};

const formatDateRangeDisplay = (dateFrom, dateTo) => {
  if (!dateFrom && !dateTo) return "Tất cả các ngày";
  if (dateFrom && !dateTo) return `Từ ${formatDateVN(dateFrom)}`;
  if (!dateFrom && dateTo) return `Đến ${formatDateVN(dateTo)}`;

  const [y1, m1, d1] = dateFrom.split("-");
  const [y2, m2, d2] = dateTo.split("-");

  if (y1 === y2) return `${d1}/${m1} - ${d2}/${m2}/${y2}`;
  return `${d1}/${m1}/${y1} - ${d2}/${m2}/${y2}`;
};

// Custom Time Select Component (Đã sửa logic ánh xạ 12h / 24h chính xác)
function CustomTimeSelect({ value, onChange, placeholder = "Cả ngày", disabled = false }) {
  const parseVal = (valStr) => {
    if (!valStr) return { hour: "", minute: "00", session: "SA" };
    const [h, m] = valStr.split(":");
    const hNum = parseInt(h, 10);
    const mStr = m ? m.substring(0, 2) : "00";

    let session = "SA";
    let h12 = hNum;

    if (hNum === 0) {
      h12 = 12;
      session = "SA";
    } else if (hNum === 12) {
      h12 = 12;
      session = "CHIEU";
    } else if (hNum > 12 && hNum < 18) {
      h12 = hNum - 12;
      session = "CHIEU";
    } else if (hNum >= 18) {
      h12 = hNum - 12;
      session = "TOI";
    } else {
      h12 = hNum;
      session = "SA";
    }

    return {
      hour: String(h12).padStart(2, "0"),
      minute: mStr,
      session,
    };
  };

  const emitTime = (h12Str, mStr, sStr) => {
    if (!h12Str) {
      onChange("");
      return;
    }
    let h = parseInt(h12Str, 10);

    if (sStr === "SA") {
      if (h === 12) h = 0;
    } else if (sStr === "CHIEU") {
      if (h < 12) h += 12; // 12h chiều giữ nguyên 12, từ 1-11 cộng 12 thành 13-23
    } else if (sStr === "TOI") {
      if (h < 12) h += 12;
    }

    const formattedH = String(h).padStart(2, "0");
    const formattedM = String(mStr || "00").padStart(2, "0");
    onChange(`${formattedH}:${formattedM}`);
  };

  const { hour, minute, session } = parseVal(value);

  return (
    <div style={{ display: "flex", gap: "2px", alignItems: "center" }}>
      <select
        value={hour}
        disabled={disabled}
        onChange={(e) => {
          if (!e.target.value) onChange("");
          else emitTime(e.target.value, minute || "00", session);
        }}
        style={ui.input}
      >
        <option value="">-- {placeholder} --</option>
        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => {
          const val = String(h).padStart(2, "0");
          return (
            <option key={val} value={val}>
              {val} giờ
            </option>
          );
        })}
      </select>

      {hour && (
        <>
          <select
            value={minute}
            disabled={disabled}
            onChange={(e) => emitTime(hour, e.target.value, session)}
            style={ui.input}
          >
            {["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"].map((m) => (
              <option key={m} value={m}>
                {m}m
              </option>
            ))}
          </select>

          <select
            value={session}
            disabled={disabled}
            onChange={(e) => emitTime(hour, minute, e.target.value)}
            style={{ ...ui.input, fontWeight: 700, color: "#C9A24B" }}
          >
            <option value="SA">Sáng</option>
            <option value="CHIEU">Chiều</option>
            <option value="TOI">Tối</option>
          </select>
        </>
      )}
    </div>
  );
}

// MAIN COMPONENT
function PolicyDateSchedules({
  restaurantId,
  policyId,
  scheduleType = "ALWAYS",
  schedules = [],
  onRefresh,
  readOnly = false,
}) {
  console.log("scheduleType", scheduleType);

  const [items, setItems] = useState(schedules);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteId, setDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isEditing = Boolean(form.id);

  useEffect(() => {
    setItems(schedules);
  }, [schedules]);

  useEffect(() => {
    setForm(EMPTY_FORM);
  }, [policyId, scheduleType]);

  const isAlwaysFull = scheduleType === "ALWAYS" && items.length >= 1;
  const shouldHideForm = readOnly || (!isEditing && isAlwaysFull);

  const groupedSchedules = useMemo(() => {
    if (scheduleType !== "DATE_RANGE") return null;

    const sorted = [...items].sort((a, b) => {
      const d1 = a.dateFrom || "0000-00-00";
      const d2 = b.dateFrom || "0000-00-00";
      return d1.localeCompare(d2);
    });

    const groups = {};
    sorted.forEach((item) => {
      let yearGroup = "Tất cả các năm";
      if (item.dateFrom && item.dateFrom.includes("-")) {
        yearGroup = `NĂM ${item.dateFrom.split("-")[0]}`;
      } else if (item.dateTo && item.dateTo.includes("-")) {
        yearGroup = `NĂM ${item.dateTo.split("-")[0]}`;
      }

      if (!groups[yearGroup]) groups[yearGroup] = [];
      groups[yearGroup].push(item);
    });

    return groups;
  }, [items, scheduleType]);

  const sortedItems = useMemo(() => {
    if (scheduleType === "DATE_RANGE") return [];
    return [...items].sort((a, b) => (Number(a.dayOfWeek) || 0) - (Number(b.dayOfWeek) || 0));
  }, [items, scheduleType]);

  const existingDays = items
    .map((s) => Number(s.dayOfWeek))
    .filter((day) => !isNaN(day) && day > 0);

  const availableDayOptions = DAY_OPTIONS.filter(
    (opt) => !existingDays.includes(opt.value) || (isEditing && Number(form.dayOfWeek) === opt.value)
  );

  const handleResetForm = () => setForm(EMPTY_FORM);

  const handleEditClick = (schedule) => {
    if (readOnly) return;
    setForm({
      id: schedule.id,
      dayOfWeek: schedule.dayOfWeek ?? "",
      dateFrom: schedule.dateFrom ?? "",
      dateTo: schedule.dateTo ?? "",
      timeFrom: schedule.timeFrom ? schedule.timeFrom.substring(0, 5) : "",
      timeTo: schedule.timeTo ? schedule.timeTo.substring(0, 5) : "",
      status: schedule.status || "ACTIVE",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (readOnly) return;

    if (!restaurantId || !policyId) {
      toast.error("Thiếu thông tin nhà hàng hoặc chính sách!");
      return;
    }

    if (scheduleType === "DAY_OF_WEEK" && !form.dayOfWeek) {
      toast.error("Vui lòng chọn Thứ trong tuần");
      return;
    }

    if (scheduleType === "DATE_RANGE") {
      if (!form.dateFrom || !form.dateTo) {
        toast.error("Vui lòng chọn đủ Từ ngày và Đến ngày");
        return;
      }
      if (form.dateFrom > form.dateTo) {
        toast.error("Ngày bắt đầu không được lớn hơn ngày kết thúc");
        return;
      }
    }

    // ✅ ĐOẠN CODE MỚI (CHUẨN XÁC THEO SỐ PHÚT)
    if ((form.timeFrom && !form.timeTo) || (!form.timeFrom && form.timeTo)) {
      toast.error("Vui lòng chọn đầy đủ cả Giờ mở và Giờ đóng");
      return;
    }

    if (form.timeFrom && form.timeTo) {
      const [hFrom, mFrom] = form.timeFrom.split(":").map(Number);
      const [hTo, mTo] = form.timeTo.split(":").map(Number);

      const totalMinutesFrom = hFrom * 60 + mFrom;
      const totalMinutesTo = hTo * 60 + mTo;

      if (totalMinutesFrom >= totalMinutesTo) {
        toast.error("Giờ mở phải nhỏ hơn giờ đóng");
        return;
      }
    }

    const payload = {
      dayOfWeek: scheduleType === "DAY_OF_WEEK" ? Number(form.dayOfWeek) : null,
      dateFrom: scheduleType === "DATE_RANGE" ? form.dateFrom || null : null,
      dateTo: scheduleType === "DATE_RANGE" ? form.dateTo || null : null,
      timeFrom: form.timeFrom ? `${form.timeFrom}:00` : null,
      timeTo: form.timeTo ? `${form.timeTo}:00` : null,
      status: form.status,
    };

    try {
      setSaving(true);
      if (isEditing) {
        await reservationPolicyApi.updateSchedule(restaurantId, policyId, form.id, payload);
        toast.success("Đã cập nhật lịch áp dụng");
      } else {
        await reservationPolicyApi.createSchedule(restaurantId, policyId, payload);
        toast.success("Đã thêm lịch áp dụng");
      }

      handleResetForm();
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error("Lỗi lưu policy schedule:", err);
      toast.error(err?.response?.data?.message || "Thao tác thất bại!");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (readOnly || !deleteId) return;

    try {
      setDeleting(true);
      await reservationPolicyApi.deleteSchedule(restaurantId, policyId, deleteId);
      toast.success("Đã xoá lịch áp dụng");
      if (form.id === deleteId) handleResetForm();
      if (onRefresh) await onRefresh();
    } catch (err) {
      console.error("Lỗi xoá schedule:", err);
      toast.error("Không thể xoá lịch áp dụng!");
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  const renderItemCard = (s) => {
    const isSel = form.id === s.id;
    const hasTime = s.timeFrom && s.timeTo;

    const dayObj = DAY_OPTIONS.find((d) => d.value === Number(s.dayOfWeek));
    const dayLabel = dayObj ? dayObj.label : s.dayOfWeek ? `Thứ ${s.dayOfWeek}` : "";

    return (
      <div key={s.id} style={{ ...ui.row, ...(isSel ? ui.rowEditing : {}) }}>
        <div style={ui.rowMain}>
          {scheduleType === "DAY_OF_WEEK" && dayLabel && (
            <span style={ui.dayTag}>{dayLabel}</span>
          )}

          {scheduleType === "DATE_RANGE" && (
            <span style={ui.dateText}>📅 {formatDateRangeDisplay(s.dateFrom, s.dateTo)}</span>
          )}

          {hasTime ? (
            <span style={ui.timeText}>
              ⏰ {formatTimeVN(s.timeFrom)} - {formatTimeVN(s.timeTo)}
            </span>
          ) : (
            <span style={ui.allDayTag}>⏰ Cả ngày</span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
          <span
            style={{
              ...ui.statusBadge,
              background: s.status === "ACTIVE" ? "#10B981" : "#9CA3AF",
            }}
          >
            {s.status === "ACTIVE" ? "Đang bật" : "Tắt"}
          </span>

          {!readOnly && (
            <>
              <button type="button" onClick={() => handleEditClick(s)} style={ui.editBtn}>
                Sửa
              </button>
              <button type="button" onClick={() => setDeleteId(s.id)} style={ui.deleteBtn}>
                Xoá
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <section style={ui.panel}>
      <header style={ui.panelHeader}>
        <div style={ui.panelHeaderLeft}>
          <span style={ui.panelIcon}>📅</span>
          <div>
            <div style={ui.panelTitle}>
              Lịch áp dụng {scheduleType === "ALWAYS" ? "(Luôn luôn)" : scheduleType === "DAY_OF_WEEK" ? "(Theo thứ)" : "(Theo khoảng ngày / sự kiện)"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
          {readOnly && <span style={ui.readOnlyBadge}>👁️ Chỉ xem</span>}
          <span style={ui.countPill}>{items.length} bản ghi</span>
        </div>
      </header>

      {items.length === 0 ? (
        <div style={ui.emptyState}>Chưa có lịch nào được thiết lập.</div>
      ) : scheduleType === "DATE_RANGE" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: readOnly ? 0 : "1rem" }}>
          {Object.keys(groupedSchedules || {}).map((groupTitle) => (
            <div key={groupTitle} style={ui.yearGroup}>
              <div style={ui.yearHeader}>{groupTitle}</div>
              <div style={ui.rowList}>
                {groupedSchedules[groupTitle].map((s) => renderItemCard(s))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ ...ui.rowList, marginBottom: readOnly ? 0 : "1rem" }}>
          {sortedItems.map((s) => renderItemCard(s))}
        </div>
      )}

      {!readOnly && (
        <>
          {shouldHideForm ? (
            <div style={ui.fullNotice}>
              💡 Lịch cố định (Luôn luôn) chỉ cần 1 cấu hình chung. Bấm <b>"Sửa"</b> ở bản ghi trên nếu bạn muốn thay đổi.
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={ui.form}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".75rem" }}>
                <span style={{ fontSize: ".82rem", fontWeight: 700, color: "#4B5563" }}>
                  {isEditing ? "✏️ Chỉnh sửa lịch áp dụng" : "➕ Thêm lịch áp dụng mới"}
                </span>
                <span style={{ fontSize: ".72rem", color: "#6B7280", fontStyle: "italic" }}>
                  💡 Mẹo: Bỏ trống khung giờ nếu muốn áp dụng <b>Cả ngày</b>
                </span>
              </div>

              <div style={ui.formGrid}>
                {scheduleType === "DAY_OF_WEEK" && (
                  <div style={{ ...ui.field, flex: "1.2 1 130px" }}>
                    <label style={ui.label}>Chọn Thứ *</label>
                    <select
                      value={form.dayOfWeek}
                      onChange={(e) => setForm((f) => ({ ...f, dayOfWeek: e.target.value }))}
                      style={ui.input}
                    >
                      <option value="">-- Chọn Thứ --</option>
                      {availableDayOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {scheduleType === "DATE_RANGE" && (
                  <>
                    <div style={{ ...ui.field, flex: "1.2 1 125px" }}>
                      <label style={ui.label}>Từ ngày *</label>
                      <input
                        type="date"
                        value={form.dateFrom}
                        onChange={(e) => setForm((f) => ({ ...f, dateFrom: e.target.value }))}
                        style={ui.input}
                      />
                    </div>

                    <div style={{ ...ui.field, flex: "1.2 1 125px" }}>
                      <label style={ui.label}>Đến ngày *</label>
                      <input
                        type="date"
                        value={form.dateTo}
                        onChange={(e) => setForm((f) => ({ ...f, dateTo: e.target.value }))}
                        style={ui.input}
                      />
                    </div>
                  </>
                )}

                <div style={{ ...ui.field, flex: "1.8 1 160px" }}>
                  <label style={ui.label}>Giờ mở</label>
                  <CustomTimeSelect
                    value={form.timeFrom}
                    onChange={(val) => setForm((f) => ({ ...f, timeFrom: val }))}
                    placeholder="Cả ngày"
                  />
                </div>

                <div style={{ ...ui.field, flex: "1.8 1 160px" }}>
                  <label style={ui.label}>Giờ đóng</label>
                  <CustomTimeSelect
                    value={form.timeTo}
                    onChange={(val) => setForm((f) => ({ ...f, timeTo: val }))}
                    placeholder="Cả ngày"
                  />
                </div>

                <div style={{ ...ui.field, flex: "1 1 90px" }}>
                  <label style={ui.label}>Trạng thái</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    style={ui.input}
                  >
                    <option value="ACTIVE">Bật</option>
                    <option value="INACTIVE">Tắt</option>
                  </select>
                </div>

                <div style={{ display: "flex", gap: ".4rem", alignSelf: "flex-end" }}>
                  <button type="submit" disabled={saving} style={ui.addBtn}>
                    {saving ? "..." : isEditing ? "Cập nhật" : "+ Thêm"}
                  </button>

                  {isEditing && (
                    <button type="button" onClick={handleResetForm} style={ui.cancelBtn}>
                      Hủy
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}
        </>
      )}

      {!readOnly && deleteId && (
        <div style={ui.modalOverlay}>
          <div style={ui.modalCard}>
            <div style={ui.modalIcon}>⚠️</div>
            <h4 style={ui.modalTitle}>Xác nhận xóa lịch áp dụng</h4>
            <p style={ui.modalBody}>
              Bạn có chắc chắn muốn xóa cấu hình lịch áp dụng này không? Thao tác này không thể hoàn tác.
            </p>
            <div style={ui.modalActions}>
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
                style={ui.modalCancelBtn}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                style={ui.modalConfirmBtn}
              >
                {deleting ? "Đang xóa..." : "Xóa ngay"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

const ui = {
  panel: { background: "#fff", border: "1px solid #ECE4D3", borderRadius: 12, padding: "1.25rem", position: "relative" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", paddingBottom: ".75rem", borderBottom: "1px solid #F1ECDF" },
  panelHeaderLeft: { display: "flex", alignItems: "center", gap: ".75rem" },
  panelIcon: { width: 34, height: 34, borderRadius: 8, background: "#FBF7EE", border: "1px solid #E7E1D3", display: "flex", alignItems: "center", justifyContent: "center" },
  panelTitle: { fontSize: ".9rem", fontWeight: 700, color: "#2E2A25" },
  countPill: { fontSize: ".7rem", fontWeight: 600, color: "#6B6353", background: "#FBF7EE", border: "1px solid #E7E1D3", borderRadius: 99, padding: ".25rem .6rem" },
  readOnlyBadge: { fontSize: ".7rem", fontWeight: 700, color: "#3B82F6", background: "#EFF6FF", border: "1px solid #BFDBFE", borderRadius: 99, padding: ".25rem .6rem" },
  emptyState: { color: "#8A8272", fontSize: ".82rem", background: "#FBF7EE", border: "1px dashed #E7E1D3", borderRadius: 8, padding: ".8rem 1rem" },

  yearGroup: { background: "#FAF8F5", border: "1px solid #EAE3D2", borderRadius: 8, padding: ".6rem .8rem" },
  yearHeader: { fontSize: ".72rem", fontWeight: 800, color: "#8C6A27", marginBottom: ".4rem", letterSpacing: "0.5px" },

  rowList: { display: "flex", flexDirection: "column", gap: ".45rem" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: ".55rem .8rem", border: "1px solid #EFE9DB", borderRadius: 6, background: "#FFFFFF" },
  rowEditing: { borderColor: "#C9A24B", background: "#FFFDF5" },
  rowMain: { display: "flex", alignItems: "center", gap: ".75rem" },

  dayTag: { fontSize: ".75rem", fontWeight: 700, padding: ".2rem .5rem", borderRadius: 4, background: "#FEF3C7", color: "#92400E" },
  dateText: { fontSize: ".8rem", fontWeight: 700, color: "#1F2937" },
  timeText: { fontSize: ".78rem", fontWeight: 600, color: "#4B5563", background: "#F3F4F6", padding: ".2rem .5rem", borderRadius: 4 },
  allDayTag: { fontSize: ".75rem", color: "#059669", background: "#ECFDF5", padding: ".2rem .5rem", borderRadius: 4, fontWeight: 600 },

  statusBadge: { fontSize: ".68rem", padding: ".2rem .55rem", borderRadius: 99, color: "#fff", fontWeight: 600 },
  editBtn: { border: "1px solid #D1D5DB", background: "#F9FAFB", color: "#374151", borderRadius: 6, padding: ".3rem .65rem", fontSize: ".73rem", fontWeight: 600, cursor: "pointer" },
  deleteBtn: { border: "1px solid #FCA5A5", background: "#FEF2F2", color: "#DC2626", borderRadius: 6, padding: ".3rem .65rem", fontSize: ".73rem", fontWeight: 600, cursor: "pointer" },

  form: { background: "#FBF7EE", border: "1px solid #E7E1D3", borderRadius: 10, padding: "1rem" },
  formGrid: { display: "flex", flexWrap: "wrap", gap: ".5rem", alignItems: "flex-end" },
  field: { minWidth: "90px", display: "flex", flexDirection: "column" },
  label: { fontSize: ".7rem", fontWeight: 600, color: "#6B6353", marginBottom: ".25rem" },
  input: { width: "100%", padding: ".45rem .4rem", border: "1px solid #E7E1D3", borderRadius: 6, fontSize: ".8rem", background: "#fff", height: "36px", boxSizing: "border-box" },
  addBtn: { padding: "0 1rem", height: "36px", background: "#C9A24B", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, fontSize: ".8rem", cursor: "pointer" },
  cancelBtn: { padding: "0 .8rem", height: "36px", background: "#E5E7EB", color: "#374151", border: "none", borderRadius: 6, fontWeight: 600, fontSize: ".8rem", cursor: "pointer" },
  fullNotice: { background: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: 8, padding: ".8rem 1rem", fontSize: ".8rem", color: "#92400E" },

  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  modalCard: {
    background: "#fff",
    borderRadius: 12,
    padding: "1.5rem",
    maxWidth: 400,
    width: "90%",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    textAlign: "center",
  },
  modalIcon: { fontSize: "2.2rem", marginBottom: ".5rem" },
  modalTitle: { margin: "0 0 .5rem 0", fontSize: "1.05rem", fontWeight: 700, color: "#111827" },
  modalBody: { margin: "0 0 1.25rem 0", fontSize: ".83rem", color: "#6B7280", lineHeight: 1.5 },
  modalActions: { display: "flex", gap: ".75rem", justifyContent: "center" },
  modalCancelBtn: { flex: 1, padding: ".55rem", borderRadius: 6, border: "1px solid #D1D5DB", background: "#fff", color: "#374151", fontWeight: 600, fontSize: ".82rem", cursor: "pointer" },
  modalConfirmBtn: { flex: 1, padding: ".55rem", borderRadius: 6, border: "none", background: "#DC2626", color: "#fff", fontWeight: 700, fontSize: ".82rem", cursor: "pointer" },
};

export default PolicyDateSchedules;