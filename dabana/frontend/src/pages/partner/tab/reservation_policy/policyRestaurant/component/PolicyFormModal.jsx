// Gợi ý cấu trúc cho PolicyFormModal.jsx
import React, { useState } from "react";
// Import các sub components
import PolicyForm from "../../components/PolicyForm";
import PolicySchedule from "../../components/PolicySchedule";
import PolicyDepositRules from "../../components/PolicyDepositRules";
import PolicyDateSchedules from "../../components/PolicyDateSchedules";

function PolicyFormModal({ initialData, loading, onSave, onClose }) {
  console.log('initialData', initialData);

  const [activeTab, setActiveTab] = useState("general"); // 'general' | 'schedule' | 'rules'

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#fff", width: "80%", maxWidth: "1000px", maxHeight: "90vh", borderRadius: 12, overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* Modal Header */}
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #ECE4D3", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>{initialData?.id ? `Chỉnh sửa: ${initialData.name}` : "Tạo mới chính sách khung"}</h3>
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
            disabled={!initialData?.id}
            onClick={() => setActiveTab("schedule")}
            style={{ padding: ".8rem 1.2rem", border: "none", background: "none", borderBottom: activeTab === "schedule" ? "2px solid #C9A24B" : "none", fontWeight: activeTab === "schedule" ? "bold" : "normal", cursor: "pointer" }}
          >
            2. Lịch áp dụng
          </button>
          <button
            disabled={!initialData?.id}
            onClick={() => setActiveTab("rules")}
            style={{ padding: ".8rem 1.2rem", border: "none", background: "none", borderBottom: activeTab === "rules" ? "2px solid #C9A24B" : "none", fontWeight: activeTab === "rules" ? "bold" : "normal", cursor: "pointer" }}
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
              {activeTab === "general" && <PolicyForm policy={initialData} onSave={onSave} />}
              {activeTab === "schedule" && (
                <PolicyDateSchedules
                  restaurantId={initialData.restaurantId}
                  policyId={initialData?.id}
                  schedules={initialData?.schedules || []} // 👈 Truyền mảng schedules trực tiếp từ API vào đây
                  scheduleType={initialData.scheduleType}
                />
              )}
              {activeTab === "rules" && <PolicyDepositRules policyId={initialData?.id} restaurantId={initialData.restaurantId} rules={initialData.depositRules}/>}
            </>
          )}
        </div>

      </div>
    </div>
  );
}

export default PolicyFormModal;