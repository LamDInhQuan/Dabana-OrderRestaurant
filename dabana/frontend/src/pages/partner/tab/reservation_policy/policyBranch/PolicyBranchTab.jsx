import React, { useState, useEffect, useCallback } from "react";
import { S } from '../../../theme';
import PolicyList from "./component/PolicyList";
import { branchPolicyApi, reservationPolicyApi } from "../../../../../api";
import { useAuth } from "../../../../../context/AuthContext";
import PolicyForm from "../components/PolicyForm";
import BranchAssignment from "./component/BranchAssignment";

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

export default function PolicyBranchTab({ branches , branch}) {
  const { auth } = useAuth();

  // 🟢 Lấy branchId từ phần tử đầu tiên của mảng branches truyền vào
  const branchId = branch.id; 

  // --- state -------------------------------------------------------------
  const [policies, setPolicies] = useState([]);
  const [assignments, setAssignments] = useState([]); 
  const [editingPolicy, setEditingPolicy] = useState(emptyPolicy);
  const [selectedPolicyId, setSelectedPolicyId] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Hàm fetch chính sách của riêng Chi Nhánh (PolicyBranch) ---
  const fetchBranchPolicies = useCallback(async () => {
    if (!branchId) return;
    try {
      setLoading(true);
      
      // 💡 Thường endpoint sẽ là lấy chính sách đã gán cho chi nhánh này
      // Mình tạm dùng branchPolicyApi, bạn check lại đúng tên hàm/endpoint thực tế của bạn nhé
      const res = await branchPolicyApi.getAll(branchId); 
      
      if (res.data && res.data.code === "SUCCESS") {
        // Map data trả về nếu API trả ra một wrap object chứa thông tin policy chi tiết
        const branchPoliciesData = res.data.data || [];
        setPolicies(branchPoliciesData);
      }
    } catch (error) {
      console.error("Lỗi khi tải chính sách của chi nhánh:", error);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  // --- initial load ------------------------------------------------------
  useEffect(() => {
    if (branchId) {
      fetchBranchPolicies();
    }
    setAssignments([]); 
  }, [fetchBranchPolicies, branchId]);

  const selectedPolicy = policies.find((p) => p.id === selectedPolicyId) || null;

  // --- policy handlers ---------------------------------------------------
  const createNewPolicy = () => {
    setSelectedPolicyId(null);
    setEditingPolicy(emptyPolicy);
  };

  const editPolicy = (policy) => {
    setSelectedPolicyId(policy.id);
    setEditingPolicy({ ...policy });
  };

  const savePolicy = async (e) => {
    e.preventDefault();
    if (!branchId) return;

    try {
      if (editingPolicy.id) {
        // Cập nhật chính sách áp dụng riêng tại chi nhánh này
        const res = await branchPolicyApi.update(branchId, editingPolicy.id, editingPolicy);
        if (res.data && res.data.code === "SUCCESS") {
          fetchBranchPolicies();
        }
      } else {
        // Tạo mới một chính sách trực tiếp cho riêng chi nhánh này
        const res = await branchPolicyApi.create(branchId, editingPolicy);
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
          setSelectedPolicyId(null);
          setEditingPolicy(emptyPolicy);
        }
      }
    } catch (error) {
      console.error("Lỗi khi xóa chính sách khỏi chi nhánh:", error);
    }
  };

  if (loading) {
    return <div style={{ padding: "2rem", color: "#8A8272" }}>Đang tải chính sách chi nhánh...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", width: "100%", padding: "0 0.5rem" }}>
      
      {/* 🟢 KHU VỰC 1: Danh sách chính sách áp dụng tại Chi nhánh dạng hàng ngang */}
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
        
        <div style={{ width: "100%" }}>
          <PolicyList
            policies={policies}
            selectedPolicyId={selectedPolicyId}
            onSelect={editPolicy}
            onCreate={createNewPolicy}
            onDelete={deletePolicy}
          />
        </div>
      </div>

      {/* 🟢 KHU VỰC 2: Form nhập chi tiết */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        
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
            {editingPolicy.id ? `🛠️ Điều chỉnh chính sách chi nhánh: ${editingPolicy.name}` : "✨ Thêm chính sách mới cho Chi nhánh"}
          </div>
          
          <PolicyForm
            policy={editingPolicy}
            onChange={setEditingPolicy}
            onSubmit={savePolicy}
            onCancel={createNewPolicy}
          />
        </div>

        {/* 💡 Note: Nếu làm ở tầng Chi nhánh (BranchId), có thể bạn sẽ không cần phần Component `BranchAssignment` (Gán đa chi nhánh) này nữa vì bản thân nó đã nằm trong một chi nhánh xác định rồi. Nếu không cần thì bạn có thể xóa hẳn div này đi nhé! */}
        {selectedPolicy && (
          <div 
            style={{ 
              background: "#fff", 
              padding: "1.5rem 2rem", 
              borderRadius: "8px", 
              border: "1px solid #E7E1D3",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
            }}
          >
            <BranchAssignment
              policy={selectedPolicy}
              branches={branches}
              assignments={assignments.filter((a) => a.policyId === selectedPolicyId)}
              onSave={async () => {}} 
              onDelete={async () => {}}
            />
          </div>
        )}

      </div>
    </div>
  );
}