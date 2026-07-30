import React, { useState } from "react";
import { Eye, X } from "lucide-react";
// Import các sub-components dùng chung
import PolicyForm from "./PolicyForm";
import PolicyDateSchedules from "./PolicyDateSchedules";
import PolicyDepositRules from "./PolicyDepositRules";

export default function PolicyFormWithExtras({
  restaurantId,
  branchId,
  policy,
  rules, // nhận rules trực tiếp từ props nếu có
  isReadOnly = false,
  onChange,
  onSubmit,
  onCancel,
  onRefresh,
  onAssignToBranch,
}) {
  const [activeTab, setActiveTab] = useState("general"); // 'general' | 'schedule' | 'rules'
  const [loading, setLoading] = useState(false);
  
  if (!policy) return null;

  // Fallback lấy thông tin policy chuẩn
  const policyInfo = policy.policy || policy;

  // Lấy ID chính xác dù object có bị bọc bên trong hay không
  const targetPolicyId = policy?.id || policyInfo?.id || policy?.policyId;

  // Trích xuất danh sách schedules & scheduleType từ policy
  const scheduleType = policyInfo?.scheduleType || policy?.scheduleType || "ALWAYS";
  const dateSchedules = policyInfo?.schedules || policy?.schedules || policyInfo?.dateSchedules || policy?.dateSchedules || [];

  // Trích xuất danh sách rules: Ưu tiên prop 'rules' truyền vào, nếu không sẽ lấy từ object 'policy'
  const depositRules = rules || policy?.depositRules || policyInfo?.depositRules || policy?.rules || policyInfo?.rules || [];

  const isBranchMode = Boolean(branchId);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          width: "90%",
          maxWidth: "1000px",
          maxHeight: "90vh",
          borderRadius: 12,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
      >
        {/* Header Modal */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderBottom: "1px solid #ECE4D3",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#fff",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "1.1rem",
                color: "#1F2937",
                fontWeight: 700,
              }}
            >
              {isReadOnly
                ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.4rem' }}><Eye size={18} /> Chi tiết chính sách mẫu (Chỉ xem)</span>
                : isBranchMode
                  ? "Chi tiết chính sách Chi nhánh"
                  : "Cấu hình chính sách Nhà hàng"}
            </h3>
            <span style={{ fontSize: "0.8rem", color: "#6B7280" }}>
              Mã: {policyInfo.policyCode || policyInfo.code || "N/A"}
            </span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            style={{
              border: "none",
              background: "none",
              fontSize: "1.5rem",
              cursor: "pointer",
              color: "#6B7280",
              lineHeight: 1,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Horizontal Sub-Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #ECE4D3",
            background: "#FDFCF9",
            padding: "0 1.5rem",
            gap: "0.5rem",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            style={{
              padding: "0.8rem 1.2rem",
              border: "none",
              background: "none",
              borderBottom:
                activeTab === "general"
                  ? "2px solid #C9A24B"
                  : "2px solid transparent",
              fontWeight: activeTab === "general" ? "bold" : "normal",
              color: activeTab === "general" ? "#855D10" : "#6B7280",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            1. Thông tin chung
          </button>

          <button
            type="button"
            disabled={!targetPolicyId}
            onClick={() => setActiveTab("schedule")}
            style={{
              padding: "0.8rem 1.2rem",
              border: "none",
              background: "none",
              borderBottom:
                activeTab === "schedule"
                  ? "2px solid #C9A24B"
                  : "2px solid transparent",
              fontWeight: activeTab === "schedule" ? "bold" : "normal",
              color: activeTab === "schedule" ? "#855D10" : "#6B7280",
              cursor: !targetPolicyId ? "not-allowed" : "pointer",
              opacity: !targetPolicyId ? 0.5 : 1,
              fontSize: "0.9rem",
            }}
          >
            2. Lịch áp dụng
          </button>

          <button
            type="button"
            disabled={!targetPolicyId}
            onClick={() => setActiveTab("rules")}
            style={{
              padding: "0.8rem 1.2rem",
              border: "none",
              background: "none",
              borderBottom:
                activeTab === "rules"
                  ? "2px solid #C9A24B"
                  : "2px solid transparent",
              fontWeight: activeTab === "rules" ? "bold" : "normal",
              color: activeTab === "rules" ? "#855D10" : "#6B7280",
              cursor: !targetPolicyId ? "not-allowed" : "pointer",
              opacity: !targetPolicyId ? 0.5 : 1,
              fontSize: "0.9rem",
            }}
          >
            3. Quy tắc cọc
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div
              style={{
                padding: "2rem",
                textAlign: "center",
                color: "#8A8272",
              }}
            >
              Đang tải thông tin chi tiết...
            </div>
          ) : (
            <>
              {/* Tab 1: Thông tin chung */}
              {activeTab === "general" && (
                <PolicyForm
                  policy={policyInfo}
                  isBranchMode={isBranchMode}
                  isReadOnly={isReadOnly}
                  onChange={onChange}
                  onSave={async (formData) => {
                    if (isReadOnly) return;
                    if (onSubmit) await onSubmit(formData);
                  }}
                  onCancel={onCancel}
                  onAssignToBranch={onAssignToBranch}
                />
              )}

              {/* Tab 2: Lịch áp dụng - Truyền thêm branchId và isBranchMode */}
              {activeTab === "schedule" && (
                <PolicyDateSchedules
                  restaurantId={restaurantId}
                  branchId={branchId}
                  isBranchMode={isBranchMode}
                  policyId={targetPolicyId}
                  scheduleType={scheduleType}
                  schedules={dateSchedules}
                  onRefresh={onRefresh}
                  readOnly={isReadOnly}
                />
              )}

              {/* Tab 3: Quy tắc đặt cọc - Truyền thêm branchId và isBranchMode */}
              {activeTab === "rules" && (
                <PolicyDepositRules
                  restaurantId={restaurantId}
                  branchId={branchId}
                  isBranchMode={isBranchMode}
                  policyId={targetPolicyId}
                  rules={depositRules}
                  onRefresh={onRefresh}
                  readOnly={isReadOnly}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}