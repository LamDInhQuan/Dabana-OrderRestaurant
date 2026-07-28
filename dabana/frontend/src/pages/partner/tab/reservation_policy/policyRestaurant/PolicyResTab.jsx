// src/reservation_policy/policyRestaurant/PolicyResTab.jsx
import React, { useState, useEffect } from "react";
import PolicyResList from "./component/PolicyResList";
import PolicyFormModal from "./component/PolicyFormModal";
import { reservationPolicyApi } from "../../../../../api";

function PolicyResTab({ restaurantId }) {
  const [policies, setPolicies] = useState([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState(null);
  const [policyDetail, setPolicyDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (restaurantId) {
      fetchPolicyList();
    }
  }, [restaurantId]);

  const fetchPolicyList = async () => {
    try {
      const res = await reservationPolicyApi.getAll(restaurantId);
      setPolicies(res.data?.data || res.data || res);
    } catch (err) {
      console.error("Lỗi lấy danh sách policy:", err);
    }
  };

  // 🟢 HÀM MỚI: Tải lại chi tiết của policy đang mở trong Modal
  const fetchPolicyDetail = async () => {
    const policyIdToFetch = selectedPolicyId || policyDetail?.id;
    if (!restaurantId || !policyIdToFetch) return;

    try {
      const detail = await reservationPolicyApi.getDetail(restaurantId, policyIdToFetch);
      const data = detail.data?.data || detail.data || detail;
      setPolicyDetail(data); // Update state policyDetail -> trigger re-render Modal
    } catch (error) {
      console.error("Lỗi khi refetch detail policy:", error);
    }
  };

  const handleOpenEdit = async (policy) => {
    setSelectedPolicyId(policy.id);
    setLoadingDetail(true);
    setIsModalOpen(true);

    try {
      const detail = await reservationPolicyApi.getDetail(restaurantId, policy.id);
      setPolicyDetail(detail.data?.data || detail.data || detail);
    } catch (error) {
      console.error("Lỗi khi gọi API get detail:", error);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAddNew = () => {
    setSelectedPolicyId(null);
    setPolicyDetail(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPolicyId(null);
    setPolicyDetail(null);
  };

  const handleSavePolicy = async (formData) => {
    try {
      if (formData.id) {
        await reservationPolicyApi.update(restaurantId, formData.id, formData);
        alert("Cập nhật chính sách thành công!");
      } else {
        const payload = { ...formData, restaurantId };
        const response = await reservationPolicyApi.create(restaurantId, payload);
        alert("Tạo mới chính sách thành công!");
        const createdData = response.data?.data || response.data || response;
        if (createdData?.id) {
          setSelectedPolicyId(createdData.id);
          setPolicyDetail(createdData);
        }
      }
      await fetchPolicyList();
    } catch (error) {
      console.error("Lỗi khi lưu policy:", error);
      alert(error.response?.data?.message || "Lỗi khi lưu chính sách!");
    }
  };

  return (
    <div style={{ padding: "1rem" }}>
      <PolicyResList
        policies={policies}
        onSelect={handleOpenEdit}
        onAddNew={handleAddNew}
      />

      {isModalOpen && (
        <PolicyFormModal
          // 🔴 BỎ KEY NÀY ĐI HOẶC CHỈ ĐỂ policyDetail?.id NẾU CẦN RESET
          // key={policyDetail?.id || "new"} 
          restaurantId={restaurantId}
          initialData={policyDetail}
          loading={loadingDetail}
          onSave={handleSavePolicy}
          onRefresh={fetchPolicyDetail} // 🟢 ĐỔI THÀNH fetchPolicyDetail VÀO ĐÂY!
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}

export default PolicyResTab;