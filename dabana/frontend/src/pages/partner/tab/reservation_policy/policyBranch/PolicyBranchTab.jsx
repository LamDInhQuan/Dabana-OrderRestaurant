import React, { useState, useEffect, useCallback } from "react";
import { S } from '../../../theme';
import PolicyList from "./component/PolicyList";
import { branchPolicyApi } from "../../../../../api"; // Gọn gàng lại api import
import { useAuth } from "../../../../../context/AuthContext";
import PolicyFormWithExtras from "../components/PolicyFormWithExtras";

const emptyPolicy = {
  id: null,
  name: "",
  description: "",
  depositRequired: false,
  depositType: "FIXED_AMOUNT",
  depositValue: "",
  freeCancellationHours: 24,
  lateCancellationPenaltyPercent: 50,
  noShowPenaltyPercent: 100,
  terms: "",
};

export default function PolicyBranchTab({ branches, branch }) {
  const { auth } = useAuth();
  const branchId = branch?.id;

  // --- state -------------------------------------------------------------
  const [policies, setPolicies] = useState([]);
  const [editingPolicy, setEditingPolicy] = useState(emptyPolicy); 
  const [selectedPolicyId, setSelectedPolicyId] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Hàm fetch danh sách chính sách của Chi Nhánh ---
  const fetchBranchPolicies = useCallback(async () => {
    if (!branchId) return;
    try {
      setLoading(true);
      const res = await branchPolicyApi.getAll(branchId);
      if (res.data && res.data.code === "SUCCESS") {
        setPolicies(res.data.data || []);
      }
    } catch (error) {
      console.error("Lỗi khi tải chính sách của chi nhánh:", error);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  // --- 🟢 Hàm lấy chi tiết chính sách khi chọn (Thay cho handleSelectPolicy bị thiếu) ---
  const handleSelectPolicy = async (policyId) => {
    if (!policyId || !branchId) return;
    try {
      setSelectedPolicyId(policyId);
      const res = await branchPolicyApi.getDetail(branchId, policyId);
      if (res.data?.code === "SUCCESS" || res.status === 200) {
        setEditingPolicy(res.data?.data || res.data);
      }
    } catch (err) {
      console.error("Lỗi lấy chi tiết chính sách chi nhánh:", err);
    }
  };

  // --- initial load ------------------------------------------------------
  useEffect(() => {
    if (branchId) {
      fetchBranchPolicies();
    }
  }, [fetchBranchPolicies, branchId]);

  // --- policy handlers ---------------------------------------------------
  const createNewPolicy = () => {
    setSelectedPolicyId(null);
    setEditingPolicy(emptyPolicy); // Reset về object rỗng thay vì set null để tránh crash dưới form
  };

  const savePolicy = async (updatedPolicyData) => {
    if (!branchId) return;
    try {
      if (updatedPolicyData.id) {
        // Cập nhật
        const res = await branchPolicyApi.update(branchId, updatedPolicyData.id, updatedPolicyData);
        if (res.data && res.data.code === "SUCCESS") {
          fetchBranchPolicies();
          handleSelectPolicy(updatedPolicyData.id); // Refresh lại data chi tiết
        }
      } else {
        // Tạo mới
        const res = await branchPolicyApi.create(branchId, updatedPolicyData);
        if (res.data && res.data.code === "SUCCESS") {
          fetchBranchPolicies();
          createNewPolicy();
        }
      }
    } catch (error) {
      console.error("Lỗi khi lưu chính sách chi nhánh:", error);
    }
  };

  const deletePolicy = async (id) => {
    if (!branchId || !window.confirm("Gỡ bỏ chính sách này khỏi chi nhánh?")) return;
    try {
      const res = await branchPolicyApi.delete(branchId, id);
      if (res.data && res.data.code === "SUCCESS") {
        setPolicies((old) => old.filter((x) => x.id !== id));
        if (selectedPolicyId === id) {
          createNewPolicy();
        }
      }
    } catch (error) {
      console.error("Lỗi khi xóa chính sách khỏi chi nhánh:", error);
    }
  };

  if (loading) {
    return <div style={{ padding: "2rem", color: "#8A8272" }}>Đang tải chính sách chi nhánh...</div>;
  }

  // Khơi mào kiểm tra xem form có đang được mở chủ động không (đang tạo mới hoặc đã chọn một chính sách có id)
  const isFormOpen = editingPolicy && (editingPolicy.id !== null || selectedPolicyId !== null || editingPolicy.name === "");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%", padding: "0 0.5rem" }}>

      {/* KHU VỰC 1: Danh sách chính sách */}
      <div
        style={{
          background: "#fff",
          padding: "1.25rem",
          borderRadius: "8px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          border: "1px solid #E7E1D3"
        }}
      >
        <div style={{ fontSize: ".85rem", fontWeight: 700, textTransform: "uppercase", color: "#8A8272", marginBottom: "1rem" }}>
          Chính sách áp dụng riêng cho Chi nhánh
        </div>

        <div style={{ width: "100%", marginBottom: '1rem' }}>
          <PolicyList
            policies={policies}
            selectedPolicyId={selectedPolicyId}
            onSelect={(policy) => handleSelectPolicy(policy.id)}
            onCreate={createNewPolicy}
            onDelete={deletePolicy}
          />
        </div>
      </div>

      {/* KHU VỰC 2: Toàn bộ Khu vực cấu hình chi tiết (Form + Extra Rules) */}
      <div style={{ minWidth: 0 }}>
        {isFormOpen ? (
          <div
            style={{
              background: "#fff",
              padding: "2rem",
              borderRadius: "8px",
              border: "1px solid #E7E1D3",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}
          >
            <div style={{ fontSize: ".95rem", fontWeight: 700, textTransform: "uppercase", color: "#6B6353", marginBottom: "1.5rem", borderBottom: "2px solid #FBF7EE", paddingBottom: "0.5rem" }}>
              {editingPolicy.id ? `🛠️ Điều chỉnh chính sách chi nhánh: ${editingPolicy.policyCode}` : "✨ Thêm chính sách mới cho Chi nhánh"}
            </div>

            {/* 🟢 Tích hợp trọn gói Form cơ bản + Cọc & Lịch trong component này */}
            <PolicyFormWithExtras
              restaurantId={branch?.restaurantId}
              branchId={branchId}
              policy={editingPolicy}
              onChange={setEditingPolicy}
              onSubmit={savePolicy} // Đẩy trực tiếp logic lưu/tạo mới vào đây
              onCancel={createNewPolicy} // Trả lại emptyPolicy để đóng/reset trạng thái form sạch sẽ
              onRefresh={() => handleSelectPolicy(editingPolicy.id)}
            />
          </div>
        ) : (
          <div
            style={{
              border: "2px dashed rgba(0,0,0,0.1)",
              borderRadius: 8,
              padding: "4rem 2rem",
              textAlign: "center",
              color: "rgba(0,0,0,0.4)",
              background: "#fff"
            }}
          >
            💡 Chọn một chính sách từ danh sách phía trên hoặc nhấn nút tạo mới để cấu hình thông tin chi tiết.
          </div>
        )}
      </div>
    </div>
  );
}