import { useState, useEffect } from "react";
import PolicyForm from "../../components/PolicyForm";
import PolicyDepositRules from "../../components/PolicyDepositRules";
import PolicyDateSchedules from "../../components/PolicyDateSchedules";

const SCHEDULE_TYPE_OPTIONS = [
  { value: "ALWAYS", label: "Luôn áp dụng" },
  { value: "DAY_OF_WEEK", label: "Theo ngày trong tuần" },
  { value: "DATE_RANGE", label: "Theo khoảng thời gian cụ thể" }
];

function PolicyFormModal({ initialData, loading, onSave, onClose, onRefresh }) {
  const [activeTab, setActiveTab] = useState("general"); 

  const [formData, setFormData] = useState({
    policyCode: "",
    name: "",
    autoAssignToBranch: false,
    termsAndConditions: "",
    policyScheduleType: "ALWAYS",
  });

  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        policyScheduleType: initialData.scheduleType || "ALWAYS",
      });
    }
  }, [initialData]);
  console.log("formdata",formData);
  
  const handleSubmitForm = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (onSave) {
      try {
        await onSave(formData);
        setSuccessMessage("Lưu chính sách thành công!");
        setTimeout(() => {
          setSuccessMessage("");
        }, 3000);
      } catch (error) {
        console.error("Lỗi khi lưu:", error);
      }
    }
  };

  // Kiểm tra xem đang ở chế độ chỉnh sửa (đã có ID) hay tạo mới
  const isEditing = Boolean(formData?.id);

  const handleScheduleTypeChange = (newType) => {
    if (isEditing) {
      // 🟢 Cảnh báo khi cố tình thay đổi loại lịch của chính sách đã tồn tại
      const confirmChange = window.confirm(
        "⚠️ CẢNH BÁO QUAN TRỌNG:\n\n" +
        "Thay đổi loại lịch áp dụng sẽ làm ảnh hưởng và có thể xóa/làm lại toàn bộ các thiết lập lịch và quy tắc cọc hiện tại của các chi nhánh đang áp dụng chính sách này.\n\n" +
        "Bạn có chắc chắn muốn đổi không? Nếu cần thiết, hãy xóa chính sách cũ và tạo mới từ đầu."
      );
      if (!confirmChange) return;
    }
    setFormData({ ...formData, policyScheduleType: newType });
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", width: "80%", maxWidth: "1000px", maxHeight: "90vh", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative" }}>

        {/* Banner Thông báo thành công */}
        {successMessage && (
          <div style={{
            position: "absolute",
            top: "1rem",
            right: "1.5rem",
            background: "#DEF7EC",
            color: "#03543F",
            padding: ".75rem 1.25rem",
            borderRadius: "8px",
            border: "1px solid #84E1BC",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            zIndex: 1100,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: ".5rem"
          }}>
            <span>✅</span> {successMessage}
          </div>
        )}

        {/* Modal Header */}
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #ECE4D3", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>
            {isEditing ? `Chỉnh sửa: ${formData.name || ""}` : "Tạo mới chính sách khung"}
          </h3>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: "1.5rem", cursor: "pointer" }}>✕</button>
        </div>

        {/* Horizontal Sub-Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #ECE4D3", background: "#FDFCF9", padding: "0 1.5rem" }}>
          <button
            onClick={() => setActiveTab("general")}
            style={{ padding: ".8rem 1.2rem", border: "none", background: "none", borderBottom: activeTab === "general" ? "2px solid #C9A24B" : "none", fontWeight: activeTab === "general" ? "bold" : "normal", cursor: "pointer" }}
          >
            1. Thông tin chung
          </button>
          <button
            disabled={!isEditing}
            onClick={() => setActiveTab("schedule")}
            style={{ padding: ".8rem 1.2rem", border: "none", background: "none", borderBottom: activeTab === "schedule" ? "2px solid #C9A24B" : "none", fontWeight: activeTab === "schedule" ? "bold" : "normal", cursor: "pointer", opacity: !isEditing ? 0.5 : 1 }}
          >
            2. Lịch áp dụng
          </button>
          <button
            disabled={!isEditing}
            onClick={() => setActiveTab("rules")}
            style={{ padding: ".8rem 1.2rem", border: "none", background: "none", borderBottom: activeTab === "rules" ? "2px solid #C9A24B" : "none", fontWeight: activeTab === "rules" ? "bold" : "normal", cursor: "pointer", opacity: !isEditing ? 0.5 : 1 }}
          >
            3. Quy tắc cọc
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div>Đang tải thông tin chi tiết...</div>
          ) : (
            <>
              {activeTab === "general" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  
                  {/* Khu vực chọn Loại lịch (Khóa khi sửa, cho chọn khi tạo) */}
                  <div style={{ padding: "1rem", border: "1px solid #ECE4D3", borderRadius: 8, background: isEditing ? "#F3F4F6" : "#FCFAF6" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: ".5rem" }}>
                      <label style={{ fontWeight: 600, color: "#1F2937" }}>
                        📅 Loại lịch áp dụng {isEditing && "🔒"}
                      </label>
                      {isEditing && (
                        <span style={{ fontSize: "0.75rem", color: "#B45309", background: "#FEF3C7", padding: "0.2rem 0.5rem", borderRadius: 4, fontWeight: 500 }}>
                          Không thể thay đổi khi đang sửa (Cần xóa đi tạo mới nếu muốn đổi loại)
                        </span>
                      )}
                    </div>

                    <select
                      value={formData.scheduleType ?? "ALWAYS"}
                      disabled={isEditing} // 🟢 Khóa chọn nếu đang ở chế độ chỉnh sửa
                      onChange={(e) => handleScheduleTypeChange(e.target.value)}
                      style={{
                        width: "100%",
                        padding: ".6rem .8rem",
                        borderRadius: 6,
                        border: "1px solid #D1D5DB",
                        outline: "none",
                        fontSize: ".95rem",
                        background: isEditing ? "#E5E7EB" : "#fff",
                        cursor: isEditing ? "not-allowed" : "pointer"
                      }}
                    >
                      {SCHEDULE_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Form thông tin chi tiết */}
                  <PolicyForm 
                    policy={formData} 
                    onChange={(updated) => setFormData(updated)} 
                    onSubmit={handleSubmitForm} 
                    onCancel={onClose} 
                  />
                </div>
              )}
              
              {activeTab === "schedule" && (
                <PolicyDateSchedules
                  restaurantId={formData?.restaurantId}
                  policyId={formData?.id}
                  schedules={formData?.schedules || []}
                  scheduleType={formData?.scheduleType} 
                  onRefresh={onRefresh}
                />
              )} 
              
              {activeTab === "rules" && (
                <PolicyDepositRules 
                  policyId={formData?.id} 
                  restaurantId={formData?.restaurantId} 
                  rules={formData?.depositRules || []}
                  onRefresh={onRefresh}
                />
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}

export default PolicyFormModal;