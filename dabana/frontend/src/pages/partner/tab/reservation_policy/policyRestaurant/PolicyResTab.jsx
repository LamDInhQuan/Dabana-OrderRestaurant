// src/reservation_policy/policyRestaurant/PolicyResTab.jsx (hoặc file Container tương ứng của bạn)
import React, { useState, useEffect } from "react";
import PolicyResList from "./component/PolicyResList";
import PolicyFormModal from "./component/PolicyFormModal";

// Import API get detail từ service của bạn
import { reservationPolicyApi } from "../../../../../api";

function PolicyResTab({ restaurantId }) {
  const [policies, setPolicies] = useState([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState(null);
  const [policyDetail, setPolicyDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch danh sách policy khi load trang
  useEffect(() => {
    fetchPolicyList();
  }, []);

  const fetchPolicyList = async () => {
    try {
      const res = await reservationPolicyApi.getAll(restaurantId);
      setPolicies(res.data.data || res);
    } catch (err) {
      console.error("Lỗi lấy danh sách policy:", err);
    }
  };

  // 🔥 1. HÀM CLICK CHỌN ITEM BÊN LIST -> GỌI API DETAIL
  const handleSelectPolicy = async (policy) => {
    console.log("Đã click policy:", policy);
    setSelectedPolicyId(policy.id);
    setLoadingDetail(true);

    try {
      // Gọi API lấy chi tiết
      const detail = await reservationPolicyApi.getDetail(restaurantId ,policy.id);
      console.log("Dữ liệu detail nhận được từ API:", detail);

      // Cập nhật state detail để truyền vào Form bên phải
      setPolicyDetail(detail.data || detail);
    } catch (error) {
      console.error("Lỗi khi gọi API get detail:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  // 🔥 2. HÀM NÚT "TẠO CHÍNH SÁCH KHUNG"
  const handleAddNew = () => {
    setSelectedPolicyId(null);
    setPolicyDetail(null); // Clear detail để form chuyển sang mode Tạo mới
  };

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      {/* CỘT TRÁI: DANH SÁCH */}
      <PolicyResList
        policies={policies}
        selectedId={selectedPolicyId}
        onSelect={handleSelectPolicy} // 👈 Đảm bảo truyền đúng tên prop onSelect
        onAddNew={handleAddNew}
      />

      {/* CỘT PHẢI: FORM HIỂN THỊ / SỬA / TẠO */}
      <div style={{ background: "#fff", padding: "1.5rem", borderRadius: 12, border: "1px solid #ECE4D3" }}>
        {loadingDetail ? (
          <div style={{ padding: "2rem", textAlign: "center", color: "#8A8272" }}>
            Đang tải thông tin chi tiết policy...
          </div>
        ) : (
          <PolicyFormModal
            key={policyDetail?.id || "new"} // 🔥 Mẹo: Thêm key này giúp React re-render lại toàn bộ Form state khi đổi policy khác nhau
            initialData={policyDetail}
            onSave={(formData) => {
              console.log("Save policy data:", formData);
              // Call API create / update ở đây
            }}
            onClose={() => setPolicyDetail(null)}
          />
        )}
      </div>
    </div>
  );
}

export default PolicyResTab;