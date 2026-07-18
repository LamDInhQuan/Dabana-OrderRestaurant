import React, { useState, useEffect } from "react";
import { S } from '../../theme'
import PolicyList from "./component/PolicyList";
import PolicyForm from "./component/PolicyForm";
import BranchAssignment from "./common/BranchAssignment";

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

const MOCK_POLICIES = [
  {
    id: 1,
    name: "Ngày thường",
    description: "Áp dụng cho các ngày trong tuần",
    depositRequired: true,
    depositType: "FIXED_AMOUNT",
    depositValue: 200000,
    freeCancellationHours: 24,
    lateCancellationPenaltyPercent: 50,
    noShowPenaltyPercent: 100,
    terms: "",
    branchCount: 3,
  },
  {
    id: 2,
    name: "Cuối tuần",
    description: "Áp dụng thứ 7, chủ nhật",
    depositRequired: true,
    depositType: "PERCENTAGE",
    depositValue: 30,
    freeCancellationHours: 48,
    lateCancellationPenaltyPercent: 100,
    noShowPenaltyPercent: 100,
    terms: "",
    branchCount: 2,
  },
  {
    id: 3,
    name: "Lễ / Tết",
    description: "Áp dụng các ngày lễ, Tết",
    depositRequired: true,
    depositType: "PERCENTAGE",
    depositValue: 50,
    freeCancellationHours: 0,
    lateCancellationPenaltyPercent: 100,
    noShowPenaltyPercent: 100,
    terms: "Không hoàn cọc trong mọi trường hợp.",
    branchCount: 1,
  },
];

const MOCK_BRANCHES = [
  { id: 1, name: "Ashima Cầu Giấy" },
  { id: 2, name: "Ashima Hoàn Kiếm" },
  { id: 3, name: "Gogi" },
  { id: 4, name: "Kichi" },
];

export default function PolicyTab() {
  // --- state -------------------------------------------------------------
  const [policies, setPolicies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [assignments, setAssignments] = useState([]); // rt_branch_policy rows
  const [editingPolicy, setEditingPolicy] = useState(emptyPolicy);
  const [selectedPolicyId, setSelectedPolicyId] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- initial load (swap mock for real API later) ------------------------
  useEffect(() => {
    // TODO: replace with
    //   GET /reservation-policies
    //   GET /branches
    //   GET /branch-policies
    setPolicies(MOCK_POLICIES);
    setBranches(MOCK_BRANCHES);
    setAssignments([]);
    setLoading(false);
  }, []);

  const selectedPolicy = policies.find((p) => p.id === selectedPolicyId) || null;

  // --- policy handlers -----------------------------------------------------
  const createNewPolicy = () => {
    setSelectedPolicyId(null);
    setEditingPolicy(emptyPolicy);
  };

  const editPolicy = (policy) => {
    setSelectedPolicyId(policy.id);
    setEditingPolicy({ ...policy });
  };

  const savePolicy = (e) => {
    e.preventDefault();

    if (editingPolicy.id) {
      // TODO: PUT /reservation-policies/:id
      setPolicies((old) =>
        old.map((item) =>
          item.id === editingPolicy.id
            ? { ...editingPolicy, branchCount: item.branchCount }
            : item
        )
      );
      setSelectedPolicyId(editingPolicy.id);
    } else {
      // TODO: POST /reservation-policies
      const created = { ...editingPolicy, id: Date.now(), branchCount: 0 };
      setPolicies((old) => [...old, created]);
      setEditingPolicy(created);
      setSelectedPolicyId(created.id);
    }
  };

  const deletePolicy = (id) => {
    if (!window.confirm("Xóa chính sách này?")) return;

    // TODO: DELETE /reservation-policies/:id
    setPolicies((old) => old.filter((x) => x.id !== id));
    setAssignments((old) => old.filter((a) => a.policyId !== id));

    if (selectedPolicyId === id) {
      setSelectedPolicyId(null);
      setEditingPolicy(emptyPolicy);
    }
  };

  // --- branch assignment handlers -------------------------------------------
  const saveAssignment = (assignment) => {
    // TODO: POST /branch-policies
    setAssignments((old) => [...old, assignment]);
    setPolicies((old) =>
      old.map((p) =>
        p.id === assignment.policyId
          ? { ...p, branchCount: (p.branchCount || 0) + assignment.branchIds.length }
          : p
      )
    );
  };

  const deleteAssignment = (id) => {
    const target = assignments.find((a) => a.id === id);
    if (!target) return;
    if (!window.confirm("Gỡ áp dụng chính sách khỏi (các) chi nhánh này?")) return;

    // TODO: DELETE /branch-policies/:id
    setAssignments((old) => old.filter((a) => a.id !== id));
    setPolicies((old) =>
      old.map((p) =>
        p.id === target.policyId
          ? {
              ...p,
              branchCount: Math.max(0, (p.branchCount || 0) - target.branchIds.length),
            }
          : p
      )
    );
  };

  if (loading) {
    return <div style={{ padding: "2rem", color: "#8A8272" }}>Đang tải...</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "330px 1fr",
          gap: "2rem",
          alignItems: "flex-start",
        }}
      >
        <PolicyList
          policies={policies}
          selectedPolicyId={selectedPolicyId}
          onSelect={editPolicy}
          onCreate={createNewPolicy}
          onDelete={deletePolicy}
        />

        <PolicyForm
          policy={editingPolicy}
          onChange={setEditingPolicy}
          onSubmit={savePolicy}
          onCancel={createNewPolicy}
        />
      </div>

      <BranchAssignment
        policy={selectedPolicy}
        branches={branches}
        assignments={assignments.filter((a) => a.policyId === selectedPolicyId)}
        onSave={saveAssignment}
        onDelete={deleteAssignment}
      />
    </div>
  );
}