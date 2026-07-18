import React, { useState, useEffect } from "react";
import PolicyResList from "./component/PolicyResList";
import { reservationPolicyApi } from "../../../../../api";
import { useAuth } from "../../../../../context/AuthContext";
import toast from "react-hot-toast";
import PolicyFormWithExtras from "../components/PolicyFormWithExtras";

const DEFAULT_POLICY = {
  name: "",
  description: "",
  depositRequired: false,
  depositType: "FIXED_AMOUNT",
  depositValue: 0,
  freeCancellationHours: 0,
  lateCancellationPenaltyPercent: 0,
  noShowPenaltyPercent: 0,
  terms: "",
  depositRules: [], 
  schedules: []     
};

function PolicyResTab({ restaurantId: propRestaurantId }) {
  const { auth } = useAuth();
  const restaurantId = propRestaurantId || auth?.restaurantId || auth?.id;

  const [policies, setPolicies] = useState([]);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Chỉ fetch danh sách các chính sách ban đầu để hiển thị bên trái
  const fetchPolicies = async () => {
    if (!restaurantId) return;
    try {
      setLoading(true);
      // Gọi API lấy list (Nếu hàm của bạn là getAll, hãy đổi tên cho đúng)
      const res = await reservationPolicyApi.getAll(restaurantId); 
      if (res.data?.code === "SUCCESS" || res.status === 200) {
        const data = res.data?.data || res.data || [];
        setPolicies(data);
        
        // Nếu đang sửa một chính sách, re-fetch lại chi tiết của chính sách đó để cập nhật UI
        if (editingPolicy?.id) {
          handleSelectPolicy(editingPolicy.id);
        }
      }
    } catch (err) {
      console.error("Lỗi lấy danh sách chính sách: ", err);
      toast.error("Không thể tải danh sách chính sách!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId]);

  // 2. 🟢 HÀM XỬ LÝ KHI CLICK VÀO POLICY: Truyền id và gọi getDetail chính xác
  const handleSelectPolicy = async (policyId) => {
    if (!policyId) return;
    try {
      // Gọi đúng API getDetail truyền cả restaurantId và policyId cụ thể
      const res = await reservationPolicyApi.getDetail(restaurantId, policyId);
      if (res.data?.code === "SUCCESS" || res.status === 200) {
        const fullPolicyData = res.data?.data || res.data;
        setEditingPolicy(fullPolicyData); // Đổ dữ liệu combo (rules, schedules) vào form bên phải
      }
    } catch (err) {
      console.error("Lỗi lấy chi tiết chính sách:", err);
      toast.error("Không thể tải thông tin chi tiết chính sách!");
    }
  };

  const handleAddNew = () => {
    setEditingPolicy({ ...DEFAULT_POLICY, restaurantId });
  };

  const handleSubmitPolicy = async (e) => {
    e.preventDefault();
    if (!editingPolicy) return;

    try {
      if (editingPolicy.id) {
        await reservationPolicyApi.update(editingPolicy.id, editingPolicy);
        toast.success("Cập nhật chính sách thành công!");
        // Gọi lại chi tiết sau khi update để đồng bộ
        handleSelectPolicy(editingPolicy.id);
      } else {
        const res = await reservationPolicyApi.create(editingPolicy);
        const created = res.data?.data || res.data;
        if (created?.id) {
          // Lấy luôn chi tiết của thằng vừa tạo
          handleSelectPolicy(created.id);
        }
        toast.success("Tạo mới chính sách thành công!");
      }
      fetchPolicies();
    } catch (err) {
      console.error("Lỗi lưu chính sách: ", err);
      toast.error("Có lỗi xảy ra trong quá trình lưu!");
    }
  };

  if (loading && policies.length === 0) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Đang tải dữ liệu chính sách...</div>;
  }

  return (
    <div
      style={{
        display: "grid",
        gap: "2rem",
        alignItems: "start",
        padding: "0 1rem"
      }}
    >
      {/* 🟢 Bên trái: Khi click một item, onSelect sẽ nhận vào id của policy đó */}
      <PolicyResList
        policies={policies}
        selectedId={editingPolicy?.id}
        onSelect={(policy) => handleSelectPolicy(policy.id)} // Truyền ID vào hàm getDetail
        onAddNew={handleAddNew}
      />

      {/* Bên phải: Form hiển thị chi tiết */}
      <div style={{ minWidth: 0 }}>
        {editingPolicy ? (
          <PolicyFormWithExtras
            restaurantId={restaurantId}
            policy={editingPolicy}
            onChange={setEditingPolicy}
            onSubmit={handleSubmitPolicy}
            onCancel={() => setEditingPolicy(null)}
            onRefresh={() => handleSelectPolicy(editingPolicy.id)} // Con thêm/xoá bậc cọc thì re-fetch lại detail combo
          />
        ) : (
          <div
            style={{
              border: "2px dashed rgba(0,0,0,0.1)",
              borderRadius: 8,
              padding: "4rem 2rem",
              textAlign: "center",
              color: "rgba(0,0,0,0.4)"
            }}
          >
            💡 Chọn một chính sách từ danh sách bên trái hoặc nhấn nút tạo mới để cấu hình thông tin chi tiết.
          </div>
        )}
      </div>
    </div>
  );
}

export default PolicyResTab;
export { PolicyResTab };